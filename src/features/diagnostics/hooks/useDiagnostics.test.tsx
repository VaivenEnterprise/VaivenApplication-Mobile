import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { useDiagnostics } from '@/features/diagnostics/hooks/useDiagnostics';

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));

const META = {
  name: 'vaiven-backend',
  version: 'dev',
  environment: 'development',
  serverTime: '2026-11-10T16:38:01Z',
};

const response = (status: number, body: unknown): Response =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

const bodyFor = (url: string): Response => {
  if (url.endsWith('/api/v1/meta')) return response(200, META);
  if (url.endsWith('/healthz')) return response(200, { status: 'ok' });
  return response(200, { status: 'ready', redis: 'degradado' });
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useDiagnostics', () => {
  it('reúne meta, healthz y readyz', async () => {
    jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => bodyFor(String(input)));
    const { result } = await renderHook(() => useDiagnostics(), { wrapper: createWrapper() });

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(result.current.meta).toEqual(META);
    expect(result.current.health).toEqual({ status: 'ok' });
    expect(result.current.readiness).toEqual({ ready: true, redis: 'degradado' });
    expect(result.current.error).toBeNull();
  });

  it('expone el primer error si el backend no responde', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Network request failed'));
    const { result } = await renderHook(() => useDiagnostics(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(result.current.error?.code).toBe('network_error');
    expect(result.current.meta).toBeUndefined();
  });

  it('refetch vuelve a consultar las tres rutas', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input) => bodyFor(String(input)));
    const { result } = await renderHook(() => useDiagnostics(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(fetchMock).toHaveBeenCalledTimes(3);

    await result.current.refetch();

    expect(fetchMock).toHaveBeenCalledTimes(6);
  });
});
