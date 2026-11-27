import fs from 'node:fs';
import path from 'node:path';

// Spec 016 · S-12 y S-08 (OWASP M2 cadena de suministro y configuración, M8 mala configuración
// de seguridad, M6 privacidad): reglas estáticas sobre el código. Leen archivos, no los ejecutan.
// Los casos negativos usan texto en memoria: nunca hay código prohibido en el repositorio.

const ROOT = path.resolve(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');

type Rule = {
  id: string;
  describe: string;
  /** Devuelve las líneas (1-based) que violan la regla en `text` de `file` (ruta relativa a `src`). */
  check: (text: string, file: string) => number[];
};

const lines = (text: string, pattern: RegExp): number[] =>
  text
    .split('\n')
    .map((line, i) => (pattern.test(line) ? i + 1 : 0))
    .filter((n) => n > 0);

const codeOnly = (text: string): string =>
  text
    .split('\n')
    .map((l) => (/^\s*(\/\/|\*|\/\*)/.test(l) ? '' : l))
    .join('\n');

export const RULES: Rule[] = [
  {
    id: 'S-12a',
    describe: 'sin AsyncStorage ni localStorage: los secretos solo van a expo-secure-store',
    check: (t) =>
      lines(codeOnly(t), /AsyncStorage|async-storage|\blocalStorage\b|\bsessionStorage\b/),
  },
  {
    id: 'S-12b',
    describe: 'sin `any` explícito ni @ts-ignore / @ts-nocheck',
    check: (t) => lines(codeOnly(t), /:\s*any\b|<any>|\bas any\b|\bany\[\]|@ts-ignore|@ts-nocheck/),
  },
  {
    id: 'S-12c',
    describe: 'sin console.* salvo el error boundary, que solo registra el nombre del error',
    check: (t, file) => {
      const found = lines(codeOnly(t), /\bconsole\.(log|info|warn|error|debug|trace)\b/);
      if (file.replace(/\\/g, '/') !== 'components/AppErrorBoundary.tsx') return found;
      return found.filter(
        (n) =>
          !/console\.error\(`\[AppErrorBoundary\] \$\{error\.name\}`\)/.test(
            t.split('\n')[n - 1] ?? '',
          ),
      );
    },
  },
  {
    id: 'S-12d',
    describe: 'sin variables EXPO_PUBLIC_* con nombres de secreto',
    check: (t) => lines(t, /EXPO_PUBLIC_\w*(KEY|SECRET|TOKEN|PASSWORD|PRIVATE)\w*/i),
  },
  {
    id: 'S-12e',
    describe: 'fetch solo en lib/api/client.ts (Art. II y IV)',
    check: (t, file) =>
      file.replace(/\\/g, '/') === 'lib/api/client.ts'
        ? []
        : lines(codeOnly(t), /(^|[^.\w])fetch\s*\(/),
  },
  {
    id: 'S-08a',
    describe: 'la ubicación nunca se pide con precisión alta',
    check: (t) => lines(codeOnly(t), /Accuracy\.(High|Highest|BestForNavigation)\b/),
  },
];

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(entry.name) &&
      !/\.test\.[jt]sx?$/.test(entry.name) &&
      !entry.name.endsWith('.d.ts')
      ? [full]
      : [];
  });
}

const FILES = walk(SRC)
  // `test/` son ayudantes de prueba (fakeApi, etc.), no código de la app.
  .filter((f) => !path.relative(SRC, f).replace(/\\/g, '/').startsWith('test/'))
  .map((f) => ({ rel: path.relative(SRC, f), text: fs.readFileSync(f, 'utf8') }));

describe('S-12 · M2/M8 · reglas estáticas sobre src/', () => {
  it('S-12 el recorrido ve el código de la app', () => {
    expect(FILES.length).toBeGreaterThan(100);
  });

  it.each(RULES)('$id $describe', (rule) => {
    const violations = FILES.flatMap((f) =>
      rule.check(f.text, f.rel).map((line) => `${f.rel}:${line}`),
    );
    expect(violations).toEqual([]);
  });
});

describe('S-12 · casos negativos: cada regla detecta lo que debe (CA-04)', () => {
  const byId = (id: string) => RULES.find((r) => r.id === id) as Rule;

  it.each([
    ['S-12a', "import AsyncStorage from '@react-native-async-storage/async-storage';"],
    ['S-12a', 'localStorage.setItem("t", token);'],
    ['S-12b', 'const x: any = 1;'],
    ['S-12b', '// @ts-ignore\nconst y = 2;\n@ts-ignore'],
    ['S-12c', 'console.log(user.password);'],
    ['S-12d', 'const k = process.env.EXPO_PUBLIC_API_KEY;'],
    ['S-12d', 'EXPO_PUBLIC_SECRET_TOKEN=abc'],
    ['S-12e', 'const r = await fetch(url);'],
    ['S-08a', 'accuracy: Location.Accuracy.Highest'],
  ])('%s detecta: %s', (id, text) => {
    expect(byId(id).check(text, 'features/x/y.ts').length).toBeGreaterThan(0);
  });

  it('S-12c el error boundary solo puede registrar el nombre del error, nunca el mensaje', () => {
    const rule = byId('S-12c');
    expect(
      rule.check(
        'console.error(`[AppErrorBoundary] ${error.name}`);',
        'components/AppErrorBoundary.tsx',
      ),
    ).toEqual([]);
    expect(rule.check('console.error(error.message);', 'components/AppErrorBoundary.tsx')).toEqual([
      1,
    ]);
  });

  it('las reglas no se disparan con comentarios ni con texto inocuo', () => {
    const limpio =
      '// nunca AsyncStorage ni console.log aquí\nconst a: unknown = 1;\nconst b = request("/x");';
    for (const rule of RULES) expect(rule.check(limpio, 'lib/x.ts')).toEqual([]);
  });
});

describe('S-12 · M8 · permisos y configuración de la app', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const config = require('../../app.config').default as {
    plugins: unknown[];
    android: { blockedPermissions?: string[] };
    ios?: Record<string, unknown>;
  };
  const pluginNames = config.plugins.map((p) => (Array.isArray(p) ? p[0] : p));
  const pluginOptions = (name: string): Record<string, unknown> => {
    const found = config.plugins.find((p) => Array.isArray(p) && p[0] === name) as
      [string, Record<string, unknown>] | undefined;
    return found?.[1] ?? {};
  };

  it('S-12f solo los plugins de permisos declarados (cámara, ubicación, fotos, avisos)', () => {
    expect([...pluginNames].sort()).toEqual(
      [
        'expo-camera',
        'expo-image-picker',
        'expo-location',
        'expo-notifications',
        'expo-router',
        'expo-splash-screen',
      ].sort(),
    );
  });

  it('S-12g sin micrófono y sin ubicación en segundo plano', () => {
    expect(pluginOptions('expo-camera').recordAudioAndroid).toBe(false);
    expect(pluginOptions('expo-image-picker').microphonePermission).toBe(false);
    const location = pluginOptions('expo-location');
    expect(location.isAndroidBackgroundLocationEnabled).toBeUndefined();
    expect(location.locationAlwaysPermission).toBeUndefined();
    expect(location.locationAlwaysAndWhenInUsePermission).toBeUndefined();
    expect(typeof location.locationWhenInUsePermission).toBe('string');
  });

  it('S-08b Android bloquea la ubicación precisa (solo aproximada)', () => {
    expect(config.android.blockedPermissions).toContain('android.permission.ACCESS_FINE_LOCATION');
  });

  it('S-12h cada permiso trae su texto explicativo en español', () => {
    for (const [name, key] of [
      ['expo-camera', 'cameraPermission'],
      ['expo-location', 'locationWhenInUsePermission'],
      ['expo-image-picker', 'photosPermission'],
      ['expo-image-picker', 'cameraPermission'],
    ] as const) {
      expect(String(pluginOptions(name)[key]).length).toBeGreaterThan(20);
    }
  });
});

describe('S-12 · M2/M8 · repositorio sin secretos', () => {
  it('S-12i .env y claves están ignorados por git y no hay archivos sensibles en el árbol', () => {
    const ignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
    expect(ignore).toMatch(/^\.env$/m);
    expect(ignore).toMatch(/^\.env\.\*$/m);
    const sensibles = fs
      .readdirSync(ROOT)
      .filter(
        (n) =>
          /\.(pem|p12|jks|keystore)$/i.test(n) ||
          n === 'google-services.json' ||
          n === 'GoogleService-Info.plist',
      );
    expect(sensibles).toEqual([]);
  });

  it('S-12j .env.example solo declara variables públicas sin valores secretos', () => {
    const example = fs.readFileSync(path.join(ROOT, '.env.example'), 'utf8');
    const vars = example.split('\n').filter((l) => /^[A-Z_]+=/.test(l));
    for (const v of vars) expect(v).toMatch(/^EXPO_PUBLIC_(API_URL|APP_ENV|LEGAL_URL)=/);
    expect(example).not.toMatch(/(secret|password|token)\s*=\s*\S+/i);
  });

  it('S-12k las dependencias no incluyen AsyncStorage', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>;
    };
    expect(Object.keys(pkg.dependencies).filter((d) => /async-storage/.test(d))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------
// Spec 021 · T001 · S-12l y S-12m (integridad de la entrega): ningún archivo versionado trae
// marcadores de conflicto de git y `memoria.md` no repite IDs de decisión. Los marcadores se
// arman con `repeat` para que este archivo no los contenga literalmente.
// ---------------------------------------------------------------------------------------------

const MARK_OURS = '<'.repeat(7);
const MARK_THEIRS = '>'.repeat(7);

/** Líneas (1-based) que abren o cierran un bloque de conflicto de git. */
export const conflictMarkerLines = (text: string): number[] =>
  text
    .split(/\r?\n/)
    .map((line, i) => (line.startsWith(MARK_OURS) || line.startsWith(MARK_THEIRS) ? i + 1 : 0))
    .filter((n) => n > 0);

const TEXT_FILE =
  /\.(md|ts|tsx|js|mjs|cjs|json|ya?ml|txt|ps1|sh|env|example|gitignore)$|(^|\/)\.[\w.-]+$/;
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'coverage',
  '.expo',
  'dist',
  'build',
  'android',
  'ios',
]);

function walkRepo(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return SKIP_DIRS.has(entry.name) ? [] : walkRepo(full);
    const rel = path.relative(ROOT, full).replace(/\\/g, '/');
    // Los logs de ejecución no se versionan ni son documentos de la entrega.
    return TEXT_FILE.test(rel) && !rel.endsWith('.log') && rel !== 'package-lock.json'
      ? [full]
      : [];
  });
}

/** IDs de decisión definidos en `memoria.md` (filas de la tabla y entradas con **D-NNN**). */
export const decisionIds = (text: string): string[] =>
  text.split(/\r?\n/).flatMap((line) => {
    const m =
      /^\|\s*(D-\d{3}[a-z]?)\s*\|/.exec(line) ??
      /^-\s+(?:\[[^\]]+\]\s+)?\*\*(?:\[[^\]]+\]\s+)?(D-\d{3}[a-z]?)\b/.exec(line);
    return m ? [m[1] as string] : [];
  });

export const duplicates = (ids: string[]): string[] => [
  ...new Set(ids.filter((id, i) => ids.indexOf(id) !== i)),
];

describe('S-12l · integridad de la entrega · sin marcadores de conflicto', () => {
  it('S-12l ningún archivo versionado contiene marcadores de conflicto de git', () => {
    const files = walkRepo(ROOT);
    expect(files.length).toBeGreaterThan(100);
    const found = files.flatMap((f) =>
      conflictMarkerLines(fs.readFileSync(f, 'utf8')).map(
        (n) => `${path.relative(ROOT, f).replace(/\\/g, '/')}:${n}`,
      ),
    );
    expect(found).toEqual([]);
  });

  it('S-12l caso negativo: detecta apertura y cierre de un conflicto (LF y CRLF)', () => {
    const conflicto = [
      `${MARK_OURS} Updated upstream`,
      'a',
      '=======',
      'b',
      `${MARK_THEIRS} Stashed changes`,
    ];
    expect(conflictMarkerLines(conflicto.join('\n'))).toEqual([1, 5]);
    expect(conflictMarkerLines(conflicto.join('\r\n'))).toEqual([1, 5]);
  });

  it('S-12l no confunde una cita en línea ni un subrayado de Markdown con un conflicto', () => {
    const limpio = `Texto con \`${MARK_OURS}\` entre comillas\n\nTítulo\n=======\n| ${MARK_THEIRS} |`;
    expect(conflictMarkerLines(limpio)).toEqual([]);
  });
});

describe('S-12m · integridad de la entrega · memoria.md sin IDs de decisión repetidos', () => {
  it('S-12m cada ID D-NNN se define una sola vez', () => {
    const ids = decisionIds(fs.readFileSync(path.join(ROOT, 'memoria.md'), 'utf8'));
    expect(ids.length).toBeGreaterThan(100);
    expect(duplicates(ids)).toEqual([]);
  });

  it('S-12m caso negativo: detecta un ID repetido en tabla y en entradas', () => {
    const memoria = [
      '| D-001 | 2026-10-26 | algo | motivo | Art. I |',
      '- [DISEÑO] **D-206** primera',
      '- **[DISEÑO] D-206 — segunda**',
      '- [DISEÑO] **D-206b** variante distinta',
      '| D-001 | 2026-10-27 | otra | motivo | Art. I |',
    ].join('\r\n');
    expect(decisionIds(memoria)).toEqual(['D-001', 'D-206', 'D-206', 'D-206b', 'D-001']);
    expect(duplicates(decisionIds(memoria)).sort()).toEqual(['D-001', 'D-206']);
  });
});
