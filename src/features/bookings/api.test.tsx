import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import {
  acceptBooking,
  cancelBooking,
  createBooking,
  fetchBooking,
  fetchMyBookings,
  fetchQuote,
  isQuoteChanged,
  rejectBooking,
  setMeetingPoint,
} from '@/features/bookings/api';
import {
  useAcceptBooking,
  useCancelBooking,
  useCreateBooking,
  useMyBookings,
  useQuote,
  useRejectBooking,
  useSetMeetingPoint,
} from '@/features/bookings/hooks';
import { bookingsKeys } from '@/features/bookings/keys';
import { ApiError } from '@/lib/api/errors';
import { failure, installFakeApi, ok } from '@/test/fakeApi';
import { BOOKING_ID, ITEM_ID, fakeBooking, fakeQuote } from '@/test/fakeBookings';

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));

afterEach(() => jest.restoreAllMocks());

const REQUEST = {
  itemId: ITEM_ID,
  startDate: '2026-11-12',
  endDate: '2026-11-14',
  paymentMode: 'full_on_delivery' as const,
  acceptedTotalCents: 9000,
};

describe('api de reservas', () => {
  it('fetchQuote pide GET /items/{id}/quote con fechas y forma de pago', async () => {
    const api = installFakeApi({ [`GET /items/${ITEM_ID}/quote`]: () => ok(fakeQuote()) });
    const quote = await fetchQuote(ITEM_ID, '2026-11-12', '2026-11-14', 'full_on_delivery');
    expect(quote.totalCents).toBe(9000);
    const params = new URLSearchParams(api.calls[0]?.query);
    expect(params.get('startDate')).toBe('2026-11-12');
    expect(params.get('endDate')).toBe('2026-11-14');
    expect(params.get('paymentMode')).toBe('full_on_delivery');
  });

  it('createBooking envía POST /bookings con el total aceptado', async () => {
    const api = installFakeApi({ 'POST /bookings': () => ({ status: 201, body: fakeBooking() }) });
    const booking = await createBooking(REQUEST);
    expect(booking.status).toBe('pending');
    expect(api.calls[0]?.body).toEqual(REQUEST);
  });

  it('fetchBooking pide GET /bookings/{id}', async () => {
    installFakeApi({ [`GET /bookings/${BOOKING_ID}`]: () => ok(fakeBooking()) });
    expect((await fetchBooking(BOOKING_ID)).id).toBe(BOOKING_ID);
  });

  it('fetchMyBookings arma rol, estado y cursor', async () => {
    const api = installFakeApi({
      'GET /me/bookings': () => ok({ items: [fakeBooking()], nextCursor: 'c2' }),
    });
    const page = await fetchMyBookings('owner', 'c1', 'pending');
    expect(page.nextCursor).toBe('c2');
    const params = new URLSearchParams(api.calls[0]?.query);
    expect(params.get('role')).toBe('owner');
    expect(params.get('status')).toBe('pending');
    expect(params.get('cursor')).toBe('c1');
    await fetchMyBookings('requester', null);
    const second = new URLSearchParams(api.calls[1]?.query);
    expect(second.has('status')).toBe(false);
    expect(second.has('cursor')).toBe(false);
  });

  it('accept, reject, cancel y meeting-point usan sus rutas y cuerpos', async () => {
    const reply = () => ok(fakeBooking({ status: 'accepted' }));
    const api = installFakeApi({
      [`POST /bookings/${BOOKING_ID}/accept`]: reply,
      [`POST /bookings/${BOOKING_ID}/reject`]: reply,
      [`POST /bookings/${BOOKING_ID}/cancel`]: reply,
      [`POST /bookings/${BOOKING_ID}/meeting-point`]: reply,
    });
    await acceptBooking(BOOKING_ID);
    await acceptBooking(BOOKING_ID, 'Metro Coyoacán');
    await rejectBooking(BOOKING_ID);
    await rejectBooking(BOOKING_ID, 'No disponible');
    await cancelBooking(BOOKING_ID);
    await cancelBooking(BOOKING_ID, 'Ya no lo necesito');
    await setMeetingPoint(BOOKING_ID, 'Entrada principal');
    expect(api.calls.map((c) => c.body)).toEqual([
      {},
      { meetingPoint: { description: 'Metro Coyoacán' } },
      {},
      { reason: 'No disponible' },
      {},
      { reason: 'Ya no lo necesito' },
      { description: 'Entrada principal' },
    ]);
  });

  it('rechaza respuestas que no cumplen el contrato', async () => {
    installFakeApi({ [`GET /bookings/${BOOKING_ID}`]: () => ok({ id: BOOKING_ID }) });
    await expect(fetchBooking(BOOKING_ID)).rejects.toMatchObject({ code: 'invalid_response' });
  });

  it('isQuoteChanged reconoce solo el 409 con el detalle quote_changed (CA-03)', async () => {
    installFakeApi({
      'POST /bookings': () =>
        failure(409, 'conflict', [{ field: 'acceptedTotalCents', issue: 'quote_changed' }]),
    });
    const error = await createBooking(REQUEST).catch((e: unknown) => e);
    expect(isQuoteChanged(error)).toBe(true);
    installFakeApi({ 'POST /bookings': () => failure(409, 'conflict') });
    expect(isQuoteChanged(await createBooking(REQUEST).catch((e: unknown) => e))).toBe(false);
    expect(isQuoteChanged(new Error('x'))).toBe(false);
    expect(error).toBeInstanceOf(ApiError);
  });
});

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

describe('hooks de reservas', () => {
  it('useQuote cotiza solo si está habilitado y no conserva la respuesta', async () => {
    const api = installFakeApi({ [`GET /items/${ITEM_ID}/quote`]: () => ok(fakeQuote()) });
    const { wrapper } = setup();
    const args = {
      itemId: ITEM_ID,
      startDate: '2026-11-12',
      endDate: '2026-11-14',
      paymentMode: 'none' as const,
    };
    const off = await renderHook(() => useQuote(args, false), { wrapper });
    expect(off.result.current.fetchStatus).toBe('idle');
    expect(api.calls).toHaveLength(0);
    const on = await renderHook(() => useQuote(args), { wrapper });
    await waitFor(() => expect(on.result.current.data?.totalCents).toBe(9000));
  });

  it('useMyBookings pagina con el cursor', async () => {
    const api = installFakeApi({
      'GET /me/bookings': ({ query }) =>
        ok(
          query.includes('cursor=c1')
            ? { items: [fakeBooking({ id: 'b2' })], nextCursor: null }
            : { items: [fakeBooking()], nextCursor: 'c1' },
        ),
    });
    const { wrapper } = setup();
    const { result } = await renderHook(() => useMyBookings('requester'), { wrapper });
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(1));
    expect(result.current.hasNextPage).toBe(true);
    await act(async () => {
      await result.current.fetchNextPage();
    });
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    expect(result.current.hasNextPage).toBe(false);
    expect(api.calls).toHaveLength(2);
  });

  it('las mutaciones dejan el detalle en caché y recargan las listas (P-06)', async () => {
    installFakeApi({
      'POST /bookings': () => ({ status: 201, body: fakeBooking() }),
      [`POST /bookings/${BOOKING_ID}/accept`]: () => ok(fakeBooking({ status: 'accepted' })),
      [`POST /bookings/${BOOKING_ID}/reject`]: () => ok(fakeBooking({ status: 'rejected' })),
      [`POST /bookings/${BOOKING_ID}/cancel`]: () => ok(fakeBooking({ status: 'cancelled' })),
      [`POST /bookings/${BOOKING_ID}/meeting-point`]: () =>
        ok(fakeBooking({ status: 'accepted', meetingPoint: { description: 'Metro' } })),
    });
    const { client, wrapper } = setup();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const detail = () => client.getQueryData<{ status: string }>(bookingsKeys.detail(BOOKING_ID));

    const create = await renderHook(() => useCreateBooking(), { wrapper });
    await act(async () => {
      await create.result.current.mutateAsync(REQUEST);
    });
    expect(detail()?.status).toBe('pending');

    const accept = await renderHook(() => useAcceptBooking(BOOKING_ID), { wrapper });
    await act(async () => {
      await accept.result.current.mutateAsync(undefined);
    });
    expect(detail()?.status).toBe('accepted');

    const meeting = await renderHook(() => useSetMeetingPoint(BOOKING_ID), { wrapper });
    await act(async () => {
      await meeting.result.current.mutateAsync('Metro');
    });

    const reject = await renderHook(() => useRejectBooking(BOOKING_ID), { wrapper });
    await act(async () => {
      await reject.result.current.mutateAsync('No');
    });
    expect(detail()?.status).toBe('rejected');

    const cancel = await renderHook(() => useCancelBooking(BOOKING_ID), { wrapper });
    await act(async () => {
      await cancel.result.current.mutateAsync('Ya no lo necesito');
    });
    expect(detail()?.status).toBe('cancelled');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: bookingsKeys.mine() });
    expect(invalidate).toHaveBeenCalledTimes(5);
  });
});
