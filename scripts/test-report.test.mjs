import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  archivosDeCodigo,
  archivosMedidos,
  clasificar,
  formatear,
  resumir,
  veredicto,
} from './test-report.mjs';
import { fileURLToPath } from 'node:url';

test('clasifica por nombre de archivo', () => {
  assert.equal(clasificar('src/lib/api/client.test.ts'), 'unitarias');
  assert.equal(clasificar('src/features/auth/session.integration.test.tsx'), 'integración');
  assert.equal(clasificar('src/features/reports/reports.wiring.test.tsx'), 'integración');
  assert.equal(clasificar('src/features/recommendations/flow.test.tsx'), 'integración');
  assert.equal(clasificar('src/__e2e__/journey.integration.test.tsx'), 'integración');
  assert.equal(clasificar('src/lib/storage/secureStorage.security.test.ts'), 'seguridad');
  assert.equal(clasificar('src\\lib\\x.security.test.ts'), 'seguridad');
  assert.equal(clasificar('src/features/home/flowchart.test.tsx'), 'unitarias');
});

const caso = (status) => ({ status });
const json = {
  testResults: [
    {
      name: '/r/src/a.test.ts',
      status: 'passed',
      assertionResults: [caso('passed'), caso('passed')],
    },
    {
      name: '/r/src/b.integration.test.tsx',
      status: 'passed',
      assertionResults: [caso('passed'), caso('pending')],
    },
    { name: '/r/src/c.security.test.ts', status: 'passed', assertionResults: [caso('passed')] },
  ],
};

test('cuenta suites y casos por tipo', () => {
  const r = resumir(json, '/r');
  assert.deepEqual(r.porTipo.unitarias, {
    suites: 1,
    casos: 2,
    pasaron: 2,
    fallaron: 0,
    omitidas: 0,
  });
  assert.deepEqual(r.porTipo['integración'], {
    suites: 1,
    casos: 2,
    pasaron: 1,
    fallaron: 0,
    omitidas: 1,
  });
  assert.equal(r.porTipo.seguridad.casos, 1);
  assert.equal(r.total.casos, 5);
  assert.equal(veredicto(r), true);
});

test('una suite que no corre hace fallar el veredicto y no se cuenta', () => {
  const j = {
    testResults: [
      ...json.testResults,
      {
        name: '/r/src/d.test.ts',
        status: 'failed',
        message: 'Cannot find module',
        assertionResults: [],
      },
    ],
  };
  const r = resumir(j, '/r');
  assert.equal(r.noEjecutadas.length, 1);
  assert.equal(r.total.suites, 3);
  assert.equal(veredicto(r), false);
  assert.match(formatear(r), /NO EJECUTADA: src\/d\.test\.ts/);
});

test('un caso fallido hace fallar el veredicto', () => {
  const j = {
    testResults: [
      { name: '/r/src/a.test.ts', status: 'failed', assertionResults: [caso('failed')] },
    ],
  };
  assert.equal(veredicto(resumir(j, '/r')), false);
});

test('archivosDeCodigo lista el código de src sin pruebas ni .d.ts', () => {
  const arbol = {
    src: [
      { name: 'a.ts', isDirectory: () => false },
      { name: 'a.test.ts', isDirectory: () => false },
      { name: 'tipos.d.ts', isDirectory: () => false },
      { name: 'features', isDirectory: () => true },
    ],
    'src/features': [
      { name: 'hooks.ts', isDirectory: () => false },
      { name: 'Pantalla.tsx', isDirectory: () => false },
      { name: 'Pantalla.test.tsx', isDirectory: () => false },
      { name: 'README.md', isDirectory: () => false },
    ],
  };
  const leerDir = (d) => arbol[d.replace(/\\/g, '/').replace(/^\/r\//, '')];
  assert.deepEqual(archivosDeCodigo('/r', leerDir).sort(), [
    'src/a.ts',
    'src/features/Pantalla.tsx',
    'src/features/hooks.ts',
  ]);
});

test('archivosMedidos cuenta cuántos archivos mide la cobertura de cuántos existen', () => {
  const existentes = ['src/a.ts', 'src/features/hooks.ts', 'src/features/Pantalla.tsx'];
  const summary = {
    total: {},
    '/r/src/a.ts': {},
    '/r/src/features/hooks.ts': {},
    '/r/src/fuera.ts': {},
  };
  assert.deepEqual(archivosMedidos(summary, existentes, '/r'), {
    medidos: 2,
    existentes: 3,
    sinCodigo: 1,
  });
});

test('el repositorio real tiene cientos de archivos de código y los hooks están entre ellos', () => {
  const raiz = fileURLToPath(new URL('..', import.meta.url));
  const archivos = archivosDeCodigo(raiz);
  assert.ok(archivos.length > 200);
  assert.ok(archivos.includes('src/features/auth/session.tsx'));
});
