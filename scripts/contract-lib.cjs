'use strict';
// Spec 021-T010: núcleo de la prueba de contrato (CommonJS para que lo usen Node y Jest).
const { existsSync, readFileSync } = require('node:fs');
const { dirname, resolve } = require('node:path');

const RUTA_CONTRATO = '../vaiven-backend/api/openapi.yaml';

function leerYaml(archivo) {
  let yaml;
  try {
    yaml = require('js-yaml');
  } catch {
    throw new Error(
      'Falta `js-yaml` (dependencia de desarrollo ya presente en el lockfile): ejecuta `npm ci`.',
    );
  }
  return yaml.load(readFileSync(archivo, 'utf8'));
}

/** Carga el contrato y devuelve un resolvedor de `$ref` relativo al archivo que los contiene. */
function cargarContrato(archivo) {
  const raiz = resolve(archivo);
  if (!existsSync(raiz)) {
    throw new Error(
      `No se encontró el contrato en ${raiz}. Clona vaiven-backend junto a este repositorio o pasa --contrato.`,
    );
  }
  const docs = new Map();
  const doc = (f) => {
    if (!docs.has(f)) docs.set(f, leerYaml(f));
    return docs.get(f);
  };
  const apuntar = (documento, puntero) =>
    puntero
      .split('/')
      .filter(Boolean)
      .reduce(
        (n, k) => (n === undefined ? n : n[k.replace(/~1/g, '/').replace(/~0/g, '~')]),
        documento,
      );
  /** Resuelve `nodo` (siguiendo `$ref` encadenados) y devuelve {nodo, archivo}. */
  function deref(nodo, archivoActual) {
    let n = nodo;
    let f = archivoActual;
    for (let i = 0; n && typeof n === 'object' && typeof n.$ref === 'string'; i++) {
      if (i > 50) throw new Error('Referencias circulares en el contrato');
      const [ruta, puntero = ''] = n.$ref.split('#');
      if (ruta !== '') f = resolve(dirname(f), ruta);
      n = apuntar(doc(f), puntero);
      if (n === undefined) throw new Error(`Referencia sin destino: ${nodo.$ref}`);
    }
    return { nodo: n, archivo: f };
  }
  return { raiz, documento: doc(raiz), deref };
}

const TIPOS = {
  string: (v) => typeof v === 'string',
  integer: (v) => Number.isInteger(v),
  number: (v) => typeof v === 'number' && Number.isFinite(v),
  boolean: (v) => typeof v === 'boolean',
  null: (v) => v === null,
  array: (v) => Array.isArray(v),
  object: (v) => v !== null && typeof v === 'object' && !Array.isArray(v),
};

/** Valida `valor` contra un esquema OpenAPI 3.1 (subconjunto: tipos, enum, const, required,
 *  properties, additionalProperties, items, allOf, oneOf, anyOf). Devuelve la lista de errores. */
function validar(valor, esquema, contrato, archivo = contrato.raiz, ruta = '$', opciones = {}) {
  const { nodo: s, archivo: f } = contrato.deref(esquema, archivo);
  if (s === undefined || s === null || s === true || Object.keys(s).length === 0) return [];
  const errores = [];
  for (const sub of s.allOf ?? [])
    errores.push(...validar(valor, sub, contrato, f, ruta, opciones));
  for (const clave of ['oneOf', 'anyOf']) {
    if (!s[clave]) continue;
    const intentos = s[clave].map((sub) => validar(valor, sub, contrato, f, ruta, opciones));
    const buenos = intentos.filter((e) => e.length === 0).length;
    if (buenos === 0) errores.push(`${ruta}: no cumple ninguna variante de ${clave}`);
    if (clave === 'oneOf' && buenos > 1)
      errores.push(`${ruta}: cumple más de una variante de oneOf`);
  }
  const tipos = s.type === undefined ? null : Array.isArray(s.type) ? s.type : [s.type];
  if (valor === null && s.nullable === true) return errores;
  if (tipos && !tipos.some((t) => TIPOS[t]?.(valor))) {
    errores.push(
      `${ruta}: se esperaba ${tipos.join('|')} y llegó ${valor === null ? 'null' : typeof valor}`,
    );
    return errores;
  }
  if (s.enum && !s.enum.includes(valor))
    errores.push(`${ruta}: ${JSON.stringify(valor)} no está en enum`);
  if (s.const !== undefined && valor !== s.const)
    errores.push(`${ruta}: debe ser ${JSON.stringify(s.const)}`);
  if (TIPOS.object(valor)) {
    for (const k of opciones.parcial ? [] : (s.required ?? []))
      if (!(k in valor)) errores.push(`${ruta}.${k}: falta (requerido)`);
    const props = s.properties ?? {};
    for (const [k, v] of Object.entries(valor)) {
      if (k in props) errores.push(...validar(v, props[k], contrato, f, `${ruta}.${k}`, opciones));
      else if (s.additionalProperties === false)
        errores.push(`${ruta}.${k}: propiedad no declarada en el contrato`);
      else if (s.additionalProperties && typeof s.additionalProperties === 'object')
        errores.push(...validar(v, s.additionalProperties, contrato, f, `${ruta}.${k}`, opciones));
    }
  }
  if (Array.isArray(valor) && s.items) {
    valor.forEach((v, i) =>
      errores.push(...validar(v, s.items, contrato, f, `${ruta}[${i}]`, opciones)),
    );
  }
  return errores;
}

/** Encuentra la operación del contrato para un método y una ruta concreta (`/api/v1/bookings/abc`). */
function buscarOperacion(contrato, metodo, rutaConcreta) {
  const paths = contrato.documento.paths ?? {};
  for (const [plantilla, item] of Object.entries(paths)) {
    const re = new RegExp(
      `^${plantilla.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{[^}]+\}/g, '[^/]+')}$`,
    );
    if (!re.test(rutaConcreta)) continue;
    const { nodo, archivo } = contrato.deref(item, contrato.raiz);
    const op = nodo?.[metodo.toLowerCase()];
    if (op) return { plantilla, operacion: op, archivo };
  }
  return null;
}

/** Valida el cuerpo de una respuesta con su estado; devuelve {plantilla, errores} o {error}. */
function validarRespuesta(contrato, metodo, rutaConcreta, estado, cuerpo, opciones = {}) {
  const hallada = buscarOperacion(contrato, metodo, rutaConcreta);
  if (!hallada) return { error: `${metodo} ${rutaConcreta}: no existe en el contrato` };
  const { nodo: resp } = contrato.deref(
    hallada.operacion.responses?.[String(estado)] ?? hallada.operacion.responses?.default,
    hallada.archivo,
  );
  if (!resp)
    return { error: `${metodo} ${hallada.plantilla}: el contrato no declara respuesta ${estado}` };
  const esquema = resp.content?.['application/json']?.schema;
  if (!esquema) return { plantilla: hallada.plantilla, errores: [] };
  return {
    plantilla: hallada.plantilla,
    errores: validar(cuerpo, esquema, contrato, hallada.archivo, '$', opciones),
  };
}

/** GET públicos sin parámetros obligatorios: lo único que la prueba en vivo se permite pedir. */
function operacionesGetPublicas(contrato) {
  const salida = [];
  for (const [plantilla, item] of Object.entries(contrato.documento.paths ?? {})) {
    if (plantilla.includes('{')) continue;
    const { nodo, archivo } = contrato.deref(item, contrato.raiz);
    const get = nodo?.get;
    if (!get || !Array.isArray(get.security) || get.security.length !== 0) continue;
    const params = [...(nodo.parameters ?? []), ...(get.parameters ?? [])].map(
      (p) => contrato.deref(p, archivo).nodo,
    );
    if (params.some((p) => p?.required === true && p.in !== 'header')) continue;
    salida.push(plantilla);
  }
  return salida;
}

async function ejecutarEnVivo({ contrato, base, timeoutMs = 8000, peticion = fetch }) {
  const fallos = [];
  const hechas = [];
  for (const ruta of operacionesGetPublicas(contrato)) {
    let r;
    try {
      r = await peticion(base + ruta, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (e) {
      fallos.push(
        `GET ${ruta}: la API no responde en ${base} (${e instanceof Error ? e.message : e})`,
      );
      continue;
    }
    let cuerpo;
    try {
      cuerpo = await r.json();
    } catch {
      cuerpo = undefined;
    }
    const v = validarRespuesta(contrato, 'GET', ruta, r.status, cuerpo);
    hechas.push(`GET ${ruta} → ${r.status}`);
    if (v.error) fallos.push(v.error);
    else for (const e of v.errores) fallos.push(`GET ${ruta} → ${r.status}: ${e}`);
  }
  return { hechas, fallos };
}

module.exports = {
  RUTA_CONTRATO,
  leerYaml,
  cargarContrato,
  validar,
  buscarOperacion,
  validarRespuesta,
  operacionesGetPublicas,
  ejecutarEnVivo,
};
