import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { FAKE_TOKEN } from '@/test/fakeHandover';
import { BOOKING_ID, ITEM_ID } from '@/test/fakeBookings';
import { createJourneyBackend } from './fakeApi';

// Spec 021-T010: las respuestas de fakeApi (el «servidor» de la prueba de punta a punta) se validan
// contra ../vaiven-backend/api/openapi.yaml, solo lectura. Si el contrato cambia y fakeApi no, esta
// prueba falla. Sin el contrato junto al repositorio la prueba se omite con un aviso; en ese caso
// `npm run test:contract` falla con un mensaje claro.
const lib =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('../../scripts/contract-lib.cjs') as typeof import('../../scripts/contract-lib.cjs');

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const ruta = resolve(process.env.VAIVEN_OPENAPI ?? '../vaiven-backend/api/openapi.yaml');
const hay = existsSync(ruta);
if (!hay) console.warn(`contract.test: sin contrato en ${ruta}; se omite (define VAIVEN_OPENAPI).`);
const describeSiHay = hay ? describe : describe.skip;

// Campos que el contrato exige en la respuesta y que la app todavía no consume, por lo que fakeApi
// no los envía. Esta lista solo puede encogerse: un hueco nuevo hace fallar la prueba.
const HUECOS_CONOCIDOS = [
  '$.adjustments',
  '$.affectedBy',
  '$.isLate',
  '$.payments[].confirmedAt',
  '$.payments[].note',
  '$.payments[].reportedAt',
  '$.payments[].status',
  '$.photos[].bytes',
  '$.photos[].delivery',
  '$.photos[].format',
  '$.photos[].height',
  '$.photos[].width',
];

describeSiHay('contrato OpenAPI ↔ fakeApi (spec 021-T010)', () => {
  it('cada respuesta del recorrido cumple el esquema declarado', async () => {
    const contrato = lib.cargarContrato(ruta);
    const backend = createJourneyBackend();
    const vistas: string[] = [];
    const errores: string[] = [];
    const huecos = new Set<string>();

    async function llamar(metodo: string, path: string, body?: unknown) {
      const res = await fetch(`http://api.test/api/v1${path}`, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const json = (await res.json()) as unknown;
      const sinQuery = `/api/v1${path.split('?')[0]}`;
      // Desvío real: campo de más, tipo distinto o valor fuera del enum (los requeridos se miran aparte).
      const v = lib.validarRespuesta(contrato, metodo, sinQuery, res.status, json, {
        parcial: true,
      });
      if ('error' in v && v.error) errores.push(v.error);
      else
        for (const e of v.errores ?? [])
          errores.push(`${metodo} ${sinQuery} → ${res.status}: ${e}`);
      const estricta = lib.validarRespuesta(contrato, metodo, sinQuery, res.status, json);
      for (const e of estricta.errores ?? []) {
        const m = /^(\$[^:]*): falta \(requerido\)$/.exec(e);
        if (m)
          huecos.add(
            `${metodo} ${v.plantilla ?? sinQuery} ${(m[1] ?? '').replace(/\[\d+\]/g, '[]')}`,
          );
      }
      vistas.push(`${metodo} ${v.plantilla ?? sinQuery} ${res.status}`);
      return res.status;
    }

    const b = `/bookings/${BOOKING_ID}`;
    backend.as('requester');
    await llamar('GET', `/items/${ITEM_ID}`);
    await llamar('GET', `/items/${ITEM_ID}/quote?startDate=2026-12-01&endDate=2026-12-02`);
    await llamar('POST', '/bookings', {
      itemId: ITEM_ID,
      startDate: '2026-12-01',
      endDate: '2026-12-02',
      paymentMode: 'full_on_delivery',
      acceptedTotalCents: 3000,
    });
    await llamar('GET', b);
    backend.as('owner');
    await llamar('POST', `${b}/accept`, {});
    for (const etapa of ['delivery', 'return'] as const) {
      await llamar('PUT', `${b}/${etapa}/evidence`, { conditionNotes: 'Sin daños', photos: [] });
      await llamar('GET', `${b}/${etapa}`);
      await llamar('POST', `${b}/${etapa}/qr`);
      backend.as('requester');
      await llamar('POST', `${b}/${etapa}/confirm`, { token: FAKE_TOKEN });
      backend.as('owner');
    }
    backend.as('requester');
    await llamar('GET', `${b}/rating-status`);
    await llamar('POST', `${b}/ratings`, { score: 5, comment: 'Todo bien' });

    expect(backend.violations).toEqual([]);
    expect(vistas.length).toBeGreaterThanOrEqual(12);
    expect(errores).toEqual([]);
    const nuevos = [...huecos].filter(
      (h) => !HUECOS_CONOCIDOS.includes(h.replace(/^\S+ \S+ /, '')),
    );
    expect(nuevos).toEqual([]);
  });
});
