import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluarApi, main, parseAdbDevices, urlDeApi } from './device-tests.mjs';

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

test('solo acepta APIs de pruebas', () => {
  assert.equal(evaluarApi('https://vaiven-staging.westus2.cloudapp.azure.com').ok, true);
  assert.equal(evaluarApi('http://10.0.2.2:8080').ok, true);
  assert.equal(evaluarApi('http://192.168.1.20:8080').ok, true);
  assert.equal(evaluarApi('https://api.dev.vaiven.mx').ok, true);
  assert.equal(evaluarApi('https://api.vaiven.mx').ok, false);
  assert.equal(evaluarApi('https://developer.example.com').ok, false);
  assert.equal(evaluarApi('https://api.vaiven.mx', 'api.vaiven.mx').ok, true);
  assert.equal(evaluarApi('no es url').ok, false);
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
    build: { preview: { env: { EXPO_PUBLIC_API_URL: 'https://x-staging.example.com' } } },
  });
  const codigo = main(['--modo', 'apk'], {
    raiz: '/r',
    env,
    leer: () => eas,
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

test('se niega a correr contra una API que no parece de pruebas', () => {
  const r = escenario({
    adb: { status: 0, stdout: ADB_UNO },
    env: { E2E_API_URL: 'https://api.vaiven.mx' },
  });
  assert.equal(r.codigo, 2);
  assert.match(r.err.join('\n'), /no corre contra producción/);
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
