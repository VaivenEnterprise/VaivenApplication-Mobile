// Spec 021-T023 (RF-22, CA-09): reglas del CD manual, comprobadas sobre el texto del flujo (sin
// dependencias, corre en Policy). Devuelve los incumplimientos; una lista vacia es conforme.
export function checkRelease(text) {
  const yml = text.replace(/\r\n/g, '\n');
  const errors = [];
  const on = yml.match(/^on:\n([\s\S]*?)^\S/m)?.[1] ?? '';
  const triggers = [...on.matchAll(/^ {2}([a-z_]+):/gm)].map(m => m[1]);
  if (triggers.join() !== 'workflow_dispatch') errors.push('El CD solo debe arrancar con workflow_dispatch (hay: ' + (triggers.join(', ') || 'ninguno') + ').');
  if (!/^permissions:\n {2}contents: read\n(?! )/m.test(yml)) errors.push('Los permisos del flujo deben ser solo contents: read.');
  const jobs = yml.split(/^ {2}(?=[a-z][\w-]*:\n)/m).slice(1);
  const withToken = jobs.filter(job => /EXPO_TOKEN/.test(job.replace(/^\s*#.*$/gm, '')));
  if (!withToken.length) errors.push('Ningun job usa EXPO_TOKEN: no hay compilacion.');
  for (const job of withToken) {
    const name = job.split(':')[0];
    if (!/^ {4}environment: eas-build$/m.test(job)) errors.push('El job ' + name + ' usa EXPO_TOKEN sin el entorno eas-build (revisor obligatorio).');
    if (!/^ {4}needs: verify$/m.test(job)) errors.push('El job ' + name + ' debe esperar a verify (las mismas pruebas que el CI).');
  }
  for (const m of yml.matchAll(/EXPO_TOKEN:\s*(.+)$/gm)) if (m[1].trim() !== '${{ secrets.EXPO_TOKEN }}') errors.push('EXPO_TOKEN solo puede venir de secrets.EXPO_TOKEN: ' + m[1].trim());
  for (const m of yml.matchAll(/^\s*-?\s*uses:\s*(\S+)/gm)) if (!/@[0-9a-f]{40}$/.test(m[1])) errors.push('Accion sin fijar por SHA: ' + m[1]);
  if (/\beas(-cli@[\w.]+)?\s+submit\b/.test(yml)) errors.push('El CD no sube a Google Play (eas submit): lo hace el administrador.');
  // Contra la inyeccion en scripts: una entrada solo puede ser el valor completo de una clave
  // (`PROFILE: ${{ inputs.profile }}` en env, o `group:`), nunca texto dentro de un `run`.
  for (const line of yml.split('\n').filter(l => /\$\{\{\s*(inputs|github\.event)\./.test(l)))
    if (!/^\s+[A-Za-z_][\w-]*:\s*\S*\$\{\{\s*[\w.]+\s*\}\}\s*$/.test(line) || /^\s*-?\s*run:/.test(line))
      errors.push('Las entradas del flujo solo pasan por variables de entorno, nunca dentro de run: ' + line.trim());
  const eas = yml.match(/eas-cli@([\w.-]+)/);
  if (!eas || !/^\d+\.\d+\.\d+$/.test(eas[1])) errors.push('eas-cli debe ir con version exacta (eas-cli@X.Y.Z).');
  if (!/^ {4}environment: eas-build$/m.test(yml)) errors.push('Falta el entorno eas-build.');
  return errors;
}
