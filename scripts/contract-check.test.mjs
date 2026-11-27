import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  cargarContrato,
  ejecutarEnVivo,
  operacionesGetPublicas,
  validar,
  validarRespuesta,
} from './contract-check.mjs';

function contratoDePrueba() {
  const dir = mkdtempSync(join(tmpdir(), 'contrato-'));
  mkdirSync(join(dir, 'paths'));
  writeFileSync(
    join(dir, 'openapi.yaml'),
    `openapi: 3.1.0
paths:
  /healthz:
    get:
      security: []
      responses:
        '200':
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Salud' }
  /api/v1/cosas/{id}:
    $ref: './paths/cosas.yaml#/cosa'
  /api/v1/privada:
    get:
      responses: { '200': { description: x } }
components:
  schemas:
    Salud:
      type: object
      required: [status]
      additionalProperties: false
      properties:
        status: { type: string, enum: [ok] }
`,
  );
  writeFileSync(
    join(dir, 'paths', 'cosas.yaml'),
    `cosa:
  get:
    responses:
      '200':
        content:
          application/json:
            schema:
              type: object
              required: [id, nota]
              properties:
                id: { type: string }
                nota: { type: [string, 'null'] }
`,
  );
  return cargarContrato(join(dir, 'openapi.yaml'));
}

test('cargarContrato falla con un mensaje claro si no existe', () => {
  assert.throws(() => cargarContrato('/no/existe/openapi.yaml'), /No se encontró el contrato/);
});

test('validar detecta tipo, requerido, enum y propiedades de más', () => {
  const c = contratoDePrueba();
  const s = { $ref: '#/components/schemas/Salud' };
  assert.deepEqual(validar({ status: 'ok' }, s, c), []);
  assert.match(validar({}, s, c).join(), /falta/);
  assert.match(validar({ status: 'mal' }, s, c).join(), /enum/);
  assert.match(validar({ status: 'ok', extra: 1 }, s, c).join(), /no declarada/);
});

test('validarRespuesta sigue $ref entre archivos y acepta null en tipos 3.1', () => {
  const c = contratoDePrueba();
  assert.deepEqual(
    validarRespuesta(c, 'GET', '/api/v1/cosas/abc', 200, { id: 'a', nota: null }).errores,
    [],
  );
  assert.ok(
    validarRespuesta(c, 'GET', '/api/v1/cosas/abc', 200, { id: 1, nota: 'x' }).errores.length > 0,
  );
  assert.match(
    validarRespuesta(c, 'GET', '/api/v1/nada', 200, {}).error,
    /no existe en el contrato/,
  );
});

test('solo se piden los GET públicos sin parámetros', () => {
  assert.deepEqual(operacionesGetPublicas(contratoDePrueba()), ['/healthz']);
});

test('ejecutarEnVivo usa solo GET, sin credenciales, y avisa si la API no responde', async () => {
  const c = contratoDePrueba();
  const vistas = [];
  const bien = await ejecutarEnVivo({
    contrato: c,
    base: 'http://api.test',
    peticion: async (url, init) => {
      vistas.push({ url, init });
      return { status: 200, json: async () => ({ status: 'ok' }) };
    },
  });
  assert.deepEqual(bien.fallos, []);
  assert.deepEqual(
    vistas.map((v) => v.init.method),
    ['GET'],
  );
  assert.equal(vistas[0].init.headers.Authorization, undefined);
  const mal = await ejecutarEnVivo({
    contrato: c,
    base: 'http://api.test',
    peticion: async () => {
      throw new Error('ECONNREFUSED');
    },
  });
  assert.match(mal.fallos[0], /la API no responde/);
});
