import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import type { ReactNode } from 'react';
import { REFRESH_TOKEN_KEY, SessionProvider } from '@/features/auth/session';
import { registerBeforeSignOut } from '@/features/auth/signOutHooks';
import { useSession } from '@/features/auth/useSession';
import { getAccessToken, resetAuthInterceptor } from '@/lib/api/authInterceptor';

// Spec 016: suite de seguridad de la sesión (S-03, S-04, S-06). Reutiliza el arnés de session.test.tsx.
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

jest.setTimeout(30_000);

// Spec 016 · S-03 (cierre de sesión por endpoint), S-04 (la sesión persiste), S-06 (sin fugas).
// OWASP M3 (autenticación y autorización inseguras) y M9 (almacenamiento inseguro de datos).

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

describe('S-03 · M3/M9 · cierre de sesión consume POST /auth/logout', () => {
  it('S-03a llama a POST /auth/logout con el token de refresco y deja todo limpio', async () => {
    route('/auth/logout', () => reply(204, null));
    const { result, queryClient } = await signedIn();
    queryClient.setQueryData(['privado'], { dato: 1 });
    await act(async () => {
      await result.current.signOut();
    });
    const logout = callsTo('/auth/logout');
    expect(logout).toHaveLength(1);
    expect(logout[0]?.init.method).toBe('POST');
    expect(JSON.parse(logout[0]?.init.body as string)).toEqual({ refreshToken: 'refresh-1' });
    expect(result.current.status).toBe('signedOut');
    expect(result.current.user).toBeNull();
    expect(getAccessToken()).toBeNull();
    expect(await store.getItemAsync(REFRESH_TOKEN_KEY)).toBeNull();
    expect(queryClient.getQueryData(['privado'])).toBeUndefined();
  });

  it('S-03b si el servidor falla o no responde, el dispositivo igual queda sin sesión', async () => {
    route('/auth/logout', () => error(500, 'internal_error'));
    const { result } = await signedIn();
    await act(async () => {
      await result.current.signOut();
    });
    expect(result.current.status).toBe('signedOut');
    expect(getAccessToken()).toBeNull();
    expect(await store.getItemAsync(REFRESH_TOKEN_KEY)).toBeNull();
  });

  it('S-03c las tareas previas (baja del token de push) corren antes de borrar el token de acceso', async () => {
    route('/auth/logout', () => reply(204, null));
    const { result } = await signedIn();
    let tokenDuranteLaTarea: string | null = 'sin-ejecutar';
    const quitar = registerBeforeSignOut(async () => {
      tokenDuranteLaTarea = getAccessToken();
    });
    await act(async () => {
      await result.current.signOut();
    });
    quitar();
    expect(tokenDuranteLaTarea).toBe('access-1');
    expect(getAccessToken()).toBeNull();
  });

  it('S-03d una tarea previa que falla no impide cerrar la sesión', async () => {
    route('/auth/logout', () => reply(204, null));
    const { result } = await signedIn();
    const quitar = registerBeforeSignOut(async () => {
      throw new Error('push caído');
    });
    await act(async () => {
      await result.current.signOut();
    });
    quitar();
    expect(result.current.status).toBe('signedOut');
  });
});

describe('S-04 · M3 · la sesión persiste al cerrar y volver a abrir la app', () => {
  it('S-04a el único secreto en disco es el token de refresco', async () => {
    store.setItemAsync.mockClear();
    await signedIn();
    expect(store.setItemAsync).toHaveBeenCalledTimes(1);
    expect(store.setItemAsync).toHaveBeenCalledWith(REFRESH_TOKEN_KEY, 'refresh-1');
  });

  it('S-04b al reabrir con el token guardado restaura sin pedir credenciales ni llamar a logout', async () => {
    route('/auth/refresh', () => reply(200, { tokens: tokens(2) }));
    route('/me', () => reply(200, user));
    const primera = await signedIn();
    // «Cerrar la app» sin cerrar sesión: se desmonta; el almacén seguro conserva el token.
    await primera.unmount();
    resetAuthInterceptor();
    calls.length = 0;

    const { wrapper } = setup();
    const { result } = await renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('signedIn'));
    expect(result.current.user?.email).toBe('ana@example.com');
    expect(callsTo('/auth/login')).toHaveLength(0);
    expect(callsTo('/auth/logout')).toHaveLength(0);
    expect(callsTo('/auth/refresh')).toHaveLength(1);
    expect(await store.getItemAsync(REFRESH_TOKEN_KEY)).toBe('refresh-2');
  });

  it('S-04c un token de refresco vencido (401) se borra y pide iniciar sesión de nuevo', async () => {
    route('/auth/refresh', () => error(401, 'unauthorized'));
    const { wrapper } = setup('refresh-viejo');
    const { result } = await renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));
    expect(await store.getItemAsync(REFRESH_TOKEN_KEY)).toBeNull();
    expect(getAccessToken()).toBeNull();
  });

  it('S-04d sin red conserva el token para el próximo arranque, sin dejar sesión abierta', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Network request failed'));
    const { wrapper } = setup('refresh-1');
    const { result } = await renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));
    expect(await store.getItemAsync(REFRESH_TOKEN_KEY)).toBe('refresh-1');
    expect(getAccessToken()).toBeNull();
  });
});

describe('S-06 · M6/M9 · sin datos sensibles en la caché de consultas ni en consola', () => {
  it('S-06c iniciar y cerrar sesión no deja contraseña ni tokens en caché ni en consola', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) =>
      jest.spyOn(console, m).mockImplementation(() => undefined),
    );
    route('/auth/login', () => reply(200, { user, tokens: tokens(1) }));
    route('/auth/logout', () => reply(204, null));
    const { wrapper, queryClient } = setup();
    const { result } = await renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('signedOut'));
    await act(async () => {
      await result.current.signIn({ email: 'ana@example.com', password: 'secreta-123' });
    });
    expect(JSON.stringify(queryClient.getQueryCache().getAll())).not.toMatch(
      /secreta|refresh-1|access-1/,
    );
    await act(async () => {
      await result.current.signOut();
    });
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  });
});
