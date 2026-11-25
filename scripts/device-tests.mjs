#!/usr/bin/env node
// Spec 016 · T008 — Suite automatizada en un Android FÍSICO conectado por USB.
//   npm run test:device -- --modo apk
//   npm run test:device -- --modo expo-go --link exp://192.168.1.20:8081
//   (desde PowerShell: .\scripts\device-tests.ps1 -Modo apk)
// Requiere: `adb` y Maestro (https://maestro.mobile.dev, CLI externa, no entra al paquete de la app).
// Sin dispositivo, sin herramienta o contra una API que no parezca de pruebas, FALLA con un mensaje
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

const PRIVADA = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;
const MARCA_PRUEBAS = /(^|[.-])(staging|stg|dev|test|qa|sandbox|preview)([.-]|$)/i;

/** La suite solo corre contra APIs de pruebas: red local o un host marcado como staging/dev/test. */
export function evaluarApi(url, permitido = '') {
  let host;
  try {
    host = new URL(url).hostname;
  } catch {
    return { ok: false, motivo: `la URL de la API no es válida: «${url}»` };
  }
  if (permitido !== '' && host === permitido)
    return { ok: true, host, motivo: 'host permitido de forma explícita (E2E_ALLOW_API_HOST)' };
  if (PRIVADA.test(host)) return { ok: true, host, motivo: 'red local' };
  if (MARCA_PRUEBAS.test(host)) return { ok: true, host, motivo: 'host de pruebas' };
  return {
    ok: false,
    host,
    motivo: `«${host}» no parece un entorno de pruebas; la suite crea y elimina una cuenta y no corre contra producción`,
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
    const juicio = evaluarApi(api.url, env.E2E_ALLOW_API_HOST ?? '');
    log(`API que usará la app: ${api.url} (fuente: ${api.fuente})`);
    if (!juicio.ok) throw new EntornoError(`Me niego a correr: ${juicio.motivo}.`);

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
      `E2E_ITEM_TITLE=${env.E2E_ITEM_TITLE ?? ''}`,
    ];
    log(`Dispositivo: ${objetivo.serial} · Maestro ${version} · modo ${opts.modo}`);
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
          api: { host: juicio.host, fuente: api.fuente },
          comando:
            'maestro --device <serial> test .maestro --format junit -e APP_ID -e APP_LINK -e E2E_EMAIL -e E2E_PASSWORD (valores omitidos)',
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
