#!/usr/bin/env node
// Spec 016 · T008 — Suite automatizada en un Android FÍSICO conectado por USB.
//   npm run test:device -- --modo apk
//   npm run test:device -- --modo expo-go --link exp://192.168.1.20:8081
//   (desde PowerShell: .\scripts\device-tests.ps1 -Modo apk)
// Requiere: `adb` y Maestro (https://maestro.mobile.dev, CLI externa, no entra al paquete de la app).
// Sin dispositivo, sin herramienta o contra una API fuera de la lista explícita de hosts, FALLA con un mensaje
// claro y NO escribe ningún resultado. Nunca imprime la contraseña de la cuenta de prueba.
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const APP_IDS = { 'expo-go': 'host.exp.exponent', apk: 'mx.vaiven.app' };

export class EntornoError extends Error {}

/** Interpreta la salida de `adb devices -l`: serial, estado y si es emulador. */
export function parseAdbDevices(salida) {
  return salida
    .split(/\r?\n/)
    .slice(1)
    .map((l) => l.trim())
    .filter((l) => l !== '' && !l.startsWith('*'))
    .map((l) => {
      const [serial, estado] = l.split(/\s+/);
      return { serial, estado, emulador: serial.startsWith('emulator-') };
    });
}

const LOCAL = /^(localhost|\[::1\]|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

/**
 * Archivo versionado con la lista explícita de hosts permitidos (spec 021-T006, P-04). Con `/`
 * fijo (no `join`): es también la etiqueta que se muestra y se guarda, igual en Windows.
 */
export const ARCHIVO_HOSTS = 'scripts/e2e-allowed-hosts.json';

/** `host:puerto` de una URL o de una entrada de la lista; sin puerto vale el de https (443). */
export function hostPuerto(entrada) {
  const texto = String(entrada).trim();
  if (texto === '') return null;
  try {
    const u = new URL(/^[a-z]+:\/\//i.test(texto) ? texto : `https://${texto}`);
    const puerto = u.port || (u.protocol === 'http:' ? '80' : '443');
    return `${u.hostname.toLowerCase()}:${puerto}`;
  } catch {
    return null;
  }
}

/** Une el archivo versionado y `E2E_ALLOW_API_HOST` (varios, separados por coma). */
export function cargarHostsPermitidos({
  env,
  raiz,
  leer = (p) => readFileSync(p, 'utf8'),
  existe = existsSync,
}) {
  const hosts = [];
  const f = join(raiz, ARCHIVO_HOSTS);
  if (existe(f)) {
    let lista;
    try {
      lista = JSON.parse(leer(f)).hosts;
    } catch {
      throw new EntornoError(`${ARCHIVO_HOSTS} no es un JSON válido con la clave «hosts».`);
    }
    if (!Array.isArray(lista))
      throw new EntornoError(`${ARCHIVO_HOSTS} debe traer «hosts» como lista de «host:puerto».`);
    for (const h of lista) {
      const n = hostPuerto(h);
      if (n) hosts.push({ host: n, origen: ARCHIVO_HOSTS });
    }
  }
  for (const h of String(env.E2E_ALLOW_API_HOST ?? '').split(',')) {
    const n = hostPuerto(h);
    if (n) hosts.push({ host: n, origen: 'E2E_ALLOW_API_HOST' });
  }
  return hosts;
}

/**
 * La suite crea y elimina una cuenta: solo corre contra una red local o contra un host
 * (host:puerto) de la lista explícita. El nombre no decide: «staging» en el host no basta.
 */
export function evaluarApi(url, permitidos = []) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return { ok: false, motivo: `la URL de la API no es válida: «${url}»` };
  }
  const host = u.hostname;
  const clave = hostPuerto(url);
  if (LOCAL.test(host.toLowerCase()))
    return { ok: true, host, clave, motivo: 'red local (loopback, emulador o red privada)' };
  const lista = permitidos.map((p) =>
    typeof p === 'string' ? { host: hostPuerto(p), origen: 'lista' } : p,
  );
  const hallado = lista.find((p) => p.host === clave);
  if (hallado)
    return {
      ok: true,
      host,
      clave,
      motivo: `«${clave}» figura en la lista explícita de hosts permitidos (${hallado.origen})`,
    };
  return {
    ok: false,
    host,
    clave,
    motivo: `«${clave}» no figura en la lista explícita de hosts permitidos (${ARCHIVO_HOSTS} o E2E_ALLOW_API_HOST); el nombre no basta, ni siquiera si dice «staging». La suite crea y elimina una cuenta y no corre contra un host que nadie haya aprobado`,
  };
}

function leerEnv(texto) {
  const out = {};
  for (const l of texto.split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(l);
    if (m && !l.trim().startsWith('#')) out[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  return out;
}

/** URL de la API que usará la app: variable explícita, eas.json (apk) o .env (Expo Go). */
export function urlDeApi({
  modo,
  env,
  raiz,
  leer = (p) => readFileSync(p, 'utf8'),
  existe = existsSync,
}) {
  if (env.E2E_API_URL) return { url: env.E2E_API_URL, fuente: 'E2E_API_URL' };
  if (modo === 'apk') {
    const f = join(raiz, 'eas.json');
    if (!existe(f))
      throw new EntornoError(
        'No encuentro eas.json para saber a qué API apunta el APK. Define E2E_API_URL.',
      );
    const perfil = env.E2E_EAS_PROFILE || 'preview';
    const url = JSON.parse(leer(f)).build?.[perfil]?.env?.EXPO_PUBLIC_API_URL;
    if (!url)
      throw new EntornoError(
        `eas.json no define EXPO_PUBLIC_API_URL en el perfil «${perfil}». Define E2E_API_URL.`,
      );
    return { url, fuente: `eas.json (${perfil})` };
  }
  const f = join(raiz, '.env');
  if (!existe(f))
    throw new EntornoError(
      'No encuentro .env para saber a qué API apunta Expo Go. Crea .env o define E2E_API_URL.',
    );
  const url = leerEnv(leer(f)).EXPO_PUBLIC_API_URL;
  if (!url)
    throw new EntornoError('.env no define EXPO_PUBLIC_API_URL. Define la variable o E2E_API_URL.');
  return { url, fuente: '.env' };
}

export function parseArgs(argv) {
  const o = { modo: 'apk', link: '', emulador: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--modo') o.modo = argv[++i];
    else if (argv[i] === '--link') o.link = argv[++i];
    else if (argv[i] === '--serial') o.serial = argv[++i];
    else if (argv[i] === '--permitir-emulador') o.emulador = true;
  }
  return o;
}

const credencialAleatoria = () => randomBytes(9).toString('base64url');

/**
 * Variables que los flujos exigen y que el script no puede generar (spec 021-T025, RF-24): sin
 * ellas el flujo correspondiente FALLA, ya no se omite. Se avisa antes de correr.
 */
export const VARIABLES_DE_DEMOSTRACION = [
  { nombre: 'E2E_ITEM_TITLE', flujo: '03-solicitud' },
  { nombre: 'E2E_CHAT_EMAIL', flujo: '08-chat' },
  { nombre: 'E2E_CHAT_PASSWORD', flujo: '08-chat' },
];

/** Avisos de las variables de demostración que faltan (los flujos que las usan fallarán). */
export function avisosDeVariables(env) {
  return VARIABLES_DE_DEMOSTRACION.filter(({ nombre }) => !env[nombre]).map(
    ({ nombre, flujo }) =>
      `Falta ${nombre}: el flujo ${flujo} fallará (ver docs/calidad/dispositivo.md).`,
  );
}

/**
 * Los flujos buscan el objeto por su título dentro de una expresión regular («<título>, …»);
 * un título con caracteres especiales de regex no se encontraría o coincidiría con otro.
 */
export function tituloSeguro(titulo) {
  return !/[\\^$.*+?()[\]{}|]/.test(titulo);
}

/** Ejecuta la suite. `deps` permite probar sin dispositivo; devuelve el código de salida. */
export function main(argv, deps = {}) {
  const raiz = deps.raiz ?? resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const env = deps.env ?? process.env;
  const log = deps.log ?? ((m) => console.log(m));
  const err = deps.err ?? ((m) => console.error(m));
  const run =
    deps.run ??
    ((cmd, args) =>
      spawnSync(cmd, args, { encoding: 'utf8', shell: process.platform === 'win32' }));
  const escribir =
    deps.escribir ?? ((p, t) => (mkdirSync(dirname(p), { recursive: true }), writeFileSync(p, t)));
  const ahora = deps.ahora ?? (() => new Date());
  const opts = parseArgs(argv);
  try {
    if (!APP_IDS[opts.modo])
      throw new EntornoError(`Modo «${opts.modo}» desconocido. Usa --modo apk o --modo expo-go.`);
    const link = opts.link || env.E2E_APP_LINK || '';
    if (opts.modo === 'expo-go' && link === '') {
      throw new EntornoError(
        'En modo expo-go indica la dirección de Metro: --link exp://<IP-de-tu-PC>:8081 (o E2E_APP_LINK).',
      );
    }

    // 1) API de pruebas (se muestra siempre).
    const api = urlDeApi({
      modo: opts.modo,
      env,
      raiz,
      ...(deps.leer ? { leer: deps.leer, existe: deps.existe } : {}),
    });
    const permitidos = cargarHostsPermitidos({
      env,
      raiz,
      ...(deps.leer ? { leer: deps.leer, existe: deps.existe } : {}),
    });
    const juicio = evaluarApi(api.url, permitidos);
    log(`API que usará la app: ${api.url} (fuente: ${api.fuente})`);
    if (!juicio.ok) throw new EntornoError(`Me niego a correr: ${juicio.motivo}.`);
    log(`API aceptada: ${juicio.motivo}.`);
    const tituloObjeto = env.E2E_ITEM_TITLE ?? '';
    if (!tituloSeguro(tituloObjeto))
      throw new EntornoError(
        `E2E_ITEM_TITLE («${tituloObjeto}») trae caracteres especiales de expresión regular (\\ ^ $ . * + ? ( ) [ ] { } |); usa un objeto de demostración con un título sin ellos.`,
      );

    // 2) adb y dispositivo físico.
    const adb = run('adb', ['devices', '-l']);
    if (adb.error || adb.status !== 0) {
      throw new EntornoError(
        'No encuentro `adb`. Instala Android Platform Tools y agrega la carpeta al PATH (PowerShell: `adb version`).',
      );
    }
    const dispositivos = parseAdbDevices(adb.stdout).filter((d) => d.estado === 'device');
    const fisicos = dispositivos.filter((d) => !d.emulador || opts.emulador);
    if (fisicos.length === 0) {
      throw new EntornoError(
        dispositivos.length > 0
          ? 'Solo hay emuladores conectados; la suite pide un teléfono físico (o usa --permitir-emulador, que no cuenta como dispositivo físico).'
          : 'No hay ningún dispositivo conectado. Conecta el teléfono por USB, activa la depuración USB y acepta el aviso en pantalla (`adb devices` debe decir «device»).',
      );
    }
    const objetivo = opts.serial ? fisicos.find((d) => d.serial === opts.serial) : fisicos[0];
    if (!objetivo) throw new EntornoError(`El dispositivo ${opts.serial} no está conectado.`);
    if (!opts.serial && fisicos.length > 1)
      log(`Hay ${fisicos.length} dispositivos; uso ${objetivo.serial}. Elige otro con --serial.`);

    // 3) Maestro.
    const maestro = run('maestro', ['--version']);
    if (maestro.error || maestro.status !== 0) {
      throw new EntornoError(
        'No encuentro Maestro. Instálalo desde https://maestro.mobile.dev (CLI externa) y comprueba `maestro --version`.',
      );
    }
    const version = String(maestro.stdout).trim().split(/\r?\n/).pop();

    // 4) Cuenta de prueba efímera: variables de entorno o valores generados para esta corrida.
    const email = env.E2E_EMAIL || `vaiven.e2e.${ahora().getTime()}@example.com`;
    const password = env.E2E_PASSWORD || `Aa1-${credencialAleatoria()}`;
    // Marca única de la corrida: título del objeto que se publica y texto del mensaje del chat.
    const corrida = String(ahora().getTime());
    const fecha = ahora().toISOString().replace(/[:.]/g, '-');
    const informe = join(raiz, 'docs', 'calidad', 'dispositivo', `informe-${fecha}.xml`);
    const args = [
      '--device',
      objetivo.serial,
      'test',
      join(raiz, '.maestro'),
      '--format',
      'junit',
      '--output',
      informe,
      '-e',
      `APP_ID=${APP_IDS[opts.modo]}`,
      '-e',
      `APP_LINK=${link}`,
      '-e',
      `E2E_EMAIL=${email}`,
      '-e',
      `E2E_PASSWORD=${password}`,
      '-e',
      `E2E_ITEM_TITLE=${tituloObjeto}`,
      '-e',
      `E2E_CHAT_EMAIL=${env.E2E_CHAT_EMAIL ?? ''}`,
      '-e',
      `E2E_CHAT_PASSWORD=${env.E2E_CHAT_PASSWORD ?? ''}`,
      '-e',
      `E2E_RUN_ID=${corrida}`,
    ];
    log(`Dispositivo: ${objetivo.serial} · Maestro ${version} · modo ${opts.modo}`);
    for (const aviso of avisosDeVariables(env)) err(`⚠ ${aviso}`);
    const r = run('maestro', args);
    if (r.stdout) log(String(r.stdout));
    if (r.stderr) err(String(r.stderr));
    const exito = r.status === 0;
    const modelo = String(
      run('adb', ['-s', objetivo.serial, 'shell', 'getprop', 'ro.product.model']).stdout ?? '',
    ).trim();
    escribir(
      join(raiz, 'docs', 'calidad', 'dispositivo', 'ultima-ejecucion.json'),
      JSON.stringify(
        {
          fecha: ahora().toISOString(),
          modo: opts.modo,
          dispositivo: { serial: objetivo.serial, modelo, fisico: !objetivo.emulador },
          maestro: version,
          api: { host: juicio.clave, fuente: api.fuente, aceptadaPor: juicio.motivo },
          comando:
            'maestro --device <serial> test .maestro --format junit -e APP_ID -e APP_LINK -e E2E_EMAIL -e E2E_PASSWORD -e E2E_ITEM_TITLE -e E2E_CHAT_EMAIL -e E2E_CHAT_PASSWORD -e E2E_RUN_ID (valores omitidos)',
          variablesFaltantes: VARIABLES_DE_DEMOSTRACION.filter(({ nombre }) => !env[nombre]).map(
            ({ nombre }) => nombre,
          ),
          informe: informe.replace(raiz, '').replace(/\\/g, '/').replace(/^\//, ''),
          codigoDeSalida: r.status,
          resultado: exito ? 'verde' : 'fallo',
        },
        null,
        2,
      ) + '\n',
    );
    log(exito ? 'Suite en dispositivo: VERDE.' : 'Suite en dispositivo: FALLÓ (ver el informe).');
    return exito ? 0 : 1;
  } catch (e) {
    if (e instanceof EntornoError) {
      err(`✖ ${e.message}\nNo se ejecutó nada y no se escribió ningún resultado.`);
      return 2;
    }
    throw e;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
