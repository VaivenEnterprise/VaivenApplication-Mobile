import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import {
  cargarHostsPermitidos,
  evaluarApi,
  hostPuerto,
  main,
  parseAdbDevices,
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
