import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { useUnreadBadge } from '@/features/chat/useUnreadBadge';
import { failure, installFakeApi, ok } from '@/test/fakeApi';

jest.mock('expo-router', () => ({ useIsFocused: () => true }));
jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useUnreadBadge', () => {
  it('devuelve mis no leídos y 0 mientras no hay dato', async () => {
    // La respuesta se libera a mano: así «sin dato» no depende de la velocidad de la máquina.
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    installFakeApi({
      'GET /conversations/unread-count': async () => {
        await gate;
        return ok({ count: 3 });
      },
    });
    const { result } = await renderHook(() => useUnreadBadge(), { wrapper: wrapper() });
    expect(result.current).toBe(0);
    await act(async () => {
      release();
    });
    await waitFor(() => expect(result.current).toBe(3));
  });

  it('con error no hay insignia', async () => {
    installFakeApi({ 'GET /conversations/unread-count': () => failure(500, 'internal_error') });
    const { result } = await renderHook(() => useUnreadBadge(), { wrapper: wrapper() });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current).toBe(0);
  });

  it('se renueva cada 20 s con la app en primer plano', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
    let count = 1;
    const api = installFakeApi({ 'GET /conversations/unread-count': () => ok({ count }) });
    const { result } = await renderHook(() => useUnreadBadge(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current).toBe(1));
    count = 4;
    await act(async () => {
      await jest.advanceTimersByTimeAsync(20_000);
    });
    await waitFor(() => expect(result.current).toBe(4));
    expect(api.calls.length).toBeGreaterThanOrEqual(2);
  });
});
