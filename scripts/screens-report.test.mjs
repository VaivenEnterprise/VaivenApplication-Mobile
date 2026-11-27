import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  ASISTENTE,
  archivoDeImport,
  construirMatriz,
  extraerEndpoints,
  extraerRegistros,
  normalizarRuta,
  prefijoUrl,
  renderizar,
  rutasContrato,
} from './screens-report.mjs';

test('normaliza rutas', () => {
  assert.equal(normalizarRuta('/incidents/${encodeURIComponent(id)}'), '/incidents/{}');
  assert.equal(normalizarRuta('/me/items?${query.toString()}'), '/me/items');
  assert.equal(normalizarRuta('/conversations${query}'), '/conversations');
  assert.equal(normalizarRuta('/items?limit=6'), '/items');
});

test('extrae endpoints y método', () => {
  const t =
    "request('/items', schema, { method: 'POST', body: x });\nrequest<Foo>(`/bookings/${id}`, s)";
  assert.deepEqual(extraerEndpoints(t), ['POST /items', 'GET /bookings/{}']);
});

test('lee las rutas del contrato', () => {
  const s = 'paths:\n  /api/v1/items/{id}:\n    get:\n  /healthz:\n';
  assert.deepEqual([...rutasContrato(s)].sort(), ['/healthz', '/items/{}']);
});

function repo() {
  const raiz = mkdtempSync(join(tmpdir(), 'v16-'));
  const w = (p, c) => {
    mkdirSync(join(raiz, p, '..'), { recursive: true });
    writeFileSync(join(raiz, p), c);
  };
  w('src/features/a/api.ts', "export const f = () => request('/things', s);");
  w('src/features/a/hooks.ts', "import { f } from '@/features/a/api';");
  w('src/features/a/screens/AScreen.tsx', "import '../hooks';");
  w('src/features/a/screens/BScreen.tsx', 'export {};');
  w('src/features/a/screens/AScreen.test.tsx', "import '@/features/a/screens/AScreen';");
  w('src/features/a/a.integration.test.tsx', "import '@/features/a/screens/AScreen';");
  w('src/app/a.tsx', "import '@/features/a/screens/AScreen';");
  w('src/app/_layout.tsx', 'export {};');
  return raiz;
}

test('construye la matriz y marca los huecos', () => {
  const m = construirMatriz(repo(), 'paths:\n  /api/v1/things:\n');
  const a = m.filas.find((f) => f.pantalla.endsWith('AScreen.tsx'));
  const b = m.filas.find((f) => f.pantalla.endsWith('BScreen.tsx'));
  assert.deepEqual(a.endpoints, ['GET /things']);
  assert.equal(a.pruebas.unitarias.length, 1);
  assert.equal(a.pruebas['integración'].length, 1);
  assert.equal(a.pruebas.seguridad.length, 0);
  assert.deepEqual(a.rutas, ['src/app/a.tsx']);
  assert.equal(b.pruebas.unitarias.length, 0);
  assert.deepEqual(m.fueraDelContrato, []);
  const md = renderizar(m, '2026-01-01');
  assert.match(md, /\*\*sin prueba\*\*/);
  assert.match(md, /seguridad:\*\* 1 sin prueba — AScreen/);
  assert.match(md, /Sin endpoints y sin prueba unitaria:\*\* BScreen/);
});

test('detecta endpoints fuera del contrato', () => {
  const m = construirMatriz(repo(), 'paths:\n  /api/v1/otra:\n');
  assert.equal(m.fueraDelContrato.length, 1);
});

test('prefijo de URL de una ruta', () => {
  assert.equal(prefijoUrl('src/app/(tabs)/mensajes/index.tsx'), '/mensajes');
  assert.equal(prefijoUrl('src/app/chat/[id].tsx'), '/chat');
  assert.equal(prefijoUrl('src/app/incidencia/nueva/[bookingId].tsx'), '/incidencia/nueva');
  assert.equal(prefijoUrl('src/app/[id].tsx'), null);
});

test('resuelve ayudantes de ruta y primer argumento con comas', () => {
  const t =
    'const bp = (id: string) => `/bookings/${encodeURIComponent(id)}`;\nconst sp = (id: string, s: S) => `${bp(id)}/${s}`;\n' +
    "request(sp(id, stage), schema, { signal });\nrequest(`${bp(id)}/qr`, q, { method: 'POST' });\nrequest(bp(id), b);";
  assert.deepEqual(extraerEndpoints(t), [
    'GET /bookings/{}/{}',
    'POST /bookings/{}/qr',
    'GET /bookings/{}',
  ]);
});

test('extraerRegistros lee los slots.register de un index.ts', () => {
  const texto =
    'slots.register(\'chat\', OpenChatButton);\nslots.register("ratingsAndIncidents",  TrustSection );';
  assert.deepEqual(extraerRegistros(texto), [
    { slot: 'chat', componente: 'OpenChatButton' },
    { slot: 'ratingsAndIncidents', componente: 'TrustSection' },
  ]);
  assert.deepEqual(extraerRegistros('const x = 1;'), []);
});

test('archivoDeImport resuelve el archivo del que se importa un componente', () => {
  const raiz = mkdtempSync(join(tmpdir(), 'slots-'));
  mkdirSync(join(raiz, 'src', 'features', 'chat'), { recursive: true });
  writeFileSync(
    join(raiz, 'src', 'features', 'chat', 'OpenChatButton.tsx'),
    'export const OpenChatButton = 1;',
  );
  const desde = join(raiz, 'src', 'features', 'chat', 'index.ts');
  const texto = "import { OpenChatButton } from './OpenChatButton';";
  assert.equal(
    archivoDeImport(texto, 'OpenChatButton', desde, raiz),
    join(raiz, 'src', 'features', 'chat', 'OpenChatButton.tsx'),
  );
  assert.equal(archivoDeImport(texto, 'Otro', desde, raiz), null);
});

test('el asistente de proyectos del contrato queda listado con sus dos operaciones', () => {
  assert.deepEqual(ASISTENTE, [
    'POST /ai/assistant/messages',
    'DELETE /ai/assistant/conversations/{}',
  ]);
});
