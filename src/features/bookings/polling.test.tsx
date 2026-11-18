import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { BOOKING_POLL_MS, useBooking, useMyBookings } from '@/features/bookings/hooks';
import { installFakeApi, ok } from '@/test/fakeApi';
import { BOOKING_ID, fakeBooking } from '@/test/fakeBookings';

let mockFocused = true;
jest.mock('expo-router', () => ({ useIsFocused: () => mockFocused }));
jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));

beforeEach(() => {
  jest.useFakeTimers();
  mockFocused = true;
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return Wrapper;
}

const advance = (ms: number) =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });

describe('actualización automática de reservas (012-T007)', () => {
  it('el detalle se vuelve a pedir cada intervalo y refleja el cambio de la otra parte', async () => {
    let status: 'pending' | 'accepted' = 'pending';
    const api = installFakeApi({
      [`GET /bookings/${BOOKING_ID}`]: () => ok(fakeBooking({ status })),
    });
    const { result } = await renderHook(() => useBooking(BOOKING_ID), {
      wrapper: createWrapper(),
    });
    await advance(0);
    expect(result.current.data?.status).toBe('pending');
    const first = api.calls.length;
    status = 'accepted';
    await advance(BOOKING_POLL_MS);
    await advance(0);
    expect(api.calls.length).toBe(first + 1);
    await waitFor(() => expect(result.current.data?.status).toBe('accepted'));
  });

  it('la lista también se actualiza, y deja de consultar con la pantalla sin foco', async () => {
    const api = installFakeApi({
      'GET /me/bookings': () => ok({ items: [fakeBooking()], nextCursor: null }),
    });
    const { rerender } = await renderHook(() => useMyBookings('owner'), {
      wrapper: createWrapper(),
    });
    await advance(0);
    const first = api.calls.length;
    await advance(BOOKING_POLL_MS);
    expect(api.calls.length).toBe(first + 1);
    mockFocused = false;
    await rerender({});
    const before = api.calls.length;
    await advance(BOOKING_POLL_MS * 2);
    expect(api.calls.length).toBe(before);
  });
});
