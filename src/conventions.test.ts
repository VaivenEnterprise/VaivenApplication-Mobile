/// <reference types="node" />
// Prueba de convención (plan P-11, RNF-04, Art. V y VII): fuera de `src/theme/` e `src/i18n/`
// no puede haber colores literales ni texto visible literal dentro de JSX.
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as ts from 'typescript';

const SRC = __dirname;
const EXEMPT_DIRS = ['theme', 'i18n'];
const COLOR_PATTERN = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b|\b(?:rgb|rgba|hsl|hsla)\(/i;
/** Propiedades JSX cuyo valor ve la persona (o lo lee un lector de pantalla). */
const VISIBLE_PROPS = new Set([
  'label',
  'title',
  'placeholder',
  'accessibilityLabel',
  'accessibilityHint',
  'alt',
  'description',
  'subtitle',
  'message',
  'text',
]);
const HAS_LETTER = /\p{L}/u;

export type Violation = { kind: 'color' | 'text'; text: string; line: number };

/** Devuelve los colores y textos visibles literales de un archivo TS/TSX. */
export function findViolations(fileName: string, code: string): Violation[] {
  const kind = fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true, kind);
  const found: Violation[] = [];
  const lineOf = (node: ts.Node) => source.getLineAndCharacterOfPosition(node.getStart()).line + 1;

  const visit = (node: ts.Node): void => {
    if (ts.isStringLiteralLike(node) && COLOR_PATTERN.test(node.text)) {
      found.push({ kind: 'color', text: node.text, line: lineOf(node) });
    }
    if (ts.isTemplateExpression(node) && COLOR_PATTERN.test(node.head.text)) {
      found.push({ kind: 'color', text: node.head.text, line: lineOf(node) });
    }
    if (ts.isJsxText(node) && HAS_LETTER.test(node.text)) {
      found.push({ kind: 'text', text: node.text.trim(), line: lineOf(node) });
    }
    if (
      ts.isJsxExpression(node) &&
      node.expression !== undefined &&
      ts.isJsxElement(node.parent) &&
      ts.isStringLiteralLike(node.expression) &&
      HAS_LETTER.test(node.expression.text)
    ) {
      found.push({ kind: 'text', text: node.expression.text, line: lineOf(node) });
    }
    if (ts.isJsxAttribute(node) && VISIBLE_PROPS.has(node.name.getText(source))) {
      const init = node.initializer;
      const literal =
        init !== undefined && ts.isStringLiteral(init)
          ? init
          : init !== undefined &&
              ts.isJsxExpression(init) &&
              init.expression !== undefined &&
              ts.isStringLiteralLike(init.expression)
            ? init.expression
            : undefined;
      if (literal !== undefined && HAS_LETTER.test(literal.text)) {
        found.push({ kind: 'text', text: literal.text, line: lineOf(node) });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

function listSourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const exempt = dir === SRC && EXEMPT_DIRS.includes(entry.name);
      return exempt ? [] : listSourceFiles(full);
    }
    const isCode = /\.(ts|tsx)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name);
    return isCode && !entry.name.endsWith('.d.ts') ? [full] : [];
  });
}

describe('convención de diseño y textos (RNF-04)', () => {
  it('el código de la app no tiene colores ni textos visibles literales', () => {
    const files = listSourceFiles(SRC);
    expect(files.length).toBeGreaterThan(0);
    const report = files.flatMap((file) =>
      findViolations(file, fs.readFileSync(file, 'utf8')).map(
        (v) => `${path.relative(SRC, file)}:${v.line} [${v.kind}] ${v.text}`,
      ),
    );
    expect(report).toEqual([]);
  });

  it('revisa los componentes y las pantallas (no está vacía por error)', () => {
    const files = listSourceFiles(SRC).map((f) => path.relative(SRC, f).replace(/\\/g, '/'));
    expect(files).toEqual(
      expect.arrayContaining(['components/ui/Button.tsx', 'app/index.tsx', 'lib/config.ts']),
    );
    expect(files.some((f) => f.startsWith('theme/') || f.startsWith('i18n/'))).toBe(false);
  });
});

describe('findViolations (el detector funciona)', () => {
  it.each(['#C24E24', '#fff', '#FFFFFF80', 'rgba(0,0,0,0.5)', 'rgb(1, 2, 3)'])(
    'detecta el color literal %s',
    (color) => {
      const found = findViolations('a.ts', `export const c = '${color}';`);
      expect(found.map((v) => v.kind)).toEqual(['color']);
    },
  );

  it('detecta un color dentro de una plantilla', () => {
    const found = findViolations('a.ts', 'export const c = `#C24E24 ${1}`;');
    expect(found).toHaveLength(1);
  });

  it('detecta texto literal en JSX, en expresiones y en propiedades visibles', () => {
    const code = [
      'export const A = () => (',
      '  <View>',
      '    <Text>Hola</Text>',
      "    <Text>{'Adiós'}</Text>",
      '    <Button label="Entrar" accessibilityLabel={"Cerrar"} />',
      '  </View>',
      ');',
    ].join('\n');
    const found = findViolations('a.tsx', code);
    expect(found.map((v) => v.text)).toEqual(['Hola', 'Adiós', 'Entrar', 'Cerrar']);
  });

  it('no marca valores que no son texto visible', () => {
    const code = [
      'export const A = ({ t }: { t: string }) => (',
      '  <View style={{ flex: 1 }} accessibilityRole="button" testID="x">',
      '    <Text variant="heading">{t}</Text>',
      '    <Text>{es.home.title}</Text>',
      '    <Text> </Text>',
      '    {cond ? <B /> : null}',
      '  </View>',
      ');',
      "export const n = 'unidad-de-lectura';",
    ].join('\n');
    expect(findViolations('a.tsx', code)).toEqual([]);
  });

  it('un color que no lo es no se marca (identificador con #, número)', () => {
    expect(
      findViolations('a.ts', "export const s = 'item #12 de 3'; export const n = 123;"),
    ).toEqual([]);
  });
});
