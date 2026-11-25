import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createElement, type ReactNode } from 'react';
import {
  useClearHistory,
  useRecommendations,
  useRecommendationsEnabled,
  useTrackView,
} from '@/features/recommendations/hooks';
import { createQueryClient } from '@/lib/query/queryClient';
import { failure, installFakeApi, ok, type FakeReply } from '@/test/fakeApi';

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
let mockSession: { status: 'signedIn' | 'signedOut'; user: { id: string } | null };
jest.mock('@/features/auth/useSession', () => ({ useSession: () => mockSession }));

const ME = '6730f0aa9b3e4d5f6a7b8c01';
const OWNER = '6730f0aa9b3e4d5f6a7b8c90';
const NO_CONTENT: FakeReply = { status: 204 };
const ON = { features: { recommendations: true } };

const RECOMMENDED = {
  items: [
    {
      item: {
        id: '6730f1c2a9b3e4d5f6a7b8c9',
        title: 'Taladro percutor 600 W',
        category: 'herramientas_electricas',
        modality: 'rent',
        pricePerDayCents: 8000,
        thumbUrl: 'https://img.test/a.jpg',
        owner: { id: OWNER, displayName: 'Ana', ratingAverage: 4.8, ratingCount: 12 },
      },
      reason: { code: 'similar_to', itemId: '6731a2', itemTitle: 'Sierra circular 1 200 W' },
    },
    {
      item: {
        id: '6732b3c4d5e6f7a8b9c0d1e2',
        title: 'Escalera de aluminio',
        modality: 'loan',
        pricePerDayCents: 0,
        thumbUrl: null,
      },
      reason: { code: 'popular_nearby' },
    },
  ],
  nextCursor: null,
};

beforeEach(() => {
  mockSession = { status: 'signedIn', user: { id: ME } };
});
afterEach(() => jest.restoreAllMocks());

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  return { client, wrapper };
}

describe('useRecommendationsEnabled', () => {
  it('es verdadero solo con features.recommendations = true', async () => {
    installFakeApi({ 'GET /meta': () => ok(ON) });
    const { wrapper } = setup();
    const { result } = await renderHook(() => useRecommendationsEnabled(), { wrapper });
    await waitFor(() => expect(result.current).toBe(true));
  });

  it.each([
    ['apagada', { features: { recommendations: false } }],
    ['sin la sección features', { name: 'x' }],
    ['sin la clave recommendations', { features: { aiSuggestions: true } }],
  ])('es falso con la función %s', async (_name, body) => {
    const api = installFakeApi({ 'GET /meta': () => ok(body) });
    const { wrapper } = setup();
    const { result } = await renderHook(() => useRecommendationsEnabled(), { wrapper });
    await waitFor(() => expect(api.calls).toHaveLength(1));
    expect(result.current).toBe(false);
  });

  it('es falso si /meta falla', async () => {
    const api = installFakeApi({ 'GET /meta': () => failure(500, 'internal_error') });
    const { wrapper } = setup();
    const { result } = await renderHook(() => useRecommendationsEnabled(), { wrapper });
    await waitFor(() => expect(api.calls).toHaveLength(1));
    expect(result.current).toBe(false);
  });

  it('no consulta sin sesión', async () => {
    mockSession = { status: 'signedOut', user: null };
    const api = installFakeApi({ 'GET /meta': () => ok(ON) });
    const { wrapper } = setup();
    const { result } = await renderHook(() => useRecommendationsEnabled(), { wrapper });
    expect(api.calls).toHaveLength(0);
    expect(result.current).toBe(false);
  });
});

describe('useRecommendations', () => {
  it('carga y luego entrega las recomendaciones con su motivo (CA-01)', async () => {
    const api = installFakeApi({
      'GET /meta': () => ok(ON),
      'GET /recommendations': () => ok(RECOMMENDED),
    });
    const { wrapper } = setup();
    const { result } = await renderHook(() => useRecommendations(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.items.map((entry) => entry.item.title)).toEqual([
      'Taladro percutor 600 W',
      'Escalera de aluminio',
    ]);
    expect(result.current.items[0]?.reason).toEqual({
      code: 'similar_to',
      itemId: '6731a2',
      itemTitle: 'Sierra circular 1 200 W',
    });
    expect(api.calls.find((call) => call.path === '/recommendations')?.query).toBe('limit=10');
  });

  it('con la función apagada no pide la lista y queda oculta (CA-04)', async () => {
    const api = installFakeApi({
      'GET /meta': () => ok({ features: { recommendations: false } }),
      'GET /recommendations': () => ok(RECOMMENDED),
    });
    const { wrapper } = setup();
    const { result } = await renderHook(() => useRecommendations(), { wrapper });
    await waitFor(() => expect(api.calls).toHaveLength(1));
    expect(result.current.status).toBe('hidden');
    expect(api.calls.some((call) => call.path === '/recommendations')).toBe(false);
  });

  it('sin resultados queda oculta (RF-02)', async () => {
    installFakeApi({
      'GET /meta': () => ok(ON),
      'GET /recommendations': () => ok({ items: [], nextCursor: null }),
    });
    const { wrapper } = setup();
    const { result } = await renderHook(() => useRecommendations(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('hidden'));
    await waitFor(() => expect(result.current.items).toEqual([]));
  });

  it.each([
    ['500', failure(500, 'internal_error')],
    ['503', failure(503, 'service_unavailable')],
    ['una respuesta que no cumple el contrato', ok({ nope: true })],
  ])('con %s queda oculta y sin lanzar (CA-04)', async (_name, reply) => {
    const api = installFakeApi({
      'GET /meta': () => ok(ON),
      'GET /recommendations': () => reply,
    });
    const { wrapper } = setup();
    const { result } = await renderHook(() => useRecommendations(), { wrapper });
    await waitFor(() =>
      expect(api.calls.some((call) => call.path === '/recommendations')).toBe(true),
    );
    await waitFor(() => expect(result.current.status).toBe('hidden'));
  });

  it('un motivo nuevo del servidor se trata como «popular» y no rompe la lista', async () => {
    installFakeApi({
      'GET /meta': () => ok(ON),
      'GET /recommendations': () =>
        ok({
          items: [{ ...RECOMMENDED.items[1], reason: { code: 'algo_nuevo' } }],
          nextCursor: null,
        }),
    });
    const { wrapper } = setup();
    const { result } = await renderHook(() => useRecommendations(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.items[0]?.reason.code).toBe('popular');
  });

  it('reintenta una vez un 5xx y luego muestra la lista; un 4xx no se reintenta (§6.3)', async () => {
    let attempts = 0;
    const api = installFakeApi({
      'GET /meta': () => ok(ON),
      'GET /recommendations': () => {
        attempts += 1;
        return attempts === 1 ? failure(503, 'service_unavailable') : ok(RECOMMENDED);
      },
    });
    // El cliente real de la app (con su criterio de reintentos) y sin espera entre intentos.
    const client = createQueryClient();
    client.setDefaultOptions({
      queries: { ...client.getDefaultOptions().queries, retryDelay: 0 },
    });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children);
    const { result } = await renderHook(() => useRecommendations(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(api.calls.filter((call) => call.path === '/recommendations')).toHaveLength(2);

    const rejected = installFakeApi({
      'GET /meta': () => ok(ON),
      'GET /recommendations': () => failure(403, 'forbidden'),
    });
    const fresh = createQueryClient();
    fresh.setDefaultOptions({ queries: { ...fresh.getDefaultOptions().queries, retryDelay: 0 } });
    const freshWrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: fresh }, children);
    const second = await renderHook(() => useRecommendations(), { wrapper: freshWrapper });
    await waitFor(() =>
      expect(rejected.calls.some((call) => call.path === '/recommendations')).toBe(true),
    );
    await waitFor(() => expect(second.result.current.status).toBe('hidden'));
    expect(rejected.calls.filter((call) => call.path === '/recommendations')).toHaveLength(1);
  });

  it('reutiliza el caché de 5 minutos: un segundo uso no vuelve a pedir la lista', async () => {
    const api = installFakeApi({
      'GET /meta': () => ok(ON),
      'GET /recommendations': () => ok(RECOMMENDED),
    });
    const { wrapper } = setup();
    const first = await renderHook(() => useRecommendations(), { wrapper });
    await waitFor(() => expect(first.result.current.status).toBe('ready'));
    const second = await renderHook(() => useRecommendations(), { wrapper });
    await waitFor(() => expect(second.result.current.status).toBe('ready'));
    expect(api.calls.filter((call) => call.path === '/recommendations')).toHaveLength(1);
    expect(api.calls.filter((call) => call.path === '/meta')).toHaveLength(1);
  });
});

describe('useTrackView', () => {
  const item = { id: '6730f1c2a9b3e4d5f6a7b8c9', ownerId: OWNER };
  const events = (api: { calls: { path: string }[] }) =>
    api.calls.filter((call) => call.path === '/recommendations/events');

  it('envía un solo evento view al abrir un objeto ajeno (CA-02)', async () => {
    const api = installFakeApi({
      'GET /meta': () => ok(ON),
      'POST /recommendations/events': () => NO_CONTENT,
    });
    const { wrapper } = setup();
    const { rerender } = await renderHook(() => useTrackView(item), { wrapper });
    await waitFor(() => expect(events(api)).toHaveLength(1));
    expect(events(api)[0]).toMatchObject({
      method: 'POST',
      body: { itemId: item.id, type: 'view' },
    });
    await rerender(undefined);
    await rerender(undefined);
    expect(events(api)).toHaveLength(1);
  });

  it('no envía nada si el objeto es mío', async () => {
    const api = installFakeApi({
      'GET /meta': () => ok(ON),
      'POST /recommendations/events': () => NO_CONTENT,
    });
    const { wrapper } = setup();
    await renderHook(() => useTrackView({ id: item.id, ownerId: ME }), { wrapper });
    await waitFor(() => expect(api.calls.some((call) => call.path === '/meta')).toBe(true));
    await act(async () => {});
    expect(events(api)).toHaveLength(0);
  });

  it('no envía nada con la función apagada', async () => {
    const api = installFakeApi({
      'GET /meta': () => ok({ features: { recommendations: false } }),
      'POST /recommendations/events': () => NO_CONTENT,
    });
    const { wrapper } = setup();
    await renderHook(() => useTrackView(item), { wrapper });
    await waitFor(() => expect(api.calls.some((call) => call.path === '/meta')).toBe(true));
    await act(async () => {});
    expect(events(api)).toHaveLength(0);
  });

  it('un fallo del servidor no lanza ni se reintenta (RF-03)', async () => {
    const api = installFakeApi({
      'GET /meta': () => ok(ON),
      'POST /recommendations/events': () => failure(503, 'service_unavailable'),
    });
    const { wrapper } = setup();
    await renderHook(() => useTrackView(item), { wrapper });
    await waitFor(() => expect(events(api)).toHaveLength(1));
    await act(async () => {});
    expect(events(api)).toHaveLength(1);
  });

  it('otra apertura (otro objeto) envía su propio evento', async () => {
    const api = installFakeApi({
      'GET /meta': () => ok(ON),
      'POST /recommendations/events': () => NO_CONTENT,
    });
    const { wrapper } = setup();
    let current = item;
    const { rerender } = await renderHook(() => useTrackView(current), { wrapper });
    await waitFor(() => expect(events(api)).toHaveLength(1));
    current = { id: '6732b3c4d5e6f7a8b9c0d1e2', ownerId: OWNER };
    await rerender(undefined);
    await waitFor(() => expect(events(api)).toHaveLength(2));
  });
});

describe('useClearHistory', () => {
  it('borra el historial y vuelve a pedir la lista (CA-03)', async () => {
    let list = RECOMMENDED;
    const api = installFakeApi({
      'GET /meta': () => ok(ON),
      'GET /recommendations': () => ok(list),
      'DELETE /recommendations/history': () => {
        list = { items: [RECOMMENDED.items[1] as never], nextCursor: null };
        return NO_CONTENT;
      },
    });
    const { wrapper } = setup();
    const { result } = await renderHook(
      () => ({ clear: useClearHistory(), recs: useRecommendations() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.recs.items).toHaveLength(2));
    await act(async () => result.current.clear.mutate());
    await waitFor(() => expect(result.current.clear.isSuccess).toBe(true));
    await waitFor(() => expect(result.current.recs.items).toHaveLength(1));
    expect(api.calls.filter((call) => call.path === '/recommendations')).toHaveLength(2);
    expect(api.calls.some((call) => call.method === 'DELETE')).toBe(true);
  });

  it('si falla, informa el error y no toca la lista', async () => {
    const api = installFakeApi({
      'GET /meta': () => ok(ON),
      'GET /recommendations': () => ok(RECOMMENDED),
      'DELETE /recommendations/history': () => failure(500, 'internal_error'),
    });
    const { wrapper } = setup();
    const { result } = await renderHook(
      () => ({ clear: useClearHistory(), recs: useRecommendations() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.recs.status).toBe('ready'));
    await act(async () => result.current.clear.mutate());
    await waitFor(() => expect(result.current.clear.isError).toBe(true));
    expect(api.calls.filter((call) => call.path === '/recommendations')).toHaveLength(1);
    expect(result.current.recs.status).toBe('ready');
  });
});
