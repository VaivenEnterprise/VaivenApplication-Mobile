import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clasificar, resumir, formatear, veredicto } from './test-report.mjs';

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
