import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { useDebouncedValue, useSearchItems } from '@/features/search/hooks';
import { failure, installFakeApi, ok } from '@/test/fakeApi';

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));

const card = (id: string, title = `Objeto ${id}`) => ({
  id,
  title,
  modality: 'rent',
  pricePerDayCents: 3000,
  thumbUrl: null,
  distanceKm: null,
  owner: { ratingAverage: 4.9 },
});

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('useDebouncedValue', () => {
  it('espera 400 ms sin cambios antes de publicar el valor', async () => {
    jest.useFakeTimers();
    const { result, rerender } = await renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value),
      {
        initialProps: { value: 'ta' },
      },
    );
    expect(result.current).toBe('ta');

    await rerender({ value: 'tal' });
    await rerender({ value: 'talad' });
    await act(async () => {
      jest.advanceTimersByTime(399);
    });
    expect(result.current).toBe('ta');

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('talad');
  });

  it('reinicia la espera con cada cambio', async () => {
    jest.useFakeTimers();
    const { result, rerender } = await renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 100),
      {
        initialProps: { value: 'a' },
      },
    );
    await rerender({ value: 'b' });
    await act(async () => {
      jest.advanceTimersByTime(90);
    });
    await rerender({ value: 'c' });
    await act(async () => {
      jest.advanceTimersByTime(90);
    });
    expect(result.current).toBe('a');
    await act(async () => {
      jest.advanceTimersByTime(10);
    });
    expect(result.current).toBe('c');
  });
});

describe('useSearchItems', () => {
  it('pide la primera página con la consulta y aplana los resultados', async () => {
    const { calls } = installFakeApi({
      'GET /items': () => ok({ items: [card('a'), card('b')], nextCursor: null }),
    });
    const { result } = await renderHook(() => useSearchItems('limit=20&q=taladro'), {
      wrapper: wrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages[0]?.items.map((item) => item.id)).toEqual(['a', 'b']);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.query).toBe('limit=20&q=taladro');
    expect(result.current.hasNextPage).toBe(false);
  });

  it('pagina con el cursor y detiene cuando no hay más', async () => {
    const { calls } = installFakeApi({
      'GET /items': ({ query }) =>
        query.includes('cursor=c1')
          ? ok({ items: [card('c')], nextCursor: null })
          : ok({ items: [card('a'), card('b')], nextCursor: 'c1' }),
    });
    const { result } = await renderHook(() => useSearchItems('limit=20'), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.hasNextPage).toBe(true));

    await act(async () => {
      await result.current.fetchNextPage();
    });
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    expect(calls[1]?.query).toBe('limit=20&cursor=c1');
    expect(result.current.hasNextPage).toBe(false);
  });

  it('cancela la petición anterior al cambiar la consulta (RF-08)', async () => {
    const signals: AbortSignal[] = [];
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
      const url = String(input);
      const signal = init?.signal as AbortSignal;
      signals.push(signal);
      if (url.includes('q=ta&') || url.endsWith('q=ta')) {
        return new Promise((_, reject) =>
          signal.addEventListener('abort', () =>
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
          ),
        );
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ items: [card('z', 'Taladro')], nextCursor: null }),
      } as unknown as Response);
    });

    const { result, rerender } = await renderHook(
      ({ query }: { query: string }) => useSearchItems(query),
      {
        wrapper: wrapper(),
        initialProps: { query: 'limit=20&q=ta' },
      },
    );
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    await rerender({ query: 'limit=20&q=taladro' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
    expect(result.current.data?.pages[0]?.items[0]?.id).toBe('z');
  });

  it('no consulta mientras esté deshabilitado (p. ej. falta la ubicación)', async () => {
    const { calls } = installFakeApi({ 'GET /items': () => ok({ items: [], nextCursor: null }) });
    const { result } = await renderHook(() => useSearchItems('limit=20', { enabled: false }), {
      wrapper: wrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(calls).toHaveLength(0);
  });

  it('expone el error del cliente de API y permite reintentar', async () => {
    let fail = true;
    installFakeApi({
      'GET /items': () =>
        fail ? failure(500, 'internal_error') : ok({ items: [card('a')], nextCursor: null }),
    });
    const { result } = await renderHook(() => useSearchItems('limit=20'), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ code: 'internal_error' });

    fail = false;
    await act(async () => {
      await result.current.refetch();
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('rechaza una respuesta que no cumple el contrato', async () => {
    installFakeApi({ 'GET /items': () => ok({ items: [{ id: 1 }], nextCursor: null }) });
    const { result } = await renderHook(() => useSearchItems('limit=20'), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ code: 'invalid_response' });
  });
});
