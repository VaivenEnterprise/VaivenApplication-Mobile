import {test} from 'node:test';
import assert from 'node:assert/strict';
import {advisories, evaluate} from './audit.mjs';
const via = (id, severity = 'high', name = 'pkg') => ({source: 1, name, title: 't', url: 'https://github.com/advisories/' + id, severity});
const report = (...items) => ({vulnerabilities: Object.fromEntries(items.map((v, i) => ['p' + i, {via: [v, 'otro']}]))});
const exception = (id, expires = '2026-12-18') => ({id, reason: 'justificacion', expires});
test('cuenta cada aviso una sola vez e ignora las referencias de texto', () => {
  assert.equal(advisories(report(via('GHSA-a'), via('GHSA-a'), via('GHSA-b'))).length, 2);
});
test('bloquea high y critical sin excepcion, no moderate', () => {
  assert.equal(evaluate(report(via('GHSA-a', 'high')), [], '2026-11-18').blocking.length, 1);
  assert.equal(evaluate(report(via('GHSA-a', 'critical')), [], '2026-11-18').blocking.length, 1);
  assert.equal(evaluate(report(via('GHSA-a', 'moderate')), [], '2026-11-18').blocking.length, 0);
});
test('una excepcion vigente tolera solo su aviso', () => {
  const result = evaluate(report(via('GHSA-a'), via('GHSA-b')), [exception('GHSA-a')], '2026-11-18');
  assert.deepEqual(result.blocking.map(a => a.id), ['GHSA-b']);
});
test('una excepcion vencida o incompleta falla', () => {
  assert.equal(evaluate(report(via('GHSA-a')), [exception('GHSA-a', '2026-11-17')], '2026-11-18').errors.length, 1);
  assert.equal(evaluate(report(via('GHSA-a')), [{id: 'GHSA-a'}], '2026-11-18').errors.length, 1);
  assert.equal(evaluate(report(via('GHSA-a')), [exception('GHSA-a', '2026-11-17')], '2026-11-18').blocking.length, 1);
});
test('un informe con error de npm falla', () => {
  assert.equal(evaluate({error: {summary: 'sin red'}}, [], '2026-11-18').errors.length, 1);
});
