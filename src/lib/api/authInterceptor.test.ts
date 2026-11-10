import { z } from 'zod';
import {
  getAccessToken,
  isAuthPath,
  refreshOnce,
  resetAuthInterceptor,
  setAccessToken,
  setSessionHandlers,
} from '@/lib/api/authInterceptor';
import { request } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';

jest.mock('@/lib/config', () => {
  const actual = jest.requireActual<typeof import('@/lib/config')>('@/lib/config');
  return {
    ...actual,
    getConfig: jest.fn(() => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' })),
  };
});

const schema = z.object({ ok: z.boolean() });
const unauthorized = { error: { code: 'unauthorized', message: 'vencido', requestId: 'r1' } };

const response = (status: number, body: unknown): Response =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

type Call = { url: string; authorization: string | undefined };

function authorizationOf(init: RequestInit | undefined): string | undefined {
  return (init?.headers as Record<string, string> | undefined)?.Authorization;
}

/** `fetch` que acepta solo el token indicado y responde 401 con cualquier otro. */
function serverAccepting(validToken: () => string | null) {
  const calls: Call[] = [];
  jest.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const authorization = authorizationOf(init);
    calls.push({ url: String(input), authorization });
    return authorization === `Bearer ${validToken()}`
      ? response(200, { ok: true })
      : response(401, unauthorized);
  });
  return calls;
}

afterEach(() => {
  jest.restoreAllMocks();
  resetAuthInterceptor();
});

describe('isAuthPath', () => {
  it.each([
    ['/auth/login', true],
    ['auth/refresh', true],
    ['/auth', true],
    ['/me', false],
    ['/authors', false],
  ])('%s → %s', (path, expected) => {
    expect(isAuthPath(path)).toBe(expected);
  });
});

describe('Authorization', () => {
  it('adjunta el token de acceso a las rutas protegidas', async () => {
    setAccessToken('t1');
    const calls = serverAccepting(() => 't1');
    await request('/me', schema);
    expect(calls[0]?.authorization).toBe('Bearer t1');
  });

  it('no adjunta token a las rutas /auth/*', async () => {
    setAccessToken('t1');
    const calls = serverAccepting(() => 't1');
    await expect(request('/auth/login', schema)).rejects.toBeInstanceOf(ApiError);
    expect(calls[0]?.authorization).toBeUndefined();
  });

  it('sin sesión no manda Authorization y un 401 no intenta renovar', async () => {
    const refresh = jest.fn(async () => true);
    setSessionHandlers({ refresh, onSessionExpired: jest.fn() });
    serverAccepting(() => 'x');
    await expect(request('/me', schema)).rejects.toMatchObject({ status: 401 });
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe('renovación single-flight (CA-03)', () => {
  it('con 3 peticiones simultáneas y token vencido solo renueva una vez y reintenta las 3', async () => {
    setAccessToken('viejo');
    const refresh = jest.fn(async () => {
      await Promise.resolve();
      setAccessToken('nuevo');
      return true;
    });
    setSessionHandlers({ refresh, onSessionExpired: jest.fn() });
    const calls = serverAccepting(() => 'nuevo');

    const results = await Promise.all([
      request('/me', schema),
      request('/items', schema),
      request('/me', schema),
    ]);

    expect(results).toEqual([{ ok: true }, { ok: true }, { ok: true }]);
    expect(refresh).toHaveBeenCalledTimes(1);
    // 3 intentos con el token viejo + 3 reintentos con el nuevo.
    expect(calls.filter((call) => call.authorization === 'Bearer viejo')).toHaveLength(3);
    expect(calls.filter((call) => call.authorization === 'Bearer nuevo')).toHaveLength(3);
  });

  it('una petición que llega tarde con el token viejo reintenta sin renovar otra vez', async () => {
    setAccessToken('viejo');
    const refresh = jest.fn(async () => true);
    setSessionHandlers({ refresh, onSessionExpired: jest.fn() });
    const calls: Call[] = [];
    jest.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const authorization = authorizationOf(init);
      calls.push({ url: String(input), authorization });
      if (authorization === 'Bearer viejo') {
        // Mientras esta respuesta viajaba, otra petición ya renovó la sesión.
        setAccessToken('nuevo');
        return response(401, unauthorized);
      }
      return response(200, { ok: true });
    });

    await expect(request('/me', schema)).resolves.toEqual({ ok: true });
    expect(refresh).not.toHaveBeenCalled();
    expect(calls.map((call) => call.authorization)).toEqual(['Bearer viejo', 'Bearer nuevo']);
  });

  it('reintenta una sola vez: si el reintento vuelve a dar 401, falla', async () => {
    setAccessToken('viejo');
    const refresh = jest.fn(async () => {
      setAccessToken('nuevo');
      return true;
    });
    setSessionHandlers({ refresh, onSessionExpired: jest.fn() });
    serverAccepting(() => 'ninguno');
    await expect(request('/me', schema)).rejects.toMatchObject({ status: 401 });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('después de renovar, una nueva ronda de 401 vuelve a renovar', async () => {
    setAccessToken('a');
    let n = 0;
    const refresh = jest.fn(async () => {
      n += 1;
      setAccessToken(`t${n}`);
      return true;
    });
    setSessionHandlers({ refresh, onSessionExpired: jest.fn() });
    serverAccepting(() => 't2');
    await expect(request('/me', schema)).rejects.toMatchObject({ status: 401 });
    expect(refresh).toHaveBeenCalledTimes(1);
    setAccessToken('t1');
    await expect(request('/me', schema)).resolves.toEqual({ ok: true });
    expect(refresh).toHaveBeenCalledTimes(2);
  });
});

describe('renovación fallida (CA-04)', () => {
  it('avisa una sola vez que la sesión terminó y devuelve el 401 original', async () => {
    setAccessToken('viejo');
    const onSessionExpired = jest.fn();
    setSessionHandlers({ refresh: async () => false, onSessionExpired });
    serverAccepting(() => 'otro');

    const results = await Promise.allSettled([request('/me', schema), request('/items', schema)]);

    expect(results.map((r) => r.status)).toEqual(['rejected', 'rejected']);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('una renovación que lanza cuenta como fallida', async () => {
    setAccessToken('viejo');
    const onSessionExpired = jest.fn();
    setSessionHandlers({
      refresh: async () => {
        throw new Error('sin red');
      },
      onSessionExpired,
    });
    serverAccepting(() => 'otro');
    await expect(request('/me', schema)).rejects.toMatchObject({ status: 401 });
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('no reintenta las rutas /auth/*', async () => {
    const refresh = jest.fn(async () => true);
    setSessionHandlers({ refresh, onSessionExpired: jest.fn() });
    serverAccepting(() => 'x');
    await expect(request('/auth/refresh', schema, { method: 'POST' })).rejects.toMatchObject({
      status: 401,
    });
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe('estado del módulo', () => {
  it('guarda y borra el token en memoria', () => {
    setAccessToken('abc');
    expect(getAccessToken()).toBe('abc');
    setAccessToken(null);
    expect(getAccessToken()).toBeNull();
  });

  it('refreshOnce sin manejadores devuelve false', async () => {
    await expect(refreshOnce()).resolves.toBe(false);
  });
});
