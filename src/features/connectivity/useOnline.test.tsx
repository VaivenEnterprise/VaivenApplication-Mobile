import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';
import type { ReactNode } from 'react';
import {
  PROBE_BACKOFF_MS,
  RECOVERED_VISIBLE_MS,
  useOnline,
} from '@/features/connectivity/useOnline';
import { getHealth } from '@/features/diagnostics/api/getHealth';
import { ApiError } from '@/lib/api/errors';

jest.mock('@/features/diagnostics/api/getHealth', () => ({ getHealth: jest.fn() }));

const health = jest.mocked(getHealth);
const networkError = () => new ApiError('network_error', 'x', null, null);

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

/** Provoca una consulta que falla con un error del cliente de API. */
async function failQuery(client: QueryClient, error: ApiError) {
  await act(async () => {
    await client
      .fetchQuery({
        queryKey: ['t', Math.random()],
        queryFn: () => Promise.reject(error),
        retry: false,
      })
      .catch(() => undefined);
  });
}

const tick = (ms: number) =>
  act(async () => {
    jest.advanceTimersByTime(ms);
  });

beforeEach(() => {
  jest.useFakeTimers();
  health.mockReset();
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('useOnline', () => {
  it('empieza en línea', async () => {
    const { wrapper } = setup();
    const { result } = await renderHook(() => useOnline(), { wrapper });
    expect(result.current).toBe('online');
  });

  it('CA-02: una falla de red marca «sin conexión», sondea con backoff y se recupera sin reiniciar', async () => {
    const { client, wrapper } = setup();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    health.mockRejectedValueOnce(networkError()).mockRejectedValueOnce(networkError());
    health.mockResolvedValue({ status: 'ok' });
    const { result } = await renderHook(() => useOnline(), { wrapper });

    await failQuery(client, networkError());
    expect(result.current).toBe('offline');
    expect(health).not.toHaveBeenCalled();

    await tick(PROBE_BACKOFF_MS[0]);
    expect(health).toHaveBeenCalledTimes(1);
    expect(result.current).toBe('offline');

    // Segundo intento tras 4 s; todavía sin red.
    await tick(PROBE_BACKOFF_MS[1] - 1);
    expect(health).toHaveBeenCalledTimes(1);
    await tick(1);
    expect(health).toHaveBeenCalledTimes(2);
    expect(result.current).toBe('offline');

    // Tercer intento tras 8 s: responde.
    await tick(PROBE_BACKOFF_MS[2]);
    expect(health).toHaveBeenCalledTimes(3);
    expect(result.current).toBe('recovered');
    expect(invalidate).toHaveBeenCalled();

    await tick(RECOVERED_VISIBLE_MS);
    expect(result.current).toBe('online');
  });

  it('un error del servidor no es una falla de red', async () => {
    const { client, wrapper } = setup();
    const { result } = await renderHook(() => useOnline(), { wrapper });
    await failQuery(client, new ApiError('internal_error', 'x', 500, null));
    await failQuery(client, new ApiError('timeout', 'x', null, null));
    expect(result.current).toBe('online');
  });

  it('también cuenta la falla de red de una mutación', async () => {
    const { client, wrapper } = setup();
    const { result } = await renderHook(() => useOnline(), { wrapper });
    await act(async () => {
      await client
        .getMutationCache()
        .build(client, { mutationFn: () => Promise.reject(networkError()) })
        .execute(undefined)
        .catch(() => undefined);
    });
    expect(result.current).toBe('offline');
  });

  it('una respuesta de error del servidor al sondear significa que hay red', async () => {
    const { client, wrapper } = setup();
    health.mockRejectedValue(new ApiError('service_unavailable', 'x', 503, null));
    const { result } = await renderHook(() => useOnline(), { wrapper });
    await failQuery(client, networkError());
    await tick(PROBE_BACKOFF_MS[0]);
    expect(result.current).toBe('recovered');
  });

  it('el backoff se detiene en 30 s', async () => {
    const { client, wrapper } = setup();
    health.mockRejectedValue(networkError());
    await renderHook(() => useOnline(), { wrapper });
    await failQuery(client, networkError());
    for (const wait of PROBE_BACKOFF_MS) await tick(wait);
    expect(health).toHaveBeenCalledTimes(PROBE_BACKOFF_MS.length);
    await tick(30_000);
    expect(health).toHaveBeenCalledTimes(PROBE_BACKOFF_MS.length + 1);
  });

  it('al volver a primer plano sin conexión sondea de inmediato', async () => {
    let onChange: ((state: AppStateStatus) => void) | undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((_: string, handler: never) => {
      onChange = handler;
      return { remove: jest.fn() };
    }) as never);
    health.mockResolvedValue({ status: 'ok' });
    const { client, wrapper } = setup();
    const { result } = await renderHook(() => useOnline(), { wrapper });
    await failQuery(client, networkError());
    await act(async () => onChange?.('active'));
    expect(health).toHaveBeenCalledTimes(1);
    expect(result.current).toBe('recovered');
  });

  it('en línea, volver a primer plano no sondea', async () => {
    let onChange: ((state: AppStateStatus) => void) | undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((_: string, handler: never) => {
      onChange = handler;
      return { remove: jest.fn() };
    }) as never);
    const { wrapper } = setup();
    await renderHook(() => useOnline(), { wrapper });
    await act(async () => onChange?.('active'));
    expect(health).not.toHaveBeenCalled();
  });

  it('al desmontar se cancelan los sondeos', async () => {
    const { client, wrapper } = setup();
    health.mockRejectedValue(networkError());
    const view = await renderHook(() => useOnline(), { wrapper });
    await failQuery(client, networkError());
    await view.unmount();
    await tick(PROBE_BACKOFF_MS[0] * 3);
    expect(health).not.toHaveBeenCalled();
  });
});
