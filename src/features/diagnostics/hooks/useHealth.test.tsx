import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { useHealth, useReadiness } from '@/features/diagnostics/hooks/useHealth';
import { healthKeys, readinessKeys } from '@/features/diagnostics/keys';

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));

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

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useHealth', () => {
  it('usa claves de consulta constantes', () => {
    expect(healthKeys.all).toEqual(['health']);
    expect(readinessKeys.all).toEqual(['readiness']);
  });

  it('consulta /healthz fuera del prefijo /api/v1', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(response(200, { status: 'ok' }));
    const { result } = await renderHook(() => useHealth(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ status: 'ok' });
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://api.test/healthz');
  });

  it('maneja el error de red', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Network request failed'));
    const { result } = await renderHook(() => useHealth(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.code).toBe('network_error');
  });
});

describe('useReadiness', () => {
  it('está listo cuando /readyz responde ready', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(response(200, { status: 'ready' }));
    const { result } = await renderHook(() => useReadiness(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ ready: true, redis: null });
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://api.test/readyz');
  });

  it('conserva el estado de Redis cuando viene degradado', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(response(200, { status: 'ready', redis: 'degradado' }));
    const { result } = await renderHook(() => useReadiness(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ ready: true, redis: 'degradado' });
  });

  it('un estado distinto de ready no está listo', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(response(200, { status: 'starting' }));
    const { result } = await renderHook(() => useReadiness(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ ready: false, redis: null });
  });

  it('un 503 service_unavailable es «no listo», no un error', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      response(503, {
        error: { code: 'service_unavailable', message: 'MongoDB no responde', requestId: 'r1' },
      }),
    );
    const { result } = await renderHook(() => useReadiness(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ ready: false, redis: null });
  });

  it('propaga los demás errores', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Network request failed'));
    const { result } = await renderHook(() => useReadiness(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.code).toBe('network_error');
  });
});
