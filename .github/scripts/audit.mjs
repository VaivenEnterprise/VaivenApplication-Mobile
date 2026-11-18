import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

const BLOCKING = new Set(['high', 'critical']);

// Avisos unicos (por GHSA) del informe de `npm audit --json`. Las entradas "via" que son texto solo
// propagan el aviso de otro paquete, asi que se ignoran para no contarlo varias veces.
export function advisories(report) {
  const found = new Map();
  for (const entry of Object.values(report.vulnerabilities || {})) {
    for (const via of entry.via || []) {
      if (typeof via !== 'object' || !via.url) continue;
      const id = via.url.split('/').pop();
      found.set(id, {id, name: via.name, title: via.title, severity: via.severity});
    }
  }
  return [...found.values()];
}

// Falla ante cualquier aviso high/critical que no tenga una excepcion vigente y con justificacion.
export function evaluate(report, exceptions, today) {
  if (report.error) return {blocking: [], errors: ['npm audit no pudo completarse: ' + (report.error.summary || report.error.code)], notes: []};
  const found = advisories(report);
  const errors = [];
  const notes = [];
  const allowed = new Set();
  for (const item of exceptions) {
    if (!item.id || !item.reason || !item.expires) { errors.push('Excepcion incompleta (id, reason y expires son obligatorios): ' + JSON.stringify(item)); continue; }
    if (item.expires < today) { errors.push('Excepcion vencida el ' + item.expires + ': ' + item.id + '. Revisa si ya hay version corregida o renueva con justificacion.'); continue; }
    if (!found.some(a => a.id === item.id)) notes.push('La excepcion ' + item.id + ' ya no aplica; puedes quitarla.');
    allowed.add(item.id);
  }
  const blocking = found.filter(a => BLOCKING.has(a.severity) && !allowed.has(a.id));
  for (const a of found.filter(a => allowed.has(a.id))) notes.push('Tolerado hasta su vencimiento: ' + a.id + ' (' + a.name + ').');
  return {blocking, errors, notes};
}

function run() {
  let output;
  try { output = execFileSync('npm', ['audit', '--json'], {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024}); }
  catch (error) { output = error.stdout; }
  const exceptions = JSON.parse(fs.readFileSync('.github/audit-exceptions.json', 'utf8'));
  const today = new Date().toISOString().slice(0, 10);
  const {blocking, errors, notes} = evaluate(JSON.parse(output), exceptions, today);
  notes.forEach(note => console.log(note));
  errors.forEach(error => console.error('ERROR: ' + error));
  blocking.forEach(a => console.error('ERROR: ' + a.severity + ' ' + a.name + ' ' + a.id + ' - ' + a.title));
  if (blocking.length || errors.length) process.exit(1);
  console.log('npm audit: sin avisos high/critical sin excepcion.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) run();
