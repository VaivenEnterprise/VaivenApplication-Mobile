import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import type { ReactNode } from 'react';
import { REFRESH_TOKEN_KEY, SessionProvider } from '@/features/auth/session';
import { useSession } from '@/features/auth/useSession';
import { getAccessToken, resetAuthInterceptor } from '@/lib/api/authInterceptor';
import { request } from '@/lib/api/client';
import { z } from 'zod';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('@/lib/config', () => {
  const actual = jest.requireActual<typeof import('@/lib/config')>('@/lib/config');
  return {
    ...actual,
    getConfig: jest.fn(() => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' })),
  };
});

const store = jest.mocked(SecureStore);

const user = {
  id: '6730f1c2a9b3e4d5f6a7b8c9',
  email: 'ana@example.com',
  displayName: 'Ana López',
  phone: null,
  role: 'user' as const,
  ratingAverage: null,
  ratingCount: 0,
  createdAt: '2026-11-06T18:00:00Z',
};
const tokens = (n: number) => ({
  accessToken: `access-${n}`,
  refreshToken: `refresh-${n}`,
  expiresIn: 900,
});

const reply = (status: number, body: unknown): Response =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;
const error = (status: number, code: string, details: unknown[] = []) =>
  reply(status, { error: { code, message: 'x', requestId: 'r1', details } });

type Route = (init: RequestInit) => Response | Promise<Response>;
type Routes = Partial<Record<string, Route>>;
let routes: Routes;
let calls: { path: string; init: RequestInit }[];

function route(path: string, handler: Route) {
  routes[path] = handler;
}

beforeEach(() => {
  resetAuthInterceptor();
  routes = {};
  calls = [];
  const saved = new Map<string, string>();
  store.getItemAsync.mockImplementation(async (key) => saved.get(key) ?? null);
  store.setItemAsync.mockImplementation(async (key, value) => {
    saved.set(key, value);
  });
  store.deleteItemAsync.mockImplementation(async (key) => {
    saved.delete(key);
  });
  jest.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const path = String(input).replace('http://api.test/api/v1', '');
    calls.push({ path, init: init ?? {} });
    const handler = routes[path];
    return handler ? handler(init ?? {}) : error(500, 'internal_error');
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

function setup(initialToken?: string) {
  if (initialToken !== undefined) void store.setItemAsync(REFRESH_TOKEN_KEY, initialToken);
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>{children}</SessionProvider>
    </QueryClientProvider>
  );
  return { queryClient, wrapper };
}

const callsTo = (path: string) => calls.filter((call) => call.path === path);

describe('restauración al arrancar (CA-02)', () => {
  it('sin token guardado queda sin sesión y no llama a la API', async () => {
    const { wrapper } = setup();
    const { result } = await renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));
    expect(calls).toHaveLength(0);
  });

  it('mientras renueva el estado es loading (pantalla de carga, sin parpadeo)', async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    route('/auth/refresh', async () => {
      await gate;
      return reply(200, { tokens: tokens(2) });
    });
    route('/me', () => reply(200, user));
    const { wrapper } = setup('refresh-1');
    const { result } = await renderHook(() => useSession(), { wrapper });
    expect(result.current.status).toBe('loading');
    release();
    await waitFor(() => expect(result.current.status).toBe('signedIn'));
  });

  it('con token válido renueva, rota el token guardado y carga al usuario', async () => {
    route('/auth/refresh', () => reply(200, { tokens: tokens(2) }));
    route('/me', () => reply(200, user));
    const { wrapper } = setup('refresh-1');
    const { result } = await renderHook(() => useSession(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('signedIn'));
    expect(result.current.user?.displayName).toBe('Ana López');
    expect(JSON.parse(callsTo('/auth/refresh')[0]?.init.body as string)).toEqual({
      refreshToken: 'refresh-1',
    });
    expect(await store.getItemAsync(REFRESH_TOKEN_KEY)).toBe('refresh-2');
    expect(getAccessToken()).toBe('access-2');
    expect(callsTo('/auth/refresh')).toHaveLength(1);
  });

  it('con token vencido (401) borra el token y queda sin sesión', async () => {
    route('/auth/refresh', () => error(401, 'unauthorized'));
    const { wrapper } = setup('refresh-viejo');
    const { result } = await renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));
    expect(await store.getItemAsync(REFRESH_TOKEN_KEY)).toBeNull();
    expect(getAccessToken()).toBeNull();
  });

  it('sin red conserva el token para el próximo arranque', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Network request failed'));
    const { wrapper } = setup('refresh-1');
    const { result } = await renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));
    expect(await store.getItemAsync(REFRESH_TOKEN_KEY)).toBe('refresh-1');
    expect(result.current.suspension).toBeNull();
  });

  it('cuenta suspendida al restaurar: muestra la suspensión y borra el token', async () => {
    route('/auth/refresh', () => reply(200, { tokens: tokens(2) }));
    route('/me', () =>
      error(403, 'forbidden', [{ field: 'suspendedUntil', issue: '2026-12-01T00:00:00Z' }]),
    );
    const { wrapper } = setup('refresh-1');
    const { result } = await renderHook(() => useSession(), { wrapper });
    await waitFor(() =>
      expect(result.current.suspension).toEqual({ until: '2026-12-01T00:00:00Z' }),
    );
    expect(result.current.status).toBe('signedOut');
    expect(await store.getItemAsync(REFRESH_TOKEN_KEY)).toBeNull();
  });
});

describe('signIn y signUp (CA-01)', () => {
  it('signIn guarda el token de refresco, deja el de acceso en memoria y abre la sesión', async () => {
    route('/auth/login', () => reply(200, { user, tokens: tokens(1) }));
    const { wrapper } = setup();
    const { result } = await renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));

    await act(async () => {
      await result.current.signIn({ email: 'ana@example.com', password: '12345678' });
    });

    expect(result.current.status).toBe('signedIn');
    expect(result.current.user?.id).toBe(user.id);
    expect(await store.getItemAsync(REFRESH_TOKEN_KEY)).toBe('refresh-1');
    expect(getAccessToken()).toBe('access-1');
  });

  it('signIn con credenciales inválidas propaga el error y no abre la sesión', async () => {
    route('/auth/login', () => error(401, 'unauthorized'));
    const { wrapper } = setup();
    const { result } = await renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));

    await act(async () => {
      await expect(
        result.current.signIn({ email: 'ana@example.com', password: 'mala-clave' }),
      ).rejects.toMatchObject({ status: 401 });
    });
    expect(result.current.status).toBe('signedOut');
    expect(result.current.suspension).toBeNull();
    expect(await store.getItemAsync(REFRESH_TOKEN_KEY)).toBeNull();
  });

  it('signIn con 403 muestra la suspensión (sin fecha si el servidor no la da)', async () => {
    route('/auth/login', () => error(403, 'forbidden'));
    const { wrapper } = setup();
    const { result } = await renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));

    await act(async () => {
      await expect(
        result.current.signIn({ email: 'ana@example.com', password: '12345678' }),
      ).rejects.toMatchObject({ status: 403 });
    });
    expect(result.current.suspension).toEqual({ until: null });

    await act(async () => result.current.dismissSuspension());
    expect(result.current.suspension).toBeNull();
  });

  it('signUp envía el registro sin la confirmación y abre la sesión', async () => {
    route('/auth/register', () => reply(201, { user, tokens: tokens(1) }));
    const { wrapper } = setup();
    const { result } = await renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));

    await act(async () => {
      await result.current.signUp({
        displayName: 'Ana López',
        email: 'ana@example.com',
        password: 'una-contrasena-larga',
        confirmPassword: 'una-contrasena-larga',
        isAdult: true,
        acceptTerms: true,
      });
    });

    expect(result.current.status).toBe('signedIn');
    expect(JSON.parse(callsTo('/auth/register')[0]?.init.body as string)).toEqual({
      email: 'ana@example.com',
      password: 'una-contrasena-larga',
      displayName: 'Ana López',
      acceptTerms: true,
      isAdult: true,
    });
  });

  it('signUp con 409 (correo usado) propaga el error', async () => {
    route('/auth/register', () => error(409, 'conflict'));
    const { wrapper } = setup();
    const { result } = await renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));
    await act(async () => {
      await expect(
        result.current.signUp({
          displayName: 'Ana',
          email: 'ana@example.com',
          password: '12345678',
          confirmPassword: '12345678',
          isAdult: true,
          acceptTerms: true,
        }),
      ).rejects.toMatchObject({ status: 409 });
    });
    expect(result.current.status).toBe('signedOut');
  });
});

describe('signOut (RF-07)', () => {
  async function signedIn() {
    route('/auth/login', () => reply(200, { user, tokens: tokens(1) }));
    const ctx = setup();
    const hook = await renderHook(() => useSession(), { wrapper: ctx.wrapper });
    await waitFor(() => expect(hook.result.current.status).toBe('signedOut'));
    await act(async () => {
      await hook.result.current.signIn({ email: 'ana@example.com', password: '12345678' });
    });
    return { ...ctx, ...hook };
  }

  it('borra tokens y caché, y avisa al servidor con el token de refresco', async () => {
    route('/auth/logout', () => reply(204, null));
    const { result, queryClient } = await signedIn();
    queryClient.setQueryData(['datos'], { privados: true });

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.status).toBe('signedOut');
    expect(result.current.user).toBeNull();
    expect(getAccessToken()).toBeNull();
    expect(await store.getItemAsync(REFRESH_TOKEN_KEY)).toBeNull();
    expect(queryClient.getQueryData(['datos'])).toBeUndefined();
    expect(JSON.parse(callsTo('/auth/logout')[0]?.init.body as string)).toEqual({
      refreshToken: 'refresh-1',
    });
  });

  it('si el servidor falla igual cierra la sesión en el dispositivo', async () => {
    route('/auth/logout', () => error(500, 'internal_error'));
    const { result } = await signedIn();
    await act(async () => {
      await result.current.signOut();
    });
    expect(result.current.status).toBe('signedOut');
  });

  it('sin sesión no llama al servidor', async () => {
    const { wrapper } = setup();
    const { result } = await renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));
    await act(async () => {
      await result.current.signOut();
    });
    expect(callsTo('/auth/logout')).toHaveLength(0);
  });
});

describe('renovación con sesión abierta (CA-03, CA-04)', () => {
  const schema = z.object({ ok: z.boolean() });

  async function signedIn() {
    route('/auth/login', () => reply(200, { user, tokens: tokens(1) }));
    const ctx = setup();
    const hook = await renderHook(() => useSession(), { wrapper: ctx.wrapper });
    await waitFor(() => expect(hook.result.current.status).toBe('signedOut'));
    await act(async () => {
      await hook.result.current.signIn({ email: 'ana@example.com', password: '12345678' });
    });
    return { ...ctx, ...hook };
  }

  it('con token vencido y 3 peticiones simultáneas solo hay una renovación', async () => {
    const { result } = await signedIn();
    route('/auth/refresh', () => reply(200, { tokens: tokens(2) }));
    for (const path of ['/a', '/b', '/c']) {
      route(path, (init) =>
        (init.headers as Record<string, string>).Authorization === 'Bearer access-2'
          ? reply(200, { ok: true })
          : error(401, 'unauthorized'),
      );
    }

    let results: unknown[] = [];
    await act(async () => {
      results = await Promise.all([
        request('/a', schema),
        request('/b', schema),
        request('/c', schema),
      ]);
    });

    expect(results).toHaveLength(3);
    expect(callsTo('/auth/refresh')).toHaveLength(1);
    expect(JSON.parse(callsTo('/auth/refresh')[0]?.init.body as string)).toEqual({
      refreshToken: 'refresh-1',
    });
    expect(await store.getItemAsync(REFRESH_TOKEN_KEY)).toBe('refresh-2');
    expect(result.current.status).toBe('signedIn');
  });

  it('si la renovación falla cierra la sesión y limpia la caché', async () => {
    const { result, queryClient } = await signedIn();
    queryClient.setQueryData(['datos'], 1);
    route('/auth/refresh', () => error(401, 'unauthorized'));
    route('/a', () => error(401, 'unauthorized'));

    await act(async () => {
      await expect(request('/a', schema)).rejects.toMatchObject({ status: 401 });
    });

    await waitFor(() => expect(result.current.status).toBe('signedOut'));
    expect(getAccessToken()).toBeNull();
    expect(await store.getItemAsync(REFRESH_TOKEN_KEY)).toBeNull();
    expect(queryClient.getQueryData(['datos'])).toBeUndefined();
  });
});

describe('otros', () => {
  it('setUser actualiza el usuario en memoria', async () => {
    route('/auth/login', () => reply(200, { user, tokens: tokens(1) }));
    const { wrapper } = setup();
    const { result } = await renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));
    await act(async () => {
      await result.current.signIn({ email: 'ana@example.com', password: '12345678' });
    });
    await act(async () => result.current.setUser({ ...user, displayName: 'Ana M.' }));
    expect(result.current.user?.displayName).toBe('Ana M.');
  });

  it('useSession fuera de SessionProvider lanza un error claro', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(renderHook(() => useSession())).rejects.toThrow(/SessionProvider/);
  });

  it('no deja la contraseña ni los tokens en la caché de consultas ni en consola', async () => {
    const spies = [
      jest.spyOn(console, 'log'),
      jest.spyOn(console, 'warn'),
      jest.spyOn(console, 'error'),
    ];
    route('/auth/login', () => reply(200, { user, tokens: tokens(1) }));
    const { wrapper, queryClient } = setup();
    const { result } = await renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));
    await act(async () => {
      await result.current.signIn({ email: 'ana@example.com', password: 'secreta-123' });
    });
    expect(JSON.stringify(queryClient.getQueryCache().getAll())).not.toMatch(
      /secreta|refresh-1|access-1/,
    );
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  });
});
