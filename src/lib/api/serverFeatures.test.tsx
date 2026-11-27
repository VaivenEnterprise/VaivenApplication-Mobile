import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { useAiSuggestionsEnabled } from '@/features/ai-suggestions/useListingSuggestion';
import { useRecommendationsEnabled } from '@/features/recommendations/hooks';
import {
  fetchServerFeatures,
  serverFeaturesKeys,
  serverFeaturesQuery,
  SERVER_FEATURES_STALE_MS,
} from '@/lib/api/serverFeatures';
import { failure, installFakeApi, ok } from '@/test/fakeApi';

// Spec 021-T014 (RF-13, B-6): `/meta` se pide una sola vez y la IA y las recomendaciones comparten
// la caché.

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
let mockSession: { status: 'signedIn' | 'signedOut' };
jest.mock('@/features/auth/useSession', () => ({ useSession: () => mockSession }));

beforeEach(() => {
  mockSession = { status: 'signedIn' };
});
afterEach(() => jest.restoreAllMocks());

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}
const newClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });
const metaCalls = (calls: { method: string; path: string }[]) =>
  calls.filter((c) => c.method === 'GET' && c.path === '/meta');

describe('fetchServerFeatures', () => {
  it('lee cada interruptor; solo `true` lo enciende', async () => {
    installFakeApi({
      'GET /meta': () => ok({ name: 'vaiven', features: { aiSuggestions: true } }),
    });
    await expect(fetchServerFeatures()).resolves.toEqual({
      aiSuggestions: true,
      recommendations: false,
    });
  });

  it('sin `features` todo queda apagado', async () => {
    installFakeApi({ 'GET /meta': () => ok({ name: 'vaiven', version: '1.0.0' }) });
    await expect(fetchServerFeatures()).resolves.toEqual({
      aiSuggestions: false,
      recommendations: false,
    });
  });

  it('una respuesta que no cumple el esquema es un error (no enciende nada)', async () => {
    installFakeApi({ 'GET /meta': () => ok({ features: { aiSuggestions: 'sí' } }) });
    await expect(fetchServerFeatures()).rejects.toMatchObject({ code: 'invalid_response' });
  });

  it('usa una clave compartida y caché de 5 minutos', () => {
    expect(serverFeaturesQuery.queryKey).toEqual(serverFeaturesKeys.all);
    expect(serverFeaturesQuery.staleTime).toBe(SERVER_FEATURES_STALE_MS);
    expect(SERVER_FEATURES_STALE_MS).toBe(5 * 60 * 1000);
  });
});

describe('una sola consulta a /meta para la IA y las recomendaciones (B-6)', () => {
  it('montar ambos interruptores a la vez pide /meta una vez y ambos leen su valor', async () => {
    const api = installFakeApi({
      'GET /meta': () => ok({ features: { aiSuggestions: true, recommendations: false } }),
    });
    const client = newClient();
    const { result } = await renderHook(
      () => ({ ai: useAiSuggestionsEnabled(), reco: useRecommendationsEnabled() }),
      { wrapper: wrapperFor(client) },
    );
    await waitFor(() => expect(result.current.ai).toBe(true));
    expect(result.current.reco).toBe(false);
    expect(metaCalls(api.calls)).toHaveLength(1);
  });

  it('el segundo en montarse reutiliza la caché sin volver a pedir /meta', async () => {
    const api = installFakeApi({
      'GET /meta': () => ok({ features: { aiSuggestions: false, recommendations: true } }),
    });
    const client = newClient();
    const first = await renderHook(() => useRecommendationsEnabled(), {
      wrapper: wrapperFor(client),
    });
    await waitFor(() => expect(first.result.current).toBe(true));
    const second = await renderHook(() => useAiSuggestionsEnabled(), {
      wrapper: wrapperFor(client),
    });
    expect(second.result.current).toBe(false);
    expect(metaCalls(api.calls)).toHaveLength(1);
  });

  it('sin sesión no se pide /meta y ambos quedan apagados', async () => {
    mockSession = { status: 'signedOut' };
    const api = installFakeApi({ 'GET /meta': () => ok({ features: { aiSuggestions: true } }) });
    const { result } = await renderHook(
      () => ({ ai: useAiSuggestionsEnabled(), reco: useRecommendationsEnabled() }),
      { wrapper: wrapperFor(newClient()) },
    );
    expect(result.current).toEqual({ ai: false, reco: false });
    expect(metaCalls(api.calls)).toHaveLength(0);
  });

  it('si /meta falla, ambos quedan apagados con una sola petición', async () => {
    const api = installFakeApi({ 'GET /meta': () => failure(500, 'internal_error') });
    const client = newClient();
    const { result } = await renderHook(
      () => ({ ai: useAiSuggestionsEnabled(), reco: useRecommendationsEnabled() }),
      { wrapper: wrapperFor(client) },
    );
    await waitFor(() => expect(client.getQueryState(serverFeaturesKeys.all)?.status).toBe('error'));
    expect(result.current).toEqual({ ai: false, reco: false });
    expect(metaCalls(api.calls)).toHaveLength(1);
  });
});
