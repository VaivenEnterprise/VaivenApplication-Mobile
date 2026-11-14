import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { bookingsKeys } from '@/features/bookings';
import { createIncident, fetchIncident, fetchMyIncidents } from '@/features/incidents/api';
import { incidentErrorMessage } from '@/features/incidents/errors';
import { useCreateIncident, useIncident, useMyIncidents } from '@/features/incidents/hooks';
import { incidentsKeys } from '@/features/incidents/keys';
import { es } from '@/i18n/es-MX';
import { ApiError } from '@/lib/api/errors';
import { failure, installFakeApi, ok } from '@/test/fakeApi';
import { BOOKING_ID } from '@/test/fakeBookings';
import { INCIDENT_ID, fakeEvidence, fakeIncident } from '@/test/fakeTrust';

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
jest.setTimeout(30_000);

afterEach(() => jest.restoreAllMocks());

const POST = `POST /bookings/${BOOKING_ID}/incidents`;
const ONE = `GET /incidents/${INCIDENT_ID}`;
const MINE = 'GET /me/incidents';

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, Wrapper };
}

describe('api de incidencias', () => {
  it('createIncident envía motivo, descripción y evidencia', async () => {
    const api = installFakeApi({ [POST]: () => ({ status: 201, body: fakeIncident() }) });
    const incident = await createIncident(BOOKING_ID, {
      reason: 'damaged',
      description: 'La tapa llegó rota y no estaba así.',
      evidence: [{ publicId: 'vaiven/evidence/1' }],
    });
    expect(incident.status).toBe('open');
    expect(api.calls[0]?.method).toBe('POST');
    expect(api.calls[0]?.body).toEqual({
      reason: 'damaged',
      description: 'La tapa llegó rota y no estaba así.',
      evidence: [{ publicId: 'vaiven/evidence/1' }],
    });
  });

  it('fetchIncident trae la evidencia firmada y la respuesta final', async () => {
    installFakeApi({
      [ONE]: () =>
        ok(
          fakeIncident({
            status: 'closed',
            evidence: [fakeEvidence(1)],
            notes: [{ text: 'Revisamos las fotos.', at: '2026-11-14T10:00:00Z' }],
            finalResponse: {
              text: 'Se registró un ajuste.',
              outcome: 'monetary_adjustment',
              at: '2026-11-15T10:00:00Z',
            },
            closedAt: '2026-11-15T10:00:00Z',
          }),
        ),
    });
    const incident = await fetchIncident(INCIDENT_ID);
    expect(incident.evidence[0]?.thumbUrl).toContain('thumb');
    expect(incident.finalResponse?.outcome).toBe('monetary_adjustment');
  });

  it('fetchMyIncidents pide página, estado y cursor', async () => {
    const api = installFakeApi({ [MINE]: () => ok({ items: [fakeIncident()], nextCursor: 'c2' }) });
    await fetchMyIncidents('c1', 'open');
    expect(api.calls[0]?.query).toBe('limit=20&status=open&cursor=c1');
    await fetchMyIncidents(null);
    expect(api.calls[1]?.query).toBe('limit=20');
  });

  it('un motivo desconocido del servidor es invalid_response', async () => {
    installFakeApi({ [ONE]: () => ok({ ...fakeIncident(), reason: 'robo' }) });
    const error = await fetchIncident(INCIDENT_ID).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('invalid_response');
  });
});

describe('incidentErrorMessage (RF-08)', () => {
  const e = (code: ConstructorParameters<typeof ApiError>[0], status: number) =>
    new ApiError(code, 'x', status, null, []);

  it('409, 403 y 404 tienen mensaje propio', () => {
    expect(incidentErrorMessage(e('conflict', 409))).toBe(es.incidents.errors.conflict);
    expect(incidentErrorMessage(e('forbidden', 403))).toBe(es.incidents.errors.forbidden);
    expect(incidentErrorMessage(e('not_found', 404))).toBe(es.incidents.errors.notFound);
  });

  it('red, tiempo y límite usan el mensaje general del código', () => {
    expect(incidentErrorMessage(e('network_error', 0))).toBe(es.errors.network_error);
    expect(incidentErrorMessage(e('rate_limited', 429))).toBe(es.errors.rate_limited);
  });

  it('cualquier otro fallo da el mensaje genérico', () => {
    expect(incidentErrorMessage(e('internal_error', 500))).toBe(es.incidents.errors.generic);
    expect(incidentErrorMessage(new Error('x'))).toBe(es.incidents.errors.generic);
  });
});

describe('hooks de incidencias', () => {
  it('useMyIncidents pagina con el cursor del servidor', async () => {
    installFakeApi({
      [MINE]: (req) =>
        req.query.includes('cursor=c2')
          ? ok({ items: [fakeIncident({ id: 'b' })], nextCursor: null })
          : ok({ items: [fakeIncident({ id: 'a' })], nextCursor: 'c2' }),
    });
    const { Wrapper } = wrapper();
    const { result } = await renderHook(() => useMyIncidents(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(1));
    expect(result.current.hasNextPage).toBe(true);
    await act(async () => {
      await result.current.fetchNextPage();
    });
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    expect(result.current.hasNextPage).toBe(false);
  });

  it('useIncident trae una incidencia', async () => {
    installFakeApi({ [ONE]: () => ok(fakeIncident()) });
    const { Wrapper } = wrapper();
    const { result } = await renderHook(() => useIncident(INCIDENT_ID), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.data?.id).toBe(INCIDENT_ID));
  });

  it('useCreateIncident deja el detalle en caché e invalida la lista y la reserva', async () => {
    installFakeApi({ [POST]: () => ({ status: 201, body: fakeIncident() }) });
    const { client, Wrapper } = wrapper();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = await renderHook(() => useCreateIncident(BOOKING_ID), { wrapper: Wrapper });
    await act(async () => {
      await result.current.mutateAsync({ reason: 'damaged', description: 'a'.repeat(12) });
    });
    expect(client.getQueryData(incidentsKeys.detail(INCIDENT_ID))).toMatchObject({
      id: INCIDENT_ID,
    });
    const keys = invalidate.mock.calls.map((call) => JSON.stringify(call[0]?.queryKey));
    expect(keys).toEqual(
      expect.arrayContaining([
        JSON.stringify(incidentsKeys.mine()),
        JSON.stringify(bookingsKeys.detail(BOOKING_ID)),
      ]),
    );
  });

  it('un 409 al reportar llega como error de conflicto', async () => {
    installFakeApi({ [POST]: () => failure(409, 'conflict') });
    const { Wrapper } = wrapper();
    const { result } = await renderHook(() => useCreateIncident(BOOKING_ID), { wrapper: Wrapper });
    await act(async () => {
      await result.current
        .mutateAsync({ reason: 'no_show', description: 'a'.repeat(12) })
        .catch(() => undefined);
    });
    await waitFor(() => expect(result.current.error).toBeInstanceOf(ApiError));
    expect((result.current.error as ApiError).status).toBe(409);
  });
});
