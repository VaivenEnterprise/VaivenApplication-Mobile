#!/usr/bin/env node
// Spec 016 · T001 — Cuenta suites y casos de Jest por tipo (unitaria, integración, seguridad).
// Sin dependencias. Uso:
//   node scripts/test-report.mjs                 ejecuta Jest y cuenta
//   node scripts/test-report.mjs --from <json>   cuenta un resultado `jest --json` ya existente
//   --salida <ruta>                              dónde guardar el conteo (por defecto docs/calidad/conteo.json)
// Nunca informa lo que no corrió: si una suite no se pudo ejecutar, termina con código 1.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const TIPOS = ['unitarias', 'integración', 'seguridad'];

/** Clasifica un archivo de prueba por su nombre (plan P-02). La seguridad manda sobre la integración. */
export function clasificar(ruta) {
  const r = ruta.replace(/\\/g, '/');
  if (/\.security\.test\.[jt]sx?$/.test(r)) return 'seguridad';
  if (
    /\.(integration|wiring)\.test\.[jt]sx?$/.test(r) ||
    /(^|\/)flow\.test\.[jt]sx?$/.test(r) ||
    /(^|\/)__e2e__\//.test(r)
  ) {
    return 'integración';
  }
  return 'unitarias';
}

const vacio = () => ({ suites: 0, casos: 0, pasaron: 0, fallaron: 0, omitidas: 0 });

/** Resume el JSON de `jest --json`. `raiz` vuelve relativas las rutas absolutas. */
export function resumir(json, raiz = '') {
  const porTipo = Object.fromEntries(TIPOS.map((t) => [t, vacio()]));
  const noEjecutadas = [];
  const archivos = [];
  for (const suite of json.testResults ?? []) {
    const ruta = raiz ? relative(raiz, suite.name).replace(/\\/g, '/') : suite.name;
    const casos = suite.assertionResults ?? [];
    if (casos.length === 0 && suite.status === 'failed') {
      noEjecutadas.push({
        ruta,
        motivo: (suite.message ?? 'la suite no se pudo ejecutar').split('\n')[0],
      });
      continue;
    }
    const tipo = clasificar(ruta);
    const t = porTipo[tipo];
    t.suites += 1;
    for (const c of casos) {
      t.casos += 1;
      if (c.status === 'passed') t.pasaron += 1;
      else if (c.status === 'failed') t.fallaron += 1;
      else t.omitidas += 1;
    }
    archivos.push({ ruta, tipo, casos: casos.length });
  }
  const total = vacio();
  for (const t of Object.values(porTipo)) for (const k of Object.keys(total)) total[k] += t[k];
  return { porTipo, total, noEjecutadas, archivos };
}

export function formatear(resumen, extra = {}) {
  const filas = TIPOS.map((t) => {
    const r = resumen.porTipo[t];
    return `| ${t} | ${r.suites} | ${r.casos} | ${r.pasaron} | ${r.fallaron} | ${r.omitidas} |`;
  });
  const T = resumen.total;
  const lineas = [
    '| Tipo | Suites | Casos | Pasaron | Fallaron | Omitidas |',
    '|---|---|---|---|---|---|',
    ...filas,
    `| **Total** | ${T.suites} | ${T.casos} | ${T.pasaron} | ${T.fallaron} | ${T.omitidas} |`,
  ];
  if (extra.cobertura) lineas.push('', `Cobertura: ${extra.cobertura}`);
  for (const n of resumen.noEjecutadas) lineas.push(`NO EJECUTADA: ${n.ruta} — ${n.motivo}`);
  return lineas.join('\n');
}

export function veredicto(resumen) {
  return resumen.noEjecutadas.length === 0 && resumen.total.fallaron === 0;
}

function coberturaDe(raiz) {
  const f = join(raiz, 'coverage', 'coverage-summary.json');
  if (!existsSync(f)) return undefined;
  const t = JSON.parse(readFileSync(f, 'utf8')).total;
  return `sentencias ${t.statements.pct} %, ramas ${t.branches.pct} %, funciones ${t.functions.pct} %, líneas ${t.lines.pct} %`;
}

function main(argv) {
  const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const iFrom = argv.indexOf('--from');
  let jsonRuta;
  let comando;
  if (iFrom >= 0) {
    jsonRuta = resolve(argv[iFrom + 1]);
    comando = `--from ${argv[iFrom + 1]}`;
  } else {
    jsonRuta = join(raiz, 'coverage', 'jest-resultados.json');
    mkdirSync(dirname(jsonRuta), { recursive: true });
    const extra = argv.filter(
      (a, i) => a !== '--' && a !== '--salida' && argv[i - 1] !== '--salida',
    );
    const args = [
      'jest',
      '--coverage',
      '--coverageReporters=json-summary',
      '--json',
      `--outputFile=coverage/jest-resultados.json`,
      ...extra,
    ];
    comando = `npx ${args.join(' ')}`;
    const r = spawnSync('npx', args, {
      cwd: raiz,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    if (!existsSync(jsonRuta)) {
      console.error('Jest no produjo resultados: no se informa ningún conteo.');
      return 1;
    }
    if (r.status === null)
      console.error('Jest terminó de forma anómala; se cuenta lo que escribió.');
  }
  const json = JSON.parse(readFileSync(jsonRuta, 'utf8'));
  const resumen = resumir(json, raiz);
  const cobertura = iFrom >= 0 ? undefined : coberturaDe(raiz);
  console.log('\n' + formatear(resumen, { cobertura }));
  const iSalida = argv.indexOf('--salida');
  const salida =
    iSalida >= 0 ? resolve(argv[iSalida + 1]) : join(raiz, 'docs', 'calidad', 'conteo.json');
  mkdirSync(dirname(salida), { recursive: true });
  writeFileSync(
    salida,
    JSON.stringify(
      { fecha: new Date().toISOString(), comando, cobertura: cobertura ?? null, ...resumen },
      null,
      2,
    ) + '\n',
  );
  const ok = veredicto(resumen);
  if (!ok)
    console.error(
      '\nHay pruebas fallidas o suites sin ejecutar: el conteo NO es un resultado en verde.',
    );
  return ok ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
