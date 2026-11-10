import * as SecureStore from 'expo-secure-store';
import type { User } from '@/features/auth/schemas';

// Ayudas solo para pruebas: una API falsa sobre `fetch` y un almacén seguro en memoria.
// Las pruebas deben declarar `jest.mock('expo-secure-store', …)` con tres `jest.fn()`.

export const fakeUser: User = {
  id: '6730f1c2a9b3e4d5f6a7b8c9',
  email: 'ana@example.com',
  displayName: 'Ana López',
  phone: null,
  role: 'user',
  ratingAverage: null,
  ratingCount: 0,
  createdAt: '2026-11-06T18:00:00Z',
};

export const fakeTokens = (n: number) => ({
  accessToken: `access-${n}`,
  refreshToken: `refresh-${n}`,
  expiresIn: 900,
});

export type FakeRequest = {
  method: string;
  path: string;
  query: string;
  body: unknown;
  authorization: string | undefined;
};
export type FakeReply = { status: number; body?: unknown };
export type FakeHandler = (request: FakeRequest) => FakeReply | Promise<FakeReply>;

export const ok = (body: unknown): FakeReply => ({ status: 200, body });
export const failure = (status: number, code: string, details: unknown[] = []): FakeReply => ({
  status,
  body: { error: { code, message: 'x', requestId: 'req-1', details } },
});

const API_PREFIX = 'http://api.test/api/v1';

/** Instala un `fetch` falso. Las claves de `handlers` son «MÉTODO /ruta» (sin query). */
export function installFakeApi(handlers: Record<string, FakeHandler>): { calls: FakeRequest[] } {
  const calls: FakeRequest[] = [];
  jest.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input).replace(API_PREFIX, '');
    const [path = '', query = ''] = url.split('?');
    const method = init?.method ?? 'GET';
    const headers = (init?.headers ?? {}) as Record<string, string>;
    const raw = init?.body;
    const request: FakeRequest = {
      method,
      path,
      query,
      body: typeof raw === 'string' ? (JSON.parse(raw) as unknown) : undefined,
      authorization: headers.Authorization,
    };
    calls.push(request);
    const handler = handlers[`${method} ${path}`];
    const reply = handler ? await handler(request) : failure(404, 'not_found');
    return {
      ok: reply.status >= 200 && reply.status < 300,
      status: reply.status,
      json: async () => {
        if (reply.body === undefined) throw new Error('sin cuerpo');
        return reply.body;
      },
    } as unknown as Response;
  });
  return { calls };
}

/** Conecta las tres funciones simuladas de `expo-secure-store` a un `Map` en memoria. */
export function installMemorySecureStore(
  initial: Record<string, string> = {},
): Map<string, string> {
  const saved = new Map(Object.entries(initial));
  const store = jest.mocked(SecureStore);
  store.getItemAsync.mockImplementation(async (key) => saved.get(key) ?? null);
  store.setItemAsync.mockImplementation(async (key, value) => {
    saved.set(key, value);
  });
  store.deleteItemAsync.mockImplementation(async (key) => {
    saved.delete(key);
  });
  return saved;
}
