import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  avisosDeVariables,
  cargarHostsPermitidos,
  evaluarApi,
  hostPuerto,
  main,
  parseAdbDevices,
  tituloSeguro,
  urlDeApi,
} from './device-tests.mjs';

const HOST_OK = 'vaiven-staging.westus2.cloudapp.azure.com:8443';
const LISTA = [{ host: HOST_OK, origen: 'scripts/e2e-allowed-hosts.json' }];

const ADB_UNO =
  'List of devices attached\nR58M123ABC           device usb:1-1 product:x model:SM_A525M\n\n';
const ADB_EMU = 'List of devices attached\nemulator-5554          device product:sdk\n';
const ADB_NADA = 'List of devices attached\n\n';
const ADB_NO_AUTORIZADO = 'List of devices attached\nR58M123ABC           unauthorized usb:1-1\n';

test('parsea adb devices y distingue emuladores y no autorizados', () => {
  assert.deepEqual(parseAdbDevices(ADB_UNO), [
    { serial: 'R58M123ABC', estado: 'device', emulador: false },
  ]);
  assert.equal(parseAdbDevices(ADB_EMU)[0].emulador, true);
  assert.equal(parseAdbDevices(ADB_NADA).length, 0);
  assert.equal(parseAdbDevices(ADB_NO_AUTORIZADO)[0].estado, 'unauthorized');
});

test('hostPuerto normaliza host y puerto (sin puerto vale 443)', () => {
  assert.equal(hostPuerto('https://Vaiven.Example.com'), 'vaiven.example.com:443');
  assert.equal(hostPuerto('https://vaiven.example.com:8443/api'), 'vaiven.example.com:8443');
  assert.equal(hostPuerto('vaiven.example.com:8443'), 'vaiven.example.com:8443');
  assert.equal(hostPuerto('http://x.example.com'), 'x.example.com:80');
  assert.equal(hostPuerto(''), null);
});

test('acepta un host de la lista explícita y explica por qué (CA-04)', () => {
  const r = evaluarApi(`https://${HOST_OK}`, LISTA);
  assert.equal(r.ok, true);
  assert.match(r.motivo, /lista explícita/);
  assert.match(r.motivo, /e2e-allowed-hosts\.json/);
});

test('se niega a un host no listado aunque diga «staging» (CA-04)', () => {
  for (const url of [
    'https://vaiven-staging.westus2.cloudapp.azure.com',
    'https://vaiven-staging.westus2.cloudapp.azure.com:443',
    'https://vaiven-staging.westus2.cloudapp.azure.com:9443',
    'https://staging.otro.example.com:8443',
    'https://api.dev.vaiven.mx',
    'https://api.vaiven.mx',
    'https://developer.example.com',
  ]) {
    const r = evaluarApi(url, LISTA);
    assert.equal(r.ok, false, url);
    assert.match(r.motivo, /no figura en la lista explícita/);
  }
  assert.equal(evaluarApi('https://api.dev.vaiven.mx').ok, false);
});

test('el puerto cuenta: el mismo nombre con otro puerto no está permitido', () => {
  assert.equal(
    evaluarApi('https://vaiven-staging.westus2.cloudapp.azure.com:8443', LISTA).ok,
    true,
  );
  assert.equal(evaluarApi('https://vaiven-staging.westus2.cloudapp.azure.com', LISTA).ok, false);
});

test('acepta hosts locales (loopback, emulador y red privada)', () => {
  for (const url of [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://10.0.2.2:8080',
    'http://192.168.1.20:8080',
    'http://172.16.0.5:8080',
  ]) {
    const r = evaluarApi(url, []);
    assert.equal(r.ok, true, url);
    assert.match(r.motivo, /red local/);
  }
  assert.equal(evaluarApi('http://172.32.0.5:8080', []).ok, false);
  assert.equal(evaluarApi('http://11.0.0.1:8080', []).ok, false);
});

test('una URL inválida se rechaza', () => {
  assert.equal(evaluarApi('no es url', LISTA).ok, false);
});

test('la lista sale del archivo versionado y de E2E_ALLOW_API_HOST (varios, con coma)', () => {
  const archivo = JSON.stringify({ hosts: [HOST_OK] });
  const base = { raiz: '/r', leer: () => archivo, existe: () => true };
  assert.deepEqual(
    cargarHostsPermitidos({ ...base, env: {} }).map((h) => h.host),
    [HOST_OK],
  );
  const con = cargarHostsPermitidos({
    ...base,
    env: { E2E_ALLOW_API_HOST: 'a.example.com:8443, b.example.com' },
  });
  assert.deepEqual(
    con.map((h) => [h.host, h.origen]),
    [
      [HOST_OK, 'scripts/e2e-allowed-hosts.json'],
      ['a.example.com:8443', 'E2E_ALLOW_API_HOST'],
      ['b.example.com:443', 'E2E_ALLOW_API_HOST'],
    ],
  );
  assert.equal(cargarHostsPermitidos({ raiz: '/r', env: {}, existe: () => false }).length, 0);
  assert.throws(
    () => cargarHostsPermitidos({ ...base, leer: () => 'no json', env: {} }),
    /JSON válido/,
  );
  assert.throws(
    () => cargarHostsPermitidos({ ...base, leer: () => '{"hosts":1}', env: {} }),
    /lista/,
  );
});

test('el archivo versionado del repositorio lista solo el host decidido en entornos.md', () => {
  const real = cargarHostsPermitidos({
    env: {},
    raiz: fileURLToPath(new URL('..', import.meta.url)),
  });
  assert.deepEqual(
    real.map((h) => h.host),
    [HOST_OK],
  );
});

test('la URL sale de eas.json (apk) o de .env (Expo Go) y E2E_API_URL manda', () => {
  const eas = JSON.stringify({
    build: { preview: { env: { EXPO_PUBLIC_API_URL: 'https://x-staging.example.com' } } },
  });
  const leer = (p) => (p.endsWith('eas.json') ? eas : 'EXPO_PUBLIC_API_URL=http://10.0.2.2:8080\n');
  const base = { raiz: '/r', leer, existe: () => true };
  assert.equal(urlDeApi({ ...base, modo: 'apk', env: {} }).url, 'https://x-staging.example.com');
  assert.equal(urlDeApi({ ...base, modo: 'expo-go', env: {} }).url, 'http://10.0.2.2:8080');
  assert.equal(
    urlDeApi({ ...base, modo: 'apk', env: { E2E_API_URL: 'http://a.test' } }).url,
    'http://a.test',
  );
});

function escenario({
  adb,
  maestro = { status: 0, stdout: '1.40.0' },
  maestroTest = { status: 0, stdout: '' },
  env = {},
}) {
  const escritos = [];
  const llamadas = [];
  const salidas = { out: [], err: [] };
  const eas = JSON.stringify({
    build: { preview: { env: { EXPO_PUBLIC_API_URL: `https://${HOST_OK}` } } },
  });
  const hosts = JSON.stringify({ hosts: [HOST_OK] });
  const codigo = main(['--modo', 'apk'], {
    raiz: '/r',
    env,
    leer: (p) => (p.endsWith('e2e-allowed-hosts.json') ? hosts : eas),
    existe: () => true,
    log: (m) => salidas.out.push(m),
    err: (m) => salidas.err.push(m),
    escribir: (p, t) => escritos.push([p, t]),
    ahora: () => new Date('2026-11-26T10:00:00Z'),
    run: (cmd, args) => {
      llamadas.push([cmd, args]);
      if (cmd === 'adb' && args[0] === 'devices') return adb ?? { error: new Error('ENOENT') };
      if (cmd === 'adb') return { status: 0, stdout: 'SM-A525M' };
      if (args[0] === '--version') return maestro;
      return maestroTest;
    },
  });
  return { codigo, escritos, llamadas, ...salidas };
}

test('sin adb falla con mensaje claro y no escribe resultados (CA-08)', () => {
  const r = escenario({ adb: undefined });
  assert.equal(r.codigo, 2);
  assert.match(r.err.join('\n'), /adb/);
  assert.equal(r.escritos.length, 0);
});

test('sin dispositivo falla con mensaje claro y no escribe resultados (CA-08)', () => {
  const r = escenario({ adb: { status: 0, stdout: ADB_NADA } });
  assert.equal(r.codigo, 2);
  assert.match(r.err.join('\n'), /No hay ningún dispositivo/);
  assert.equal(r.escritos.length, 0);
});

test('un emulador no cuenta como dispositivo físico', () => {
  const r = escenario({ adb: { status: 0, stdout: ADB_EMU } });
  assert.equal(r.codigo, 2);
  assert.match(r.err.join('\n'), /emuladores/);
  assert.equal(r.escritos.length, 0);
});

test('sin Maestro falla con mensaje claro y no escribe resultados (CA-08)', () => {
  const r = escenario({
    adb: { status: 0, stdout: ADB_UNO },
    maestro: { error: new Error('ENOENT') },
  });
  assert.equal(r.codigo, 2);
  assert.match(r.err.join('\n'), /Maestro/);
  assert.equal(r.escritos.length, 0);
});

test('se niega a correr contra una API fuera de la lista explícita', () => {
  const r = escenario({
    adb: { status: 0, stdout: ADB_UNO },
    env: { E2E_API_URL: 'https://api.vaiven.mx' },
  });
  assert.equal(r.codigo, 2);
  assert.match(r.err.join('\n'), /no figura en la lista explícita/);
  assert.equal(r.escritos.length, 0);
  assert.ok(!r.llamadas.some(([c]) => c === 'maestro'));
});

test('con todo en orden ejecuta Maestro, guarda el resultado y no imprime la contraseña', () => {
  const r = escenario({
    adb: { status: 0, stdout: ADB_UNO },
    env: { E2E_EMAIL: 'e2e@example.com', E2E_PASSWORD: 'Secreta-123' },
  });
  assert.equal(r.codigo, 0);
  const test = r.llamadas.find(([c, a]) => c === 'maestro' && a.includes('test'));
  assert.ok(test);
  assert.ok(test[1].includes('E2E_PASSWORD=Secreta-123'));
  assert.equal(r.escritos.length, 1);
  const guardado = JSON.parse(r.escritos[0][1]);
  assert.equal(guardado.resultado, 'verde');
  assert.equal(guardado.dispositivo.fisico, true);
  assert.ok(!r.escritos[0][1].includes('Secreta-123'));
  assert.ok(!r.out.join('\n').includes('Secreta-123'));
});

test('si Maestro falla, el resultado guardado dice «fallo» y el código es 1', () => {
  const r = escenario({
    adb: { status: 0, stdout: ADB_UNO },
    maestroTest: { status: 1, stdout: '' },
  });
  assert.equal(r.codigo, 1);
  assert.equal(JSON.parse(r.escritos[0][1]).resultado, 'fallo');
});

test('el modo expo-go exige el enlace de Metro', () => {
  const salidas = [];
  const codigo = main(['--modo', 'expo-go'], {
    raiz: '/r',
    env: {},
    err: (m) => salidas.push(m),
    log: () => {},
  });
  assert.equal(codigo, 2);
  assert.match(salidas.join('\n'), /--link/);
});

test('se niega con «staging» en el nombre si el host no está en la lista', () => {
  const r = escenario({
    adb: { status: 0, stdout: ADB_UNO },
    env: { E2E_API_URL: 'https://otro-staging.example.com:8443' },
  });
  assert.equal(r.codigo, 2);
  assert.match(r.err.join('\n'), /no figura en la lista explícita/);
  assert.equal(r.escritos.length, 0);
  assert.ok(!r.llamadas.some(([c]) => c === 'maestro'));
});

test('imprime la URL activa y por qué la acepta (CA-04)', () => {
  const r = escenario({ adb: { status: 0, stdout: ADB_UNO } });
  const salida = r.out.join('\n');
  assert.match(salida, new RegExp(`API que usará la app: https://${HOST_OK}`));
  assert.match(salida, /API aceptada: .*lista explícita de hosts permitidos/);
  assert.match(JSON.parse(r.escritos[0][1]).api.aceptadaPor, /lista explícita/);
});

test('un host agregado por E2E_ALLOW_API_HOST se acepta y lo dice', () => {
  const r = escenario({
    adb: { status: 0, stdout: ADB_UNO },
    env: {
      E2E_API_URL: 'https://nuevo.example.com:8443',
      E2E_ALLOW_API_HOST: 'nuevo.example.com:8443',
    },
  });
  assert.equal(r.codigo, 0);
  assert.match(r.out.join('\n'), /E2E_ALLOW_API_HOST/);
});

// ── Spec 021 · T025 (RF-24): variables de demostración y flujos estrictos ─────────────────────

const ENV_DEMO = {
  E2E_EMAIL: 'e2e@example.com',
  E2E_PASSWORD: 'Secreta-123',
  E2E_ITEM_TITLE: 'Taladro percutor 600 W',
  E2E_CHAT_EMAIL: 'demo@vaiven.example',
  E2E_CHAT_PASSWORD: 'Demo-Secreta-456',
};

const argsDeMaestro = (r) => r.llamadas.find(([c, a]) => c === 'maestro' && a.includes('test'))[1];

test('avisa de cada variable de demostración que falta y del flujo que fallará', () => {
  assert.deepEqual(avisosDeVariables(ENV_DEMO), []);
  const avisos = avisosDeVariables({});
  assert.equal(avisos.length, 3);
  assert.match(avisos[0], /E2E_ITEM_TITLE.*03-solicitud/);
  assert.match(avisos[1], /E2E_CHAT_EMAIL.*08-chat/);
  assert.match(avisos[2], /E2E_CHAT_PASSWORD.*08-chat/);
});

test('sin variables de demostración la suite corre, avisa y las guarda como faltantes', () => {
  const r = escenario({ adb: { status: 0, stdout: ADB_UNO } });
  assert.equal(r.codigo, 0);
  assert.match(r.err.join('\n'), /Falta E2E_ITEM_TITLE: el flujo 03-solicitud fallará/);
  assert.deepEqual(JSON.parse(r.escritos[0][1]).variablesFaltantes, [
    'E2E_ITEM_TITLE',
    'E2E_CHAT_EMAIL',
    'E2E_CHAT_PASSWORD',
  ]);
});

test('pasa a Maestro las variables de demostración y una marca única de la corrida', () => {
  const r = escenario({ adb: { status: 0, stdout: ADB_UNO }, env: ENV_DEMO });
  const args = argsDeMaestro(r);
  for (const par of [
    'E2E_ITEM_TITLE=Taladro percutor 600 W',
    'E2E_CHAT_EMAIL=demo@vaiven.example',
    'E2E_CHAT_PASSWORD=Demo-Secreta-456',
    `E2E_RUN_ID=${new Date('2026-11-26T10:00:00Z').getTime()}`,
  ])
    assert.ok(args.includes(par), par);
  assert.equal(r.err.length, 0);
});

test('la cuenta de demostración no se imprime ni se guarda', () => {
  const r = escenario({ adb: { status: 0, stdout: ADB_UNO }, env: ENV_DEMO });
  const salida = [...r.out, ...r.err, ...r.escritos.map(([, t]) => t)].join('\n');
  assert.ok(!salida.includes('Demo-Secreta-456'));
  assert.ok(!salida.includes('demo@vaiven.example'));
});

test('tituloSeguro rechaza caracteres especiales de expresión regular', () => {
  assert.equal(tituloSeguro(''), true);
  assert.equal(tituloSeguro('Taladro percutor 600 W'), true);
  assert.equal(tituloSeguro('Hidrolavadora 1800 PSI, con manguera'), true);
  for (const malo of ['Bici (rodada 26)', 'Juego 2.0', 'A|B', 'Sierra*', 'Caja [grande]', 'x\\y'])
    assert.equal(tituloSeguro(malo), false, malo);
});

test('se niega a correr con un E2E_ITEM_TITLE que rompería los selectores', () => {
  const r = escenario({
    adb: { status: 0, stdout: ADB_UNO },
    env: { ...ENV_DEMO, E2E_ITEM_TITLE: 'Bici (rodada 26)' },
  });
  assert.equal(r.codigo, 2);
  assert.match(r.err.join('\n'), /caracteres especiales de expresión regular/);
  assert.equal(r.escritos.length, 0);
  assert.ok(!r.llamadas.some(([c]) => c === 'maestro'));
});

// Lectura de los flujos versionados (texto plano: Maestro no entra al paquete, spec 016 P-03).
const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const DIR_MAESTRO = join(RAIZ, '.maestro');
const leerFlujo = (ruta) => readFileSync(ruta, 'utf8');
const FLUJOS = readdirSync(DIR_MAESTRO)
  .filter((f) => /^\d\d-.+\.yaml$/.test(f))
  .sort()
  .map((f) => ({ archivo: f, ruta: join(DIR_MAESTRO, f) }));
const SUBFLUJOS = readdirSync(join(DIR_MAESTRO, '_shared'))
  .filter((f) => f.endsWith('.yaml'))
  .map((f) => ({ archivo: `_shared/${f}`, ruta: join(DIR_MAESTRO, '_shared', f) }));
const TODOS = [...FLUJOS, ...SUBFLUJOS];
const flujo = (prefijo) => leerFlujo(FLUJOS.find((f) => f.archivo.startsWith(prefijo)).ruta);

test('hay diez flujos, del 00 al 09, y cada uno se llama como su archivo', () => {
  assert.deepEqual(
    FLUJOS.map((f) => f.archivo),
    [
      '00-registro.yaml',
      '01-login.yaml',
      '02-explorar.yaml',
      '03-solicitud.yaml',
      '04-sesion-persiste.yaml',
      '05-publicar.yaml',
      '06-recomendaciones.yaml',
      '07-logout.yaml',
      '08-chat.yaml',
      '09-baja.yaml',
    ],
  );
  for (const f of FLUJOS)
    assert.match(leerFlujo(f.ruta), new RegExp(`^name: ${basename(f.archivo, '.yaml')}$`, 'm'));
});

test('config.yaml fija el orden de todos los flujos y la baja siempre corre al final', () => {
  const config = readFileSync(join(DIR_MAESTRO, 'config.yaml'), 'utf8');
  const orden = [...config.matchAll(/^ {4}- (\S+)$/gm)].map((m) => m[1]);
  assert.deepEqual(
    orden,
    FLUJOS.map((f) => basename(f.archivo, '.yaml')),
  );
  assert.equal(orden.at(-1), '09-baja');
  // Si un flujo intermedio falla, 09-baja tiene que correr igual para eliminar la cuenta efímera.
  assert.match(config, /continueOnFailure: true/);
});

test('03-solicitud falla si falta E2E_ITEM_TITLE: ya no se omite en silencio', () => {
  const texto = flujo('03-');
  const pasos = texto.split('---')[1];
  const primerPaso = pasos.split(/\r?\n/).find((l) => l.startsWith('- '));
  assert.equal(primerPaso, "- assertTrue: ${E2E_ITEM_TITLE != ''}");
  assert.doesNotMatch(texto, /when:/);
  // Y deja todo como estaba: cancela la solicitud.
  assert.match(texto, /tapOn: 'Cancelar reserva'/);
  assert.match(texto, /visible: 'Esta reserva se canceló\.'/);
});

test('02-explorar exige resultados: el estado vacío ya no cuenta como éxito', () => {
  const texto = flujo('02-');
  const esperas = [...texto.matchAll(/^\s+visible: '(.*)'$/gm)].map((m) => m[1]);
  assert.ok(esperas.length > 0);
  for (const e of esperas) assert.doesNotMatch(e, /Nada por aquí|Aún no hay objetos/);
  assert.match(texto, /assertNotVisible: 'Nada por aquí'/);
  assert.match(texto, /assertNotVisible: 'Aún no hay objetos publicados'/);
});

test('05-publicar sube una foto versionada, publica, comprueba y elimina el objeto', () => {
  const texto = flujo('05-');
  const media = /addMedia:\r?\n\s+- '(.+)'/.exec(texto);
  assert.ok(media, 'falta addMedia');
  assert.ok(existsSync(join(DIR_MAESTRO, media[1])), `no existe ${media[1]}`);
  assert.match(texto, /tapOn: 'Elegir de la galería'/);
  assert.match(texto, /visible: 'Foto 1, Portada\. Foto lista'/);
  assert.match(texto, /tapOn: 'Publicar'\r?\n/);
  assert.match(texto, /visible: 'Objeto de prueba \$\{E2E_RUN_ID\}, \.\*'/);
  assert.match(texto, /notVisible: 'Objeto de prueba \$\{E2E_RUN_ID\}, \.\*'/);
});

test('05-publicar comprueba la sugerencia con IA solo cuando el servidor la tiene activa', () => {
  const texto = flujo('05-').replace(/\r\n/g, '\n');
  const bloque =
    /- runFlow:\n\s+when:\n\s+visible: 'Sugerir con IA'\n\s+commands:\n((?:\s{6}.*\n)+)/.exec(
      texto,
    );
  assert.ok(bloque, 'la IA debe ir dentro de un runFlow condicionado al botón');
  assert.match(bloque[1], /tapOn: 'Sugerir con IA'/);
  assert.match(bloque[1], /visible: 'Usar'/);
  // Fuera del bloque no se toca la IA: sin el botón el flujo sigue.
  assert.equal(texto.split("tapOn: 'Sugerir con IA'").length, 2);
});

test('06-recomendaciones borra el historial y exige el aviso de éxito', () => {
  const texto = flujo('06-');
  assert.match(texto, /tapOn: 'Borrar historial de recomendaciones'/);
  assert.match(texto, /visible: 'Historial borrado'/);
});

test('08-chat falla sin la cuenta de demostración, envía un mensaje único y cierra la sesión', () => {
  const texto = flujo('08-');
  assert.match(texto, /assertTrue: \$\{E2E_CHAT_EMAIL != '' && E2E_CHAT_PASSWORD != ''\}/);
  assert.match(texto, /E2E_EMAIL: \$\{E2E_CHAT_EMAIL\}/);
  assert.match(texto, /inputText: 'Prueba automatizada \$\{E2E_RUN_ID\}'/);
  assert.match(texto, /visible: 'Tú, Prueba automatizada \$\{E2E_RUN_ID\}, \[\^,\]\+'/);
  assert.match(texto.trimEnd(), /runFlow: _shared\/cerrar-sesion\.yaml$/);
});

test('ningún flujo omite en silencio un paso que dependa de una variable de demostración', () => {
  for (const f of TODOS)
    assert.doesNotMatch(
      leerFlujo(f.ruta),
      /true: \$\{E2E_(ITEM|CHAT)/,
      `${f.archivo} usa when/true con una variable de demostración`,
    );
});

test('cada subflujo que se invoca existe', () => {
  for (const f of TODOS) {
    const texto = leerFlujo(f.ruta);
    const refs = [
      ...texto.matchAll(/runFlow: (\S+\.yaml)\r?$/gm),
      ...texto.matchAll(/file: (\S+\.yaml)\r?$/gm),
    ].map((m) => m[1]);
    for (const ref of refs)
      assert.ok(existsSync(join(dirname(f.ruta), ref)), `${f.archivo} → ${ref} no existe`);
  }
});

test('toda variable que usan los flujos la entrega el script a Maestro', () => {
  const r = escenario({ adb: { status: 0, stdout: ADB_UNO }, env: ENV_DEMO });
  const entregadas = new Set(
    argsDeMaestro(r)
      .filter((a) => /^[A-Z0-9_]+=/.test(a))
      .map((a) => a.split('=')[0]),
  );
  let usadas = 0;
  for (const f of TODOS)
    for (const [, expr] of leerFlujo(f.ruta).matchAll(/\$\{([^}]*)\}/g))
      for (const [nombre] of expr.matchAll(/\b[A-Z][A-Z0-9_]+\b/g)) {
        usadas++;
        assert.ok(entregadas.has(nombre), `${f.archivo} usa ${nombre} y el script no lo entrega`);
      }
  assert.ok(usadas > 10);
});

// Textos que los flujos buscan y que NO son de la app: datos de prueba o del servidor.
const DATOS_DE_PRUEBA = {
  taladro: 'término de búsqueda de 02; el `seed` del backend publica «Taladro percutor 600 W»',
  'Herramientas manuales': 'categoría POL-14 que entrega GET /categories (no está en i18n)',
  'Objeto de prueba': 'título del objeto que publica y elimina 05',
  'Prueba automatizada': 'texto del mensaje que envía 08',
};

/** Fragmentos literales (≥ 3 letras) de un selector de Maestro, que es una expresión regular. */
function literales(selector) {
  const s = selector.replace(/\$\{[^}]*\}/g, '\u0000');
  const trozos = [];
  let actual = '';
  let enClase = false;
  const cortar = () => {
    trozos.push(actual);
    actual = '';
  };
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (enClase) {
      if (c === ']') enClase = false;
      continue;
    }
    if (c === '\\') {
      actual += s[++i] ?? '';
    } else if (c === '[') {
      cortar();
      enClase = true;
    } else if ('.*+?()|{}^$\u0000'.includes(c)) {
      cortar();
    } else {
      actual += c;
    }
  }
  cortar();
  return trozos
    .flatMap((t) => t.split(/[,.] |\d+/))
    .map((t) => t.trim())
    .filter((t) => [...t].filter((ch) => /\p{L}/u.test(ch)).length >= 3);
}

/** Todos los literales de texto de `src/i18n/*.ts` (sin comentarios ni pruebas). */
function textosDeI18n() {
  const dir = join(RAIZ, 'src', 'i18n');
  const textos = [];
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.ts') && !n.endsWith('.test.ts'))) {
    const fuente = readFileSync(join(dir, f), 'utf8');
    for (const m of fuente.matchAll(
      /'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`|"((?:[^"\\\n]|\\.)*)"/g,
    ))
      textos.push(m[1] ?? m[2] ?? m[3]);
  }
  return textos;
}

test('literales: separa expresiones, variables, números y piezas de etiquetas compuestas', () => {
  assert.deepEqual(literales('Publicar objeto|Publicar mi primer objeto'), [
    'Publicar objeto',
    'Publicar mi primer objeto',
  ]);
  assert.deepEqual(literales('(?i).*taladro.*, .*'), ['taladro']);
  assert.deepEqual(literales('Foto 1, Portada. Foto lista'), ['Foto', 'Portada', 'Foto lista']);
  assert.deepEqual(literales('${E2E_ITEM_TITLE}, .*Pendiente'), ['Pendiente']);
  assert.deepEqual(literales('Tú, Prueba automatizada ${E2E_RUN_ID}, [^,]+'), [
    'Prueba automatizada',
  ]);
  assert.deepEqual(literales('(?!.*Conversación cerrada).+\\. .+\\. .+'), ['Conversación cerrada']);
  assert.deepEqual(literales('¿Qué necesitas?'), ['¿Qué necesitas']);
});

test('los textos de la app que buscan los flujos salen de src/i18n/ (RF-24)', () => {
  const i18n = textosDeI18n();
  assert.ok(i18n.includes('Borrar historial de recomendaciones'));
  const claves =
    /^\s*-?\s*(tapOn|assertVisible|assertNotVisible|visible|notVisible|element|text):\s*'(.*)'\s*$/;
  const faltan = [];
  let revisados = 0;
  for (const f of TODOS) {
    for (const linea of leerFlujo(f.ruta).split(/\r?\n/)) {
      const m = claves.exec(linea);
      if (!m) continue;
      for (const lit of literales(m[2])) {
        revisados++;
        if (lit in DATOS_DE_PRUEBA) continue;
        if (!i18n.some((t) => t.includes(lit))) faltan.push(`${f.archivo}: «${lit}»`);
      }
    }
  }
  assert.ok(revisados > 50, `solo se revisaron ${revisados} textos`);
  assert.deepEqual(faltan, []);
});

test('un texto inventado en un flujo se detectaría (caso negativo)', () => {
  const i18n = textosDeI18n();
  for (const inventado of ['Publicar ahora mismo', 'Resultados de búsqueda'])
    assert.ok(!i18n.some((t) => t.includes(inventado)), inventado);
});

test('los datos de prueba permitidos se usan en algún flujo (no sobran)', () => {
  const todo = TODOS.map((f) => leerFlujo(f.ruta)).join('\n');
  for (const dato of Object.keys(DATOS_DE_PRUEBA)) assert.ok(todo.includes(dato), dato);
});
