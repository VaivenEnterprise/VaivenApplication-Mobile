import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { AppState } from 'react-native';
import { bookingsKeys } from '@/features/bookings';
import {
  confirmPayment,
  confirmStage,
  fetchStage,
  issueQr,
  putEvidence,
  reportPayment,
} from '@/features/handover/api';
import { isStageConflict, scanFailureOf } from '@/features/handover/errors';
import {
  useConfirmPayment,
  useConfirmQr,
  useIssueQr,
  useReportPayment,
  useSaveEvidence,
  useStage,
} from '@/features/handover/hooks';
import { handoverKeys } from '@/features/handover/keys';
import { ApiError } from '@/lib/api/errors';
import { failure, installFakeApi, ok } from '@/test/fakeApi';
import { BOOKING_ID, fakeBooking } from '@/test/fakeBookings';
import {
  FAKE_TOKEN,
  fakePhoto,
  fakeQrToken,
  fakeRecordedStage,
  fakeStage,
} from '@/test/fakeHandover';

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));

jest.setTimeout(30_000);

afterEach(() => jest.restoreAllMocks());

const STAGE_PATH = `/bookings/${BOOKING_ID}/delivery`;
const EVIDENCE = {
  conditionNotes: 'Taladro limpio, con estuche.',
  photos: [{ publicId: fakePhoto(1).publicId }],
};

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, Wrapper };
}

describe('api de entrega y devolución', () => {
  it('fetchStage pide GET de la etapa y devuelve sus campos', async () => {
    installFakeApi({
      [`GET ${STAGE_PATH}`]: () => ok(fakeRecordedStage()),
      [`GET /bookings/${BOOKING_ID}/return`]: () => ok(fakeStage()),
    });
    const delivery = await fetchStage(BOOKING_ID, 'delivery');
    expect(delivery.evidenceVersion).toBe(1);
    expect(delivery.photos[0]?.thumbUrl).toContain('thumb');
    const back = await fetchStage(BOOKING_ID, 'return');
    expect(back.qr.state).toBe('none');
  });

  it('una etapa que no cumple el esquema es invalid_response', async () => {
    installFakeApi({ [`GET ${STAGE_PATH}`]: () => ok({ evidenceVersion: 'uno' }) });
    await expect(fetchStage(BOOKING_ID, 'delivery')).rejects.toMatchObject({
      code: 'invalid_response',
    });
  });

  it('putEvidence envía PUT con notas y referencias de fotos', async () => {
    const api = installFakeApi({ [`PUT ${STAGE_PATH}/evidence`]: () => ok(fakeRecordedStage()) });
    await putEvidence(BOOKING_ID, 'delivery', EVIDENCE);
    expect(api.calls[0]?.body).toEqual(EVIDENCE);
  });

  it('issueQr hace POST sin cuerpo y valida el QR', async () => {
    const api = installFakeApi({
      [`POST ${STAGE_PATH}/qr`]: () => ({ status: 201, body: fakeQrToken(BOOKING_ID, 'delivery') }),
    });
    const qr = await issueQr(BOOKING_ID, 'delivery');
    expect(qr.token).toBe(FAKE_TOKEN);
    expect(qr.qrPayload).toBe(`vaiven://qr?b=${BOOKING_ID}&s=delivery&t=${FAKE_TOKEN}`);
    expect(api.calls[0]?.body).toBeUndefined();
  });

  it('confirmStage envía el token y devuelve la reserva', async () => {
    const api = installFakeApi({
      [`POST ${STAGE_PATH}/confirm`]: () => ok(fakeBooking({ status: 'in_progress' })),
    });
    const booking = await confirmStage(BOOKING_ID, 'delivery', FAKE_TOKEN);
    expect(booking.status).toBe('in_progress');
    expect(api.calls[0]?.body).toEqual({ token: FAKE_TOKEN });
  });

  it('reportPayment y confirmPayment llaman a las rutas de pagos por etapa', async () => {
    const api = installFakeApi({
      [`POST /bookings/${BOOKING_ID}/payments/delivery/report`]: () => ok(fakeBooking()),
      [`POST /bookings/${BOOKING_ID}/payments/return/confirm`]: () => ok(fakeBooking()),
    });
    await reportPayment(BOOKING_ID, 'delivery');
    await reportPayment(BOOKING_ID, 'delivery', 'SPEI del 20');
    await confirmPayment(BOOKING_ID, 'return');
    expect(api.calls.map((call) => call.body)).toEqual([{}, { note: 'SPEI del 20' }, undefined]);
  });

  it('la reserva conserva las etapas, los pagos con su estado y los ajustes', async () => {
    installFakeApi({
      [`POST ${STAGE_PATH}/confirm`]: () =>
        ok(
          fakeBooking({
            status: 'in_progress',
            delivery: fakeRecordedStage({ confirmedAt: '2026-11-12T18:00:00Z' }),
            payments: [
              {
                stage: 'delivery',
                amountCents: 9000,
                status: 'reported',
                reportedAt: '2026-11-12T18:05:00Z',
                note: null,
                confirmedAt: null,
              },
            ],
            isLate: true,
            adjustments: [
              { type: 'late_return', lateDays: 2, amountCents: 6000, status: 'recorded' },
            ],
            affectedBy: '6731b1b2c3d4e5f6a7b8c9ee',
          }),
        ),
    });
    const booking = await confirmStage(BOOKING_ID, 'delivery', FAKE_TOKEN);
    expect(booking.delivery?.confirmedAt).toBe('2026-11-12T18:00:00Z');
    expect(booking.payments[0]?.status).toBe('reported');
    expect(booking.isLate).toBe(true);
    expect(booking.adjustments?.[0]?.lateDays).toBe(2);
    expect(booking.affectedBy).toBe('6731b1b2c3d4e5f6a7b8c9ee');
  });
});

describe('errores de confirmación', () => {
  const api = (code: ConstructorParameters<typeof ApiError>[0], status: number | null) =>
    new ApiError(code, 'x', status, null);

  it.each([
    ['conflict', 409, 'conflict'],
    ['forbidden', 403, 'forbidden'],
    ['not_found', 404, 'notFound'],
    ['rate_limited', 429, 'rateLimited'],
    ['network_error', null, 'network'],
    ['timeout', null, 'network'],
    ['validation_failed', 400, 'unknown'],
    ['internal_error', 500, 'unknown'],
  ] as const)('%s → %s', (code, status, expected) => {
    expect(scanFailureOf(api(code, status))).toBe(expected);
  });

  it('un error ajeno a ApiError es desconocido', () => {
    expect(scanFailureOf(new Error('x'))).toBe('unknown');
    expect(isStageConflict(new Error('x'))).toBe(false);
    expect(isStageConflict(api('conflict', 409))).toBe(true);
    expect(isStageConflict(api('forbidden', 403))).toBe(false);
  });
});

describe('hooks de entrega y devolución', () => {
  it('useStage lee la etapa', async () => {
    installFakeApi({ [`GET ${STAGE_PATH}`]: () => ok(fakeRecordedStage()) });
    const { Wrapper } = wrapper();
    const { result } = await renderHook(() => useStage(BOOKING_ID, 'delivery'), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.data?.evidenceVersion).toBe(1), { timeout: 5000 });
  });

  it('useStage con pollMs vuelve a consultar y se detiene con la app en segundo plano (RF-12)', async () => {
    const listeners = new Set<(state: string) => void>();
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      const callback = listener as (state: string) => void;
      listeners.add(callback);
      return { remove: () => listeners.delete(callback) };
    });
    const emit = (state: string) => act(() => listeners.forEach((listener) => listener(state)));
    const api = installFakeApi({ [`GET ${STAGE_PATH}`]: () => ok(fakeRecordedStage()) });
    const { Wrapper } = wrapper();
    await renderHook(() => useStage(BOOKING_ID, 'delivery', { pollMs: 40 }), { wrapper: Wrapper });
    await waitFor(() => expect(api.calls.length).toBeGreaterThanOrEqual(3), { timeout: 5000 });

    await emit('background');
    // Deja terminar la consulta que ya iba en camino antes de contar.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 120));
    });
    const paused = api.calls.length;
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });
    expect(api.calls.length).toBe(paused);

    await emit('active');
    await waitFor(() => expect(api.calls.length).toBeGreaterThan(paused), { timeout: 5000 });
  });

  it('useSaveEvidence guarda la etapa en caché y vuelve a leer la reserva', async () => {
    installFakeApi({ [`PUT ${STAGE_PATH}/evidence`]: () => ok(fakeRecordedStage()) });
    const { client, Wrapper } = wrapper();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = await renderHook(() => useSaveEvidence(BOOKING_ID, 'delivery'), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync(EVIDENCE);
    });
    expect(client.getQueryData(handoverKeys.stage(BOOKING_ID, 'delivery'))).toMatchObject({
      evidenceVersion: 1,
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: bookingsKeys.detail(BOOKING_ID) });
  });

  it('useIssueQr no conserva el token al salir de la pantalla (P-05)', async () => {
    installFakeApi({
      [`POST ${STAGE_PATH}/qr`]: () => ({ status: 201, body: fakeQrToken(BOOKING_ID, 'delivery') }),
    });
    const { client, Wrapper } = wrapper();
    const { result, unmount } = await renderHook(() => useIssueQr(BOOKING_ID, 'delivery'), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync();
    });
    await waitFor(() => expect(result.current.data?.token).toBe(FAKE_TOKEN));
    unmount();
    await waitFor(() => expect(client.getMutationCache().getAll()).toHaveLength(0), {
      timeout: 5000,
    });
  });

  it('useConfirmQr deja la reserva devuelta como detalle y refresca las listas (RF-10)', async () => {
    installFakeApi({
      [`POST ${STAGE_PATH}/confirm`]: () => ok(fakeBooking({ status: 'in_progress' })),
    });
    const { client, Wrapper } = wrapper();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = await renderHook(() => useConfirmQr(BOOKING_ID, 'delivery'), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync(FAKE_TOKEN);
    });
    expect(client.getQueryData(bookingsKeys.detail(BOOKING_ID))).toMatchObject({
      status: 'in_progress',
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: bookingsKeys.mine() });
  });

  it('useConfirmQr deja el fallo del servidor en el error (409 → conflict)', async () => {
    installFakeApi({ [`POST ${STAGE_PATH}/confirm`]: () => failure(409, 'conflict') });
    const { Wrapper } = wrapper();
    const { result } = await renderHook(() => useConfirmQr(BOOKING_ID, 'delivery'), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync(FAKE_TOKEN).catch(() => undefined);
    });
    await waitFor(() => expect(scanFailureOf(result.current.error)).toBe('conflict'));
  });

  it('los pagos actualizan la reserva en caché', async () => {
    installFakeApi({
      [`POST /bookings/${BOOKING_ID}/payments/delivery/report`]: () =>
        ok(fakeBooking({ status: 'accepted', version: 2 })),
      [`POST /bookings/${BOOKING_ID}/payments/delivery/confirm`]: () =>
        ok(fakeBooking({ status: 'accepted', version: 3 })),
    });
    const { client, Wrapper } = wrapper();
    const report = await renderHook(() => useReportPayment(BOOKING_ID), { wrapper: Wrapper });
    await act(async () => {
      await report.result.current.mutateAsync('delivery');
    });
    expect(client.getQueryData(bookingsKeys.detail(BOOKING_ID))).toMatchObject({ version: 2 });
    const confirm = await renderHook(() => useConfirmPayment(BOOKING_ID), { wrapper: Wrapper });
    await act(async () => {
      await confirm.result.current.mutateAsync('delivery');
    });
    expect(client.getQueryData(bookingsKeys.detail(BOOKING_ID))).toMatchObject({ version: 3 });
  });
});
