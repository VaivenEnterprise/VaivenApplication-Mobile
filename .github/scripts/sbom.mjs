import fs from 'node:fs';
import {pathToFileURL} from 'node:url';

// Spec 021-T022 (RF-21): comprueba el SBOM CycloneDX que genera `npm sbom` (incluido en npm, sin
// dependencias nuevas) antes de publicarlo como artefacto. Un SBOM vacio o de otro proyecto falla.
export function validateSbom(bom, pkg) {
  const errors = [];
  if (bom.bomFormat !== 'CycloneDX') errors.push('El SBOM no es CycloneDX (bomFormat: ' + bom.bomFormat + ').');
  if (!bom.specVersion) errors.push('El SBOM no declara specVersion.');
  const app = bom.metadata?.component;
  if (app?.name !== pkg.name || app?.version !== pkg.version)
    errors.push('El SBOM describe ' + app?.name + '@' + app?.version + ', no ' + pkg.name + '@' + pkg.version + '.');
  const components = Array.isArray(bom.components) ? bom.components : [];
  if (!components.length) errors.push('El SBOM no lista componentes.');
  const incomplete = components.filter(c => !c.name || !c.version || !c.purl);
  if (incomplete.length) errors.push(incomplete.length + ' componentes sin name, version o purl (p. ej. ' + JSON.stringify(incomplete[0]).slice(0, 120) + ').');
  // npm escribe el nombre completo (`@scope/paquete`) en `name`, sin usar `group`.
  const missing = Object.keys(pkg.dependencies || {}).filter(name => !components.some(c => c.name === name));
  if (missing.length) errors.push('Faltan dependencias directas en el SBOM: ' + missing.join(', ') + '.');
  return {errors, components: components.length};
}

function run() {
  const [bomPath = 'sbom.cdx.json'] = process.argv.slice(2);
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const {errors, components} = validateSbom(JSON.parse(fs.readFileSync(bomPath, 'utf8')), pkg);
  errors.forEach(error => console.error('ERROR: ' + error));
  if (errors.length) process.exit(1);
  console.log('SBOM CycloneDX de ' + pkg.name + '@' + pkg.version + ': ' + components + ' componentes.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) run();
