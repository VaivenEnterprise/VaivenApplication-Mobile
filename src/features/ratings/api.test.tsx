import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { bookingsKeys } from '@/features/bookings';
import { createRating, fetchRatingStatus, fetchUserRatings } from '@/features/ratings/api';
import { useCreateRating, useRatingStatus, useUserRatings } from '@/features/ratings/hooks';
import { ratingsKeys } from '@/features/ratings/keys';
import { ApiError } from '@/lib/api/errors';
import { failure, installFakeApi, ok } from '@/test/fakeApi';
import { BOOKING_ID } from '@/test/fakeBookings';
import { fakeRating, fakeRatingStatus } from '@/test/fakeTrust';

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
jest.setTimeout(30_000);

afterEach(() => jest.restoreAllMocks());

const POST = `POST /bookings/${BOOKING_ID}/ratings`;
const STATUS = `GET /bookings/${BOOKING_ID}/rating-status`;
const USER_ID = '6730f1c2a9b3e4d5f6a7b8c9';
const RATINGS = `GET /users/${USER_ID}/ratings`;

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, Wrapper };
}

describe('api de calificaciones', () => {
  it('createRating envía puntaje y comentario y devuelve la calificación', async () => {
    const api = installFakeApi({ [POST]: () => ({ status: 201, body: fakeRating({ score: 4 }) }) });
    const rating = await createRating(BOOKING_ID, { score: 4, comment: 'Puntual' });
    expect(rating.score).toBe(4);
    expect(api.calls[0]?.method).toBe('POST');
    expect(api.calls[0]?.body).toEqual({ score: 4, comment: 'Puntual' });
  });

  it('createRating sin comentario no envía el campo', async () => {
    const api = installFakeApi({ [POST]: () => ({ status: 201, body: fakeRating() }) });
    await createRating(BOOKING_ID, { score: 5 });
    expect(api.calls[0]?.body).toEqual({ score: 5 });
  });

  it('un 409 (ya calificó) llega como ApiError de conflicto (CA-02)', async () => {
    installFakeApi({ [POST]: () => failure(409, 'conflict') });
    await expect(createRating(BOOKING_ID, { score: 5 })).rejects.toMatchObject({
      code: 'conflict',
      status: 409,
    });
  });

  it('fetchRatingStatus devuelve canRate, myRating y expiresAt', async () => {
    installFakeApi({ [STATUS]: () => ok(fakeRatingStatus()) });
    const status = await fetchRatingStatus(BOOKING_ID);
    expect(status).toEqual({ canRate: true, myRating: null, expiresAt: '2026-12-05T16:00:00Z' });
  });

  it('fetchUserRatings pide una página con límite y cursor', async () => {
    const api = installFakeApi({
      [RATINGS]: () => ok({ items: [fakeRating()], nextCursor: 'c2' }),
    });
    const page = await fetchUserRatings(USER_ID, 'c1');
    expect(page.nextCursor).toBe('c2');
    expect(api.calls[0]?.query).toBe('limit=20&cursor=c1');
    await fetchUserRatings(USER_ID, null);
    expect(api.calls[1]?.query).toBe('limit=20');
  });

  it('una respuesta que no cumple el esquema es invalid_response', async () => {
    installFakeApi({ [STATUS]: () => ok({ canRate: 'sí' }) });
    const error = await fetchRatingStatus(BOOKING_ID).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('invalid_response');
  });
});

describe('hooks de calificaciones', () => {
  it('useRatingStatus no consulta mientras esté deshabilitado', async () => {
    const api = installFakeApi({ [STATUS]: () => ok(fakeRatingStatus()) });
    const { Wrapper } = wrapper();
    await renderHook(() => useRatingStatus(BOOKING_ID, false), { wrapper: Wrapper });
    expect(api.calls).toHaveLength(0);
  });

  it('useRatingStatus consulta cuando está habilitado', async () => {
    installFakeApi({ [STATUS]: () => ok(fakeRatingStatus({ canRate: false })) });
    const { Wrapper } = wrapper();
    const { result } = await renderHook(() => useRatingStatus(BOOKING_ID, true), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.data?.canRate).toBe(false));
  });

  it('useUserRatings pagina con el cursor del servidor', async () => {
    installFakeApi({
      [RATINGS]: (req) =>
        req.query.includes('cursor=c2')
          ? ok({ items: [fakeRating({ id: 'b' })], nextCursor: null })
          : ok({ items: [fakeRating({ id: 'a' })], nextCursor: 'c2' }),
    });
    const { Wrapper } = wrapper();
    const { result } = await renderHook(() => useUserRatings(USER_ID), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(1));
    expect(result.current.hasNextPage).toBe(true);
    await act(async () => {
      await result.current.fetchNextPage();
    });
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    expect(result.current.hasNextPage).toBe(false);
  });

  it('useCreateRating deja el estado como calificado e invalida estado, reserva y perfiles', async () => {
    installFakeApi({
      [POST]: () => ({ status: 201, body: fakeRating({ score: 5 }) }),
      [STATUS]: () => ok(fakeRatingStatus({ canRate: false, myRating: fakeRating() })),
    });
    const { client, Wrapper } = wrapper();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = await renderHook(() => useCreateRating(BOOKING_ID), { wrapper: Wrapper });
    await act(async () => {
      await result.current.mutateAsync({ score: 5 });
    });
    expect(client.getQueryData<{ canRate: boolean }>(ratingsKeys.status(BOOKING_ID))?.canRate).toBe(
      false,
    );
    const keys = invalidate.mock.calls.map((call) => JSON.stringify(call[0]?.queryKey));
    expect(keys).toEqual(
      expect.arrayContaining([
        JSON.stringify(ratingsKeys.status(BOOKING_ID)),
        JSON.stringify(bookingsKeys.detail(BOOKING_ID)),
        JSON.stringify(ratingsKeys.all),
        JSON.stringify(['profile']),
      ]),
    );
  });

  it('un 409 vuelve a consultar el estado de la calificación que se está mostrando', async () => {
    const api = installFakeApi({
      [POST]: () => failure(409, 'conflict'),
      [STATUS]: () => ok(fakeRatingStatus({ canRate: false })),
    });
    const { Wrapper } = wrapper();
    // Estado y mutación a la vez: la tarjeta de la reserva observa el estado mientras califica.
    const { result } = await renderHook(
      () => ({ status: useRatingStatus(BOOKING_ID, true), create: useCreateRating(BOOKING_ID) }),
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(result.current.status.data?.canRate).toBe(false));
    const statusCalls = () => api.calls.filter((c) => c.path.endsWith('rating-status')).length;
    expect(statusCalls()).toBe(1);
    await act(async () => {
      await result.current.create.mutateAsync({ score: 5 }).catch(() => undefined);
    });
    await waitFor(() => expect(statusCalls()).toBe(2));
  });
});
