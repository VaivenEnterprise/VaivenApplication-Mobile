#!/usr/bin/env node
// Spec 016 · T002 — Matriz de rutas y pantallas × endpoints × pruebas (solo lectura).
//   node scripts/screens-report.mjs [--out docs/calidad/pantallas.md] [--contrato ../vaiven-backend/api/openapi.yaml]
// Sin dependencias. Endpoints = rutas literales pasadas a `request(...)` en el cierre de
// importaciones de la pantalla (sin descender a lib/, i18n/, theme/ ni test/).
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { clasificar } from './test-report.mjs';

const ES_PRUEBA = /\.test\.[jt]sx?$/;
const NO_DESCENDER = ['src/lib/', 'src/i18n/', 'src/theme/', 'src/test/'];

export function listar(dir, filtro) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...listar(p, filtro));
    else if (filtro(p)) out.push(p);
  }
  return out;
}

/** Normaliza una ruta de petición: `${...}` → `{}`, sin consulta ni `${query}` final. */
export function normalizarRuta(r) {
  return (
    r
      .replace(/\$\{[^}]*\}/g, '{}')
      .replace(/\?.*$/, '')
      .replace(/\{\}$/, (m, _i, s) => (s.endsWith('/{}') ? m : ''))
      .replace(/\/$/, '') || '/'
  );
}

/** Primer argumento de una llamada: desde `inicio` hasta la coma de nivel 0. */
function primerArgumento(texto, inicio) {
  let prof = 0;
  let comilla = null;
  for (let i = inicio; i < texto.length; i++) {
    const c = texto[i];
    if (comilla) {
      if (c === '\\') i++;
      else if (c === comilla) comilla = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') comilla = c;
    else if (c === '(' || c === '{' || c === '[') prof++;
    else if (c === '}' && prof > 0) prof--;
    else if (c === ')' || c === ']') {
      if (prof === 0) return texto.slice(inicio, i).trim();
      prof--;
    } else if (c === ',' && prof === 0) return texto.slice(inicio, i).trim();
  }
  return texto.slice(inicio).trim();
}

/** Funciones locales que arman una ruta: `const itemPath = (id) => \`/items/${id}\``. */
function ayudantes(texto) {
  const mapa = new Map();
  const re =
    /const\s+(\w+)\s*=\s*\([^)]*\)\s*(?::\s*[\w<>]+\s*)?=>\s*([`'"])(\/[^`'"]*|\$\{[^`'"]*)\2/g;
  let m;
  while ((m = re.exec(texto)) !== null) mapa.set(m[1], m[3]);
  return mapa;
}

function expandir(arg, mapa) {
  let t = arg.replace(/^([`'"])([\s\S]*)\1$/, '$2');
  const llamada = /^(\w+)\(.*\)$/s.exec(arg);
  if (llamada && mapa.has(llamada[1])) t = mapa.get(llamada[1]);
  for (let i = 0; i < 3; i++) {
    t = t.replace(/\$\{(\w+)\([^}]*\)\}/g, (x, n) => (mapa.has(n) ? mapa.get(n) : x));
  }
  return t;
}

/** Rutas de `request(...)` en un texto, con su método; resuelve ayudantes locales de ruta. */
export function extraerEndpoints(texto) {
  const res = [];
  const mapa = ayudantes(texto);
  const re = /\brequest(?:<[^>]*>)?\(\s*/g;
  while (re.exec(texto) !== null) {
    const arg = primerArgumento(texto, re.lastIndex);
    const ruta = expandir(arg, mapa);
    if (!ruta.startsWith('/')) continue;
    const resto = texto
      .slice(re.lastIndex + arg.length, re.lastIndex + arg.length + 260)
      .split(/\brequest[<(]/)[0];
    const metodo = /method:\s*'(GET|POST|PUT|PATCH|DELETE)'/.exec(resto)?.[1] ?? 'GET';
    res.push(`${metodo} ${normalizarRuta(ruta)}`);
  }
  return res;
}

export function importsDe(texto) {
  const out = [];
  const re = /(?:from|import|require)\s*\(?\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(texto)) !== null) out.push(m[1]);
  return out;
}

function resolverArchivo(base) {
  for (const c of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    join(base, 'index.ts'),
    join(base, 'index.tsx'),
  ]) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

export function resolverImport(spec, desde, raiz) {
  if (spec.startsWith('@/')) return resolverArchivo(join(raiz, 'src', spec.slice(2)));
  if (spec.startsWith('.')) return resolverArchivo(resolve(dirname(desde), spec));
  return null;
}

/** Cierre de importaciones locales desde `inicio` (sin pruebas; sin descender a las carpetas excluidas). */
export function cierre(inicio, raiz, cache = new Map()) {
  const vistos = new Set();
  const pila = [inicio];
  while (pila.length > 0) {
    const f = pila.pop();
    if (vistos.has(f)) continue;
    vistos.add(f);
    const rel = relative(raiz, f).replace(/\\/g, '/');
    if (f !== inicio && NO_DESCENDER.some((d) => rel.startsWith(d))) continue;
    let imps = cache.get(f);
    if (!imps) {
      imps = importsDe(readFileSync(f, 'utf8'))
        .map((s) => resolverImport(s, f, raiz))
        .filter((x) => x && !ES_PRUEBA.test(x));
      cache.set(f, imps);
    }
    pila.push(...imps);
  }
  return vistos;
}

const featureDe = (rel) => /^src\/features\/([^/]+)\//.exec(rel)?.[1] ?? null;
const ES_DATOS = /(^|\/)(api|hooks)(\/|\.|$)/;

/**
 * Archivos que alimentan una pantalla: todo su feature, y de otros features solo el archivo
 * importado y sus `api`/`hooks` (un salto). `auth` y `providers` son sesión compartida y no cuentan
 * como datos de la pantalla.
 */
export function cierrePantalla(inicio, raiz, cache = new Map()) {
  const propio = featureDe(relative(raiz, inicio).replace(/\\/g, '/'));
  const vistos = new Set();
  const pila = [[inicio, 0]];
  while (pila.length > 0) {
    const [f, salto] = pila.pop();
    if (vistos.has(f)) continue;
    vistos.add(f);
    const rel = relative(raiz, f).replace(/\\/g, '/');
    if (f !== inicio && NO_DESCENDER.some((d) => rel.startsWith(d))) continue;
    const feat = featureDe(rel);
    const externo = feat !== null && feat !== propio;
    if (externo && (feat === 'auth' || salto > 1 || (salto === 1 && !ES_DATOS.test(rel)))) continue;
    if (rel.startsWith('src/providers/')) continue;
    let imps = cache.get(f);
    if (!imps) {
      imps = importsDe(readFileSync(f, 'utf8'))
        .map((x) => resolverImport(x, f, raiz))
        .filter((x) => x && !ES_PRUEBA.test(x));
      cache.set(f, imps);
    }
    for (const i of imps) {
      const fi = featureDe(relative(raiz, i).replace(/\\/g, '/'));
      const cruza = fi !== null && fi !== propio;
      pila.push([i, cruza ? (externo ? salto + 1 : 1) : salto]);
    }
  }
  return vistos;
}

/** URL de una ruta de Expo Router hasta el primer segmento dinámico: `src/app/(tabs)/mensajes/index.tsx` → `/mensajes`. */
export function prefijoUrl(rutaArchivo) {
  const partes = rutaArchivo
    .replace(/^src\/app\//, '')
    .replace(/\.tsx$/, '')
    .split('/')
    .filter((x) => !/^\(.*\)$/.test(x) && x !== 'index');
  const fijas = [];
  for (const x of partes) {
    if (x.startsWith('[')) break;
    fijas.push(x);
  }
  return fijas.length ? `/${fijas.join('/')}` : null;
}

/** Un segmento `{}` del endpoint (parámetro o etapa variable) casa con cualquier segmento del contrato. */
export function enContrato(contrato, ruta) {
  const seg = ruta.split('/');
  for (const c of contrato) {
    const cs = c.split('/');
    if (
      cs.length === seg.length &&
      seg.every((x, i) => x === cs[i] || x === '{}' || cs[i] === '{}')
    )
      return true;
  }
  return false;
}

export function rutasContrato(textoYaml) {
  const set = new Set();
  const re = /^ {2}(\/[^\s:]*):/gm;
  let m;
  while ((m = re.exec(textoYaml)) !== null) {
    set.add(m[1].replace(/^\/api\/v1/, '').replace(/\{[^}]*\}/g, '{}') || '/');
  }
  return set;
}

/** Operaciones del asistente de proyectos del contrato: se declaran aunque la app no las consuma (021-T009). */
export const ASISTENTE = ['POST /ai/assistant/messages', 'DELETE /ai/assistant/conversations/{}'];

/** `slots.register('chat', Componente)` → [{ slot: 'chat', componente: 'Componente' }]. */
export function extraerRegistros(texto) {
  const out = [];
  const re = /\bslots\.register\(\s*['"](\w+)['"]\s*,\s*(\w+)\s*\)/g;
  let m;
  while ((m = re.exec(texto)) !== null) out.push({ slot: m[1], componente: m[2] });
  return out;
}

/** Ruta del archivo del que `texto` (en `desde`) importa `nombre`. */
export function archivoDeImport(texto, nombre, desde, raiz) {
  const re = new RegExp(
    `import\\s*(?:type\\s*)?\\{[^}]*\\b${nombre}\\b[^}]*\\}\\s*from\\s*['"]([^'"]+)['"]`,
  );
  const spec = re.exec(texto)?.[1];
  return spec ? resolverImport(spec, desde, raiz) : null;
}

export function construirMatriz(raiz, contratoTexto) {
  const src = join(raiz, 'src');
  const cache = new Map();
  const noPrueba = (p) => /\.(ts|tsx)$/.test(p) && !ES_PRUEBA.test(p) && !/\.d\.ts$/.test(p);
  const pantallas = listar(
    join(src, 'features'),
    (p) => /\/screens\/[^/]+\.tsx$/.test(p.replace(/\\/g, '/')) && noPrueba(p),
  );
  const rutas = listar(join(src, 'app'), (p) => noPrueba(p) && !/_layout\.tsx$/.test(p));
  const pruebas = listar(src, (p) => ES_PRUEBA.test(p)).map((p) => {
    const texto = readFileSync(p, 'utf8');
    return {
      p,
      texto,
      router: /\brenderRouter\b/.test(texto),
      tipo: clasificar(p),
      cierre: cierre0(p),
    };
  });
  function cierre0(p) {
    const imps = importsDe(readFileSync(p, 'utf8'))
      .map((s) => resolverImport(s, p, raiz))
      .filter(Boolean);
    const vistos = new Set();
    for (const i of imps) for (const f of cierre(i, raiz, cache)) vistos.add(f);
    return vistos;
  }
  // Componentes que otras features registran en los *slots* de una pantalla (`slots.register`).
  const registrados = [];
  for (const idx of listar(join(src, 'features'), (p) =>
    /\/features\/[^/]+\/index\.ts$/.test(p.replace(/\\/g, '/')),
  )) {
    const texto = readFileSync(idx, 'utf8');
    for (const { slot, componente } of extraerRegistros(texto)) {
      const archivo = archivoDeImport(texto, componente, idx, raiz);
      if (archivo) registrados.push({ slot, componente, archivo });
    }
  }
  const endpointsDe = (archivos) => {
    const s = new Set();
    for (const g of archivos) for (const e of extraerEndpoints(readFileSync(g, 'utf8'))) s.add(e);
    return s;
  };
  const contrato = contratoTexto ? rutasContrato(contratoTexto) : null;
  const rel = (p) => relative(raiz, p).replace(/\\/g, '/');
  const filas = pantallas.sort().map((f) => {
    const cierreP = cierrePantalla(f, raiz, new Map());
    const endpoints = new Set();
    for (const g of cierreP)
      for (const e of extraerEndpoints(readFileSync(g, 'utf8'))) endpoints.add(e);
    const porTipo = { unitarias: [], integración: [], seguridad: [] };
    const nombre = basename(f).replace(/\.tsx$/, '');
    const susRutas = rutas
      .filter((r) => {
        const t = readFileSync(r, 'utf8');
        return (
          importsDe(t).some((x) => resolverImport(x, r, raiz) === f) ||
          new RegExp(`\\b${nombre}\\b`).test(t)
        );
      })
      .map(rel);
    const prefijos = susRutas.map(prefijoUrl).filter(Boolean);
    // Endpoints que llegan por *slots*: lo que otras features registran en la pantalla y lo que la
    // ruta que la monta le conecta (cota superior, como el resto de la matriz).
    const viaSlots = new Set();
    const textoPantalla = readFileSync(f, 'utf8');
    if (/\bslots\.registered\(/.test(textoPantalla)) {
      for (const r of registrados)
        for (const e of endpointsDe(cierrePantalla(r.archivo, raiz, new Map()))) viaSlots.add(e);
    }
    for (const r of susRutas) {
      const abs = join(raiz, r);
      const textoRuta = readFileSync(abs, 'utf8');
      // Solo las rutas que conectan *slots* por propiedades `render…` (renderActions, etc.).
      if (!/\brender\w+\s*=/.test(textoRuta)) continue;
      for (const spec of importsDe(textoRuta)) {
        const imp = resolverImport(spec, abs, raiz);
        if (!imp || imp === f || ES_PRUEBA.test(imp) || featureDe(rel(imp)) === null) continue;
        for (const e of endpointsDe(cierrePantalla(imp, raiz, new Map()))) viaSlots.add(e);
      }
    }
    for (const e of endpoints) viaSlots.delete(e);
    for (const t of pruebas) {
      if (
        t.cierre.has(f) ||
        (t.router &&
          prefijos.some(
            (u) =>
              t.texto.includes(`'${u}`) || t.texto.includes(`\`${u}`) || t.texto.includes(`"${u}`),
          ))
      ) {
        porTipo[t.tipo].push(rel(t.p));
      }
    }
    return {
      pantalla: rel(f),
      rutas: susRutas,
      endpoints: [...endpoints].sort(),
      viaSlots: [...viaSlots].sort(),
      pruebas: porTipo,
    };
  });
  const rutasFilas = rutas.sort().map((r) => {
    const pantalla = filas.find((x) => x.rutas.includes(rel(r)));
    return { ruta: rel(r), pantalla: pantalla?.pantalla ?? null };
  });
  const faltan = [];
  if (contrato) {
    for (const f of filas) {
      for (const e of f.endpoints) {
        const ruta = e.split(' ')[1];
        if (!enContrato(contrato, ruta)) faltan.push({ pantalla: f.pantalla, endpoint: e });
      }
    }
  }
  const consumidos = new Set(filas.flatMap((f) => [...f.endpoints, ...f.viaSlots]));
  for (const g of listar(src, (p) => noPrueba(p) && !p.replace(/\\/g, '/').includes('/test/')))
    for (const e of extraerEndpoints(readFileSync(g, 'utf8'))) consumidos.add(e);
  const asistente = ASISTENTE.map((op) => ({ operacion: op, consumida: consumidos.has(op) }));
  return {
    filas,
    asistente,
    slotsRegistrados: registrados.map((r) => `${r.slot} ← ${r.componente}`).sort(),
    rutas: rutasFilas,
    contratoComprobado: contrato !== null,
    fueraDelContrato: faltan,
  };
}

const celda = (lista) =>
  lista.length === 0 ? '**sin prueba**' : lista.map((x) => `\`${basename(x)}\``).join(', ');

export function renderizar(m, fecha) {
  const L = [];
  L.push('# Matriz de pantallas, endpoints y pruebas', '');
  L.push(
    `Generada por \`node scripts/screens-report.mjs\` el ${fecha}. Solo lectura del código.`,
    '',
  );
  L.push(
    'Endpoints = rutas literales de `request(...)` en los archivos que alimentan la pantalla: todo su feature (hooks y `api.ts`) y, de otros features que monta, solo el archivo importado y sus `api`/`hooks`; la sesión (`auth`) no cuenta. Es una cota superior: un hook de feature puede traer endpoints que esa pantalla no llama; no cuenta los accesos directos a servicios de terceros (p. ej. la subida de imágenes a Cloudinary). Pruebas = archivos de prueba cuyo cierre de importaciones incluye la pantalla; el tipo sale del nombre del archivo (spec 016, P-02).',
    '',
  );
  L.push('## Pantallas', '');
  L.push(
    '| Pantalla | Ruta(s) | Endpoints | Unitaria | Integración | Seguridad |',
    '|---|---|---|---|---|---|',
  );
  for (const f of m.filas) {
    const rutas = f.rutas.length
      ? f.rutas.map((r) => `\`${r.replace(/^src\/app\//, '')}\``).join(', ')
      : '—';
    const todos = [
      ...f.endpoints.map((e) => `\`${e}\``),
      ...f.viaSlots.map((e) => `\`${e}\` *(slot)*`),
    ];
    const eps = todos.length ? todos.join('<br>') : '—';
    L.push(
      `| \`${basename(f.pantalla)}\` | ${rutas} | ${eps} | ${celda(f.pruebas.unitarias)} | ${celda(f.pruebas['integración'])} | ${celda(f.pruebas.seguridad)} |`,
    );
  }
  L.push('', '## Rutas', '', '| Ruta | Pantalla |', '|---|---|');
  for (const r of m.rutas)
    L.push(
      `| \`${r.ruta.replace(/^src\/app\//, '')}\` | ${r.pantalla ? `\`${basename(r.pantalla)}\`` : '— (sin pantalla propia)'} |`,
    );
  const con = m.filas.filter((f) => f.endpoints.length > 0 || f.viaSlots.length > 0);
  const huecos = (tipo) =>
    con.filter((f) => f.pruebas[tipo].length === 0).map((f) => basename(f.pantalla, '.tsx'));
  L.push('', '## Huecos (pantallas con endpoints)', '');
  for (const tipo of ['unitarias', 'integración', 'seguridad']) {
    const h = huecos(tipo);
    L.push(
      `- **${tipo}:** ${h.length === 0 ? 'ninguna sin prueba' : `${h.length} sin prueba — ${h.join(', ')}`}`,
    );
  }
  const sinEndpoints = m.filas
    .filter((f) => f.endpoints.length === 0 && f.pruebas.unitarias.length === 0)
    .map((f) => basename(f.pantalla, '.tsx'));
  L.push(
    `- **Sin endpoints y sin prueba unitaria:** ${sinEndpoints.length === 0 ? 'ninguna' : sinEndpoints.join(', ')}`,
  );
  L.push('', '## Slots y asistente de proyectos (spec 021-T009)', '');
  L.push(
    'Los endpoints marcados *(slot)* llegan por los puntos de extensión: lo que otras features registran con `slots.register(...)` en el detalle de la reserva y lo que la ruta que monta la pantalla le conecta (`renderActions`, `renderOwnerExtras`, `renderFormExtras`…). Es una cota superior.',
    '',
  );
  if (m.slotsRegistrados.length > 0) {
    L.push('Registros de *slots*:', '');
    for (const r of m.slotsRegistrados) L.push(`- \`${r}\``);
    L.push('');
  }
  L.push('Asistente de proyectos (`/ai/assistant/*`):', '');
  for (const a of m.asistente)
    L.push(
      a.consumida
        ? `- \`${a.operacion}\`: **consumido** por la app.`
        : `- \`${a.operacion}\`: **no consumido**; está en el contrato pero la app no lo llama. Decisión pendiente (spec 021, T020 y T032): implementarlo o declararlo fuera de alcance de la 014.`,
    );
  L.push('', '## Contraste con el contrato del backend', '');
  if (!m.contratoComprobado)
    L.push('No ejecutado: no se encontró `../vaiven-backend/api/openapi.yaml`.');
  else if (m.fueraDelContrato.length === 0)
    L.push('Todos los endpoints de la matriz existen en `api/openapi.yaml`.');
  else
    for (const x of m.fueraDelContrato)
      L.push(`- \`${x.endpoint}\` (${basename(x.pantalla)}) no aparece en el contrato.`);
  if (m.notas) L.push('', '## Notas de revisión manual', '', m.notas.trim());
  return L.join('\n') + '\n';
}

function main(argv) {
  const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const arg = (n, d) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
  const contrato = resolve(raiz, arg('--contrato', '../vaiven-backend/api/openapi.yaml'));
  const m = construirMatriz(raiz, existsSync(contrato) ? readFileSync(contrato, 'utf8') : null);
  const notas = join(raiz, 'docs', 'calidad', 'pantallas-notas.md');
  if (existsSync(notas)) m.notas = readFileSync(notas, 'utf8');
  const md = renderizar(m, new Date().toISOString().slice(0, 10));
  const out = arg('--out', null);
  if (out) writeFileSync(resolve(raiz, out), md);
  else process.stdout.write(md);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  process.exit(main(process.argv.slice(2)));
