import fs from 'node:fs';
import {pathToFileURL} from 'node:url';

// Spec 021-T022 (RF-21): decide el resultado del analisis estatico movil (mobsfscan, SARIF 2.1.0).
// Bloquea todo hallazgo `error` o `warning` del codigo que se empaqueta en la app, salvo los
// aceptados en .github/mobsf-exceptions.json (regla + archivo, con motivo, aprobacion y vencimiento).
// Las pruebas y sus dobles no se empaquetan: sus URLs `http://` y secretos falsos se cuentan aparte.

const BLOCKING = new Set(['error', 'warning']);
const TEST_CODE = /^src\/(test|__e2e__|__a11y__|__arch__)\/|\.test\.[cm]?[jt]sx?$/;

export const isTestCode = file => TEST_CODE.test(file);

// Hallazgos planos del SARIF. Sin `level`, SARIF toma el de la regla y, si tampoco lo hay, `warning`.
export function findings(sarif) {
  const found = [];
  for (const run of sarif.runs || []) {
    const rules = run.tool?.driver?.rules || [];
    for (const result of run.results || []) {
      const rule = rules.find(r => r.id === result.ruleId);
      const location = result.locations?.[0]?.physicalLocation;
      found.push({
        rule: result.ruleId,
        file: (location?.artifactLocation?.uri || '').replace(/\\/g, '/').replace(/^\.\//, ''),
        line: location?.region?.startLine,
        level: result.level || rule?.defaultConfiguration?.level || 'warning',
      });
    }
  }
  return found;
}

export function evaluate(sarif, exceptions, today) {
  const errors = [];
  const notes = [];
  if (!Array.isArray(sarif.runs) || !sarif.runs.length) return {blocking: [], errors: ['mobsfscan no genero resultados SARIF.'], notes, tests: 0};
  const accepted = [];
  for (const item of exceptions) {
    if (!item.rule || !item.file || !item.reason || !item.approvedBy || !item.expires) { errors.push('Excepcion incompleta (rule, file, reason, approvedBy y expires son obligatorios): ' + JSON.stringify(item)); continue; }
    if (item.expires < today) { errors.push('Excepcion vencida el ' + item.expires + ': ' + item.rule + ' en ' + item.file + '. Corrige el hallazgo o renueva con justificacion.'); continue; }
    accepted.push(item);
  }
  const all = findings(sarif);
  const app = all.filter(f => !isTestCode(f.file));
  const covered = f => accepted.some(a => a.rule === f.rule && a.file === f.file);
  for (const a of accepted) if (!app.some(f => f.rule === a.rule && f.file === a.file)) notes.push('La excepcion ' + a.rule + ' en ' + a.file + ' ya no aplica; puedes quitarla.');
  for (const f of app.filter(f => BLOCKING.has(f.level) && covered(f))) notes.push('Aceptado hasta su vencimiento: ' + f.rule + ' en ' + f.file + ':' + f.line + '.');
  for (const f of app.filter(f => !BLOCKING.has(f.level))) notes.push('Informativo: ' + f.rule + ' en ' + f.file + ':' + f.line + '.');
  const blocking = app.filter(f => BLOCKING.has(f.level) && !covered(f));
  return {blocking, errors, notes, tests: all.length - app.length};
}

function run() {
  const [sarifPath = 'mobsfscan.sarif'] = process.argv.slice(2);
  const exceptions = JSON.parse(fs.readFileSync('.github/mobsf-exceptions.json', 'utf8'));
  const today = new Date().toISOString().slice(0, 10);
  const {blocking, errors, notes, tests} = evaluate(JSON.parse(fs.readFileSync(sarifPath, 'utf8')), exceptions, today);
  notes.forEach(note => console.log(note));
  console.log('Hallazgos en pruebas y dobles de prueba (no se empaquetan): ' + tests + '.');
  errors.forEach(error => console.error('ERROR: ' + error));
  blocking.forEach(f => console.error('ERROR: ' + f.level + ' ' + f.rule + ' en ' + f.file + ':' + f.line));
  if (blocking.length || errors.length) process.exit(1);
  console.log('mobsfscan: sin hallazgos error/warning sin excepcion en el codigo de la app.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) run();
