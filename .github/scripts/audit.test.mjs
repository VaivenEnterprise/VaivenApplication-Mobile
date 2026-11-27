import {test} from 'node:test';
import assert from 'node:assert/strict';
import {advisories, auditOutput, evaluate, npmAuditCommand} from './audit.mjs';
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
test('en Linux lanza npm directo, sin shell', () => {
  assert.deepEqual(npmAuditCommand('linux'), {file: 'npm', args: ['audit', '--json'], options: {}});
});
test('en Windows lanza npm.cmd con shell y la orden fija, sin argumentos sueltos', () => {
  const command = npmAuditCommand('win32');
  assert.equal(command.options.shell, true);
  assert.equal(command.file, 'npm audit --json');
  assert.deepEqual(command.args, []);
});
test('usa la orden de cada sistema y devuelve la salida de npm', () => {
  for (const platform of ['linux', 'win32']) {
    const calls = [];
    const exec = (file, args, options) => { calls.push({file, args, shell: options.shell === true}); return '{"vulnerabilities":{}}'; };
    assert.equal(auditOutput(exec, platform), '{"vulnerabilities":{}}');
    assert.deepEqual(calls, [{file: npmAuditCommand(platform).file, args: npmAuditCommand(platform).args, shell: platform === 'win32'}]);
  }
});
test('con avisos npm sale con codigo 1 pero su salida se conserva', () => {
  const exec = () => { throw Object.assign(new Error('exit 1'), {status: 1, stdout: '{"vulnerabilities":{}}'}); };
  assert.equal(auditOutput(exec, 'linux'), '{"vulnerabilities":{}}');
});
test('si npm no se puede lanzar falla con mensaje claro (antes: JSON.parse de undefined)', () => {
  const exec = () => { throw Object.assign(new Error('spawnSync npm ENOENT'), {code: 'ENOENT'}); };
  assert.throws(() => auditOutput(exec, 'win32'), /No se pudo ejecutar npm audit \(ENOENT\)/);
});
test('la lista de excepciones versionada esta completa', async () => {
  const fs = await import('node:fs');
  const items = JSON.parse(fs.readFileSync(new URL('../audit-exceptions.json', import.meta.url), 'utf8'));
  assert.ok(Array.isArray(items));
  for (const item of items) assert.ok(item.id && item.reason && item.expires && item.approvedBy, JSON.stringify(item));
});
