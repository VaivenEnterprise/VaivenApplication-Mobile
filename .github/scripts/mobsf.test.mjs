import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {evaluate, findings, isTestCode} from './mobsf.mjs';
const result = (ruleId, uri, level) => ({ruleId, ...(level ? {level} : {}), locations: [{physicalLocation: {artifactLocation: {uri}, region: {startLine: 7}}}]});
const sarif = (...results) => ({runs: [{tool: {driver: {name: 'mobsfscan', rules: [{id: 'js_hardcoded_secret', defaultConfiguration: {level: 'error'}}, {id: 'js_cleartext_http_traffic', defaultConfiguration: {}}]}}, results}]});
const exception = (rule, file, expires = '2027-02-27') => ({rule, file, reason: 'justificacion', approvedBy: 'persona', expires});
const today = '2026-11-27';
test('sin level toma el de la regla y, si no hay, warning; normaliza rutas de Windows', () => {
  const [a, b] = findings(sarif(result('js_hardcoded_secret', String.raw`src\lib\a.ts`), result('js_cleartext_http_traffic', './src/b.ts')));
  assert.deepEqual([a.level, a.file], ['error', 'src/lib/a.ts']);
  assert.deepEqual([b.level, b.file], ['warning', 'src/b.ts']);
});
test('las pruebas y sus dobles no cuentan; el codigo de la app si', () => {
  for (const file of ['src/lib/api/client.test.ts', 'src/a.security.test.tsx', 'src/test/fakeApi.ts', 'src/__e2e__/fakeApi.ts', 'src/__a11y__/a11y.test.tsx', 'src/__arch__/rules.ts']) assert.ok(isTestCode(file), file);
  for (const file of ['src/lib/api/client.ts', 'src/features/test-utils.ts', 'src/features/auth/latest.ts', 'app.config.ts']) assert.ok(!isTestCode(file), file);
});
test('bloquea error y warning del codigo de la app; ignora los de pruebas', () => {
  const r = evaluate(sarif(result('js_hardcoded_secret', 'src/a.test.ts'), result('js_cleartext_http_traffic', 'src/test/fakeApi.ts'), result('js_cleartext_http_traffic', 'src/lib/config.ts'), result('js_hardcoded_secret', 'src/lib/keys.ts')), [], today);
  assert.deepEqual(r.blocking.map(f => f.file), ['src/lib/config.ts', 'src/lib/keys.ts']);
  assert.equal(r.tests, 2);
});
test('un hallazgo note es informativo y no bloquea', () => {
  const r = evaluate(sarif(result('js_cleartext_http_traffic', 'src/lib/config.ts', 'note')), [], today);
  assert.equal(r.blocking.length, 0);
  assert.match(r.notes.join('\n'), /Informativo/);
});
test('una excepcion vigente acepta solo su regla en su archivo', () => {
  const r = evaluate(sarif(result('js_cleartext_http_traffic', 'src/a.ts'), result('js_cleartext_http_traffic', 'src/b.ts'), result('js_hardcoded_secret', 'src/a.ts')), [exception('js_cleartext_http_traffic', 'src/a.ts')], today);
  assert.deepEqual(r.blocking.map(f => f.rule + ' ' + f.file), ['js_cleartext_http_traffic src/b.ts', 'js_hardcoded_secret src/a.ts']);
});
test('una excepcion vencida o incompleta falla y no acepta nada', () => {
  const expired = evaluate(sarif(result('js_cleartext_http_traffic', 'src/a.ts')), [exception('js_cleartext_http_traffic', 'src/a.ts', '2026-11-26')], today);
  assert.equal(expired.errors.length, 1);
  assert.equal(expired.blocking.length, 1);
  assert.equal(evaluate(sarif(), [{rule: 'x', file: 'src/a.ts', reason: 'r', expires: '2027-01-01'}], today).errors.length, 1);
});
test('una excepcion sin hallazgo se informa para quitarla', () => {
  assert.match(evaluate(sarif(), [exception('js_cleartext_http_traffic', 'src/a.ts')], today).notes.join('\n'), /ya no aplica/);
});
test('un SARIF sin runs falla (el analisis no corrio)', () => {
  assert.equal(evaluate({}, [], today).errors.length, 1);
});
test('las excepciones versionadas estan completas y vigentes', () => {
  const items = JSON.parse(fs.readFileSync(new URL('../mobsf-exceptions.json', import.meta.url), 'utf8'));
  assert.equal(evaluate(sarif(), items, new Date().toISOString().slice(0, 10)).errors.length, 0);
  for (const item of items) assert.ok(!isTestCode(item.file) && fs.existsSync(new URL('../../' + item.file, import.meta.url)), item.file);
});
