import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import {
  useAiSuggestionsEnabled,
  useListingSuggestion,
} from '@/features/ai-suggestions/useListingSuggestion';
import { failure, installFakeApi, ok } from '@/test/fakeApi';

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
let mockSession: 'signedIn' | 'signedOut' = 'signedIn';
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({ status: mockSession }),
}));

const PHOTO = 'vaiven/production/item_photo/6730f1c2a9b3e4d5f6a7b8c9/9b2f';
const SUGGESTION = {
  title: 'Taladro inalámbrico 18 V con dos baterías',
  category: 'herramientas_electricas',
  description: 'Taladro con estuche.',
};

beforeEach(() => {
  mockSession = 'signedIn';
});
afterEach(() => jest.restoreAllMocks());

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return Wrapper;
}

describe('useAiSuggestionsEnabled', () => {
  it('es verdadero solo con features.aiSuggestions = true', async () => {
    installFakeApi({ 'GET /meta': () => ok({ name: 'x', features: { aiSuggestions: true } }) });
    const { result } = await renderHook(() => useAiSuggestionsEnabled(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current).toBe(true));
  });

  it.each([
    ['con la IA apagada', { features: { aiSuggestions: false } }],
    ['sin la sección features', { name: 'x' }],
    ['sin la clave aiSuggestions', { features: { recommendations: true } }],
  ])('es falso %s', async (_name, body) => {
    const api = installFakeApi({ 'GET /meta': () => ok(body) });
    const { result } = await renderHook(() => useAiSuggestionsEnabled(), { wrapper: wrapper() });
    await waitFor(() => expect(api.calls).toHaveLength(1));
    expect(result.current).toBe(false);
  });

  it('es falso si /meta falla y no rompe nada', async () => {
    const api = installFakeApi({ 'GET /meta': () => failure(500, 'internal_error') });
    const { result } = await renderHook(() => useAiSuggestionsEnabled(), { wrapper: wrapper() });
    await waitFor(() => expect(api.calls).toHaveLength(1));
    expect(result.current).toBe(false);
  });

  it('no consulta sin sesión', async () => {
    mockSession = 'signedOut';
    const api = installFakeApi({ 'GET /meta': () => ok({ features: { aiSuggestions: true } }) });
    const { result } = await renderHook(() => useAiSuggestionsEnabled(), { wrapper: wrapper() });
    expect(api.calls).toHaveLength(0);
    expect(result.current).toBe(false);
  });
});

describe('useListingSuggestion', () => {
  it('empieza en reposo y no llama a la red', async () => {
    const api = installFakeApi({});
    const { result } = await renderHook(() => useListingSuggestion(), { wrapper: wrapper() });
    expect(result.current.status).toBe('idle');
    expect(result.current.suggestion).toBeNull();
    expect(api.calls).toHaveLength(0);
  });

  it('envía solo el publicId y devuelve la sugerencia (CA-01)', async () => {
    const api = installFakeApi({ 'POST /ai/listing-suggestions': () => ok(SUGGESTION) });
    const { result } = await renderHook(() => useListingSuggestion(), { wrapper: wrapper() });
    await act(async () => result.current.suggest(PHOTO));
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.suggestion).toEqual(SUGGESTION);
    expect(api.calls).toHaveLength(1);
    expect(api.calls[0]?.body).toEqual({ imagePublicId: PHOTO });
  });

  it('pasa por «loading» mientras espera', async () => {
    let release: (() => void) | undefined;
    installFakeApi({
      'POST /ai/listing-suggestions': () =>
        new Promise((resolve) => {
          release = () => resolve(ok(SUGGESTION));
        }),
    });
    const { result } = await renderHook(() => useListingSuggestion(), { wrapper: wrapper() });
    await act(async () => result.current.suggest(PHOTO));
    await waitFor(() => expect(result.current.status).toBe('loading'));
    await act(async () => release?.());
    await waitFor(() => expect(result.current.status).toBe('success'));
  });

  it('acepta una sugerencia sin categoría', async () => {
    installFakeApi({ 'POST /ai/listing-suggestions': () => ok({ title: 'Escalera' }) });
    const { result } = await renderHook(() => useListingSuggestion(), { wrapper: wrapper() });
    await act(async () => result.current.suggest(PHOTO));
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.suggestion?.category).toBeUndefined();
  });

  it.each([
    ['503 service_unavailable (IA apagada o caída)', 503, 'service_unavailable'],
    ['500 internal_error', 500, 'internal_error'],
    ['404 not_found', 404, 'not_found'],
    ['400 validation_failed', 400, 'validation_failed'],
  ])('%s es un error recuperable (CA-03)', async (_name, status, code) => {
    installFakeApi({ 'POST /ai/listing-suggestions': () => failure(status, code) });
    const { result } = await renderHook(() => useListingSuggestion(), { wrapper: wrapper() });
    await act(async () => result.current.suggest(PHOTO));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.suggestion).toBeNull();
  });

  it('una respuesta que no cumple el esquema es un error', async () => {
    installFakeApi({ 'POST /ai/listing-suggestions': () => ok({ category: 'hogar' }) });
    const { result } = await renderHook(() => useListingSuggestion(), { wrapper: wrapper() });
    await act(async () => result.current.suggest(PHOTO));
    await waitFor(() => expect(result.current.status).toBe('error'));
  });

  it('429 es el límite diario (CA-04)', async () => {
    installFakeApi({ 'POST /ai/listing-suggestions': () => failure(429, 'rate_limited') });
    const { result } = await renderHook(() => useListingSuggestion(), { wrapper: wrapper() });
    await act(async () => result.current.suggest(PHOTO));
    await waitFor(() => expect(result.current.status).toBe('limit'));
  });

  it('no reintenta solo tras un error (cuesta cuota)', async () => {
    const api = installFakeApi({
      'POST /ai/listing-suggestions': () => failure(500, 'internal_error'),
    });
    const { result } = await renderHook(() => useListingSuggestion(), { wrapper: wrapper() });
    await act(async () => result.current.suggest(PHOTO));
    await waitFor(() => expect(result.current.status).toBe('error'));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(api.calls).toHaveLength(1);
  });

  it('reintentar a mano vuelve a llamar', async () => {
    let fail = true;
    const api = installFakeApi({
      'POST /ai/listing-suggestions': () =>
        fail ? failure(500, 'internal_error') : ok(SUGGESTION),
    });
    const { result } = await renderHook(() => useListingSuggestion(), { wrapper: wrapper() });
    await act(async () => result.current.suggest(PHOTO));
    await waitFor(() => expect(result.current.status).toBe('error'));
    fail = false;
    await act(async () => result.current.suggest(PHOTO));
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(api.calls).toHaveLength(2);
  });

  it('descartar vuelve al inicio', async () => {
    installFakeApi({ 'POST /ai/listing-suggestions': () => ok(SUGGESTION) });
    const { result } = await renderHook(() => useListingSuggestion(), { wrapper: wrapper() });
    await act(async () => result.current.suggest(PHOTO));
    await waitFor(() => expect(result.current.status).toBe('success'));
    await act(async () => result.current.reset());
    await waitFor(() => expect(result.current.status).toBe('idle'));
    expect(result.current.suggestion).toBeNull();
  });

  describe('cancelación', () => {
    /** `fetch` que no responde hasta que lo abortan; guarda la señal recibida. */
    function hangingFetch() {
      const seen: { signal?: AbortSignal | null } = {};
      jest.spyOn(globalThis, 'fetch').mockImplementation(
        (_input, init) =>
          new Promise((_resolve, reject) => {
            seen.signal = init?.signal;
            init?.signal?.addEventListener('abort', () => reject(new Error('abortado')));
          }),
      );
      return seen;
    }

    it('cancelar aborta la petición y no deja error', async () => {
      const seen = hangingFetch();
      const { result } = await renderHook(() => useListingSuggestion(), { wrapper: wrapper() });
      await act(async () => result.current.suggest(PHOTO));
      await waitFor(() => expect(result.current.status).toBe('loading'));
      await act(async () => result.current.cancel());
      expect(seen.signal?.aborted).toBe(true);
      await waitFor(() => expect(result.current.status).toBe('idle'));
      expect(result.current.suggestion).toBeNull();
    });

    it('al desmontar aborta lo que esté en curso', async () => {
      const seen = hangingFetch();
      const { result, unmount } = await renderHook(() => useListingSuggestion(), {
        wrapper: wrapper(),
      });
      await act(async () => result.current.suggest(PHOTO));
      await waitFor(() => expect(result.current.status).toBe('loading'));
      await unmount();
      expect(seen.signal?.aborted).toBe(true);
    });

    it('cancelar sin petición no falla', async () => {
      installFakeApi({});
      const { result } = await renderHook(() => useListingSuggestion(), { wrapper: wrapper() });
      await act(async () => result.current.cancel());
      expect(result.current.status).toBe('idle');
    });
  });
});
