import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { metaKeys } from '@/features/diagnostics/keys';
import { useMeta } from '@/features/diagnostics/hooks/useMeta';
import { ApiError } from '@/lib/api/errors';

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));

const META = {
  name: 'vaiven-backend',
  version: '1.0.0',
  environment: 'development',
  serverTime: '2026-11-10T00:05:00Z',
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

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useMeta', () => {
  it('usa la clave de consulta constante ["meta"]', () => {
    expect(metaKeys.all).toEqual(['meta']);
  });

  it('devuelve name, version, environment y serverTime', async () => {
    // La respuesta se controla a mano para comprobar el estado «cargando» sin carreras.
    let respond: (value: Response) => void = () => undefined;
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockReturnValue(
      new Promise<Response>((resolve) => {
        respond = resolve;
      }),
    );
    const { result } = await renderHook(() => useMeta(), { wrapper: createWrapper() });

    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();

    respond(response(200, META));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(META);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://api.test/api/v1/meta');
  });

  it('maneja el error de red con un ApiError network_error', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Network request failed'));
    const { result } = await renderHook(() => useMeta(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error?.code).toBe('network_error');
    expect(result.current.data).toBeUndefined();
  });

  it('expone el error del servidor', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        response(500, { error: { code: 'internal_error', message: 'Falló', requestId: 'r1' } }),
      );
    const { result } = await renderHook(() => useMeta(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toMatchObject({ code: 'internal_error', status: 500 });
  });

  it('marca invalid_response si falta un campo de la respuesta', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(response(200, { name: 'vaiven-backend' }));
    const { result } = await renderHook(() => useMeta(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.code).toBe('invalid_response');
  });

  it('permite reintentar con refetch', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new TypeError('Network request failed'))
      .mockResolvedValueOnce(response(200, META));
    const { result } = await renderHook(() => useMeta(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    await result.current.refetch();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual(META);
  });
});
