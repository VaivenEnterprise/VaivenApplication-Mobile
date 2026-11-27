import { z } from 'zod';
import {
  resetAuthInterceptor,
  setAccessToken,
  setSessionHandlers,
} from '@/lib/api/authInterceptor';
import { request } from '@/lib/api/client';

// Spec 016 · S-02 y S-06 (OWASP M3 autenticación insegura, M6 privacidad, M9 almacenamiento).

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));

const reply = (status: number, body: unknown): Response =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;
const unauthorized = () =>
  reply(401, { error: { code: 'unauthorized', message: 'x', requestId: 'r1', details: [] } });

let fetchMock: jest.SpyInstance;
const authorization = (call: number): string | undefined =>
  (fetchMock.mock.calls[call][1].headers as Record<string, string>).Authorization;

beforeEach(() => {
  resetAuthInterceptor();
  fetchMock = jest.spyOn(globalThis, 'fetch');
});
afterEach(() => jest.restoreAllMocks());

describe('S-02 · M3 · cabecera Authorization y renovación', () => {
  it('S-02a con sesión envía Bearer en rutas normales', async () => {
    setAccessToken('acceso-1');
    fetchMock.mockResolvedValue(reply(200, { ok: true }));
    await request('/items', z.unknown());
    expect(authorization(0)).toBe('Bearer acceso-1');
  });

  it('S-02b nunca envía Authorization a rutas /auth/*', async () => {
    setAccessToken('acceso-1');
    fetchMock.mockResolvedValue(reply(200, { ok: true }));
    await request('/auth/login', z.unknown(), { method: 'POST', body: '{}' });
    expect(authorization(0)).toBeUndefined();
  });

  it('S-02c sin sesión no inventa Authorization', async () => {
    fetchMock.mockResolvedValue(reply(200, { ok: true }));
    await request('/categories', z.unknown());
    expect(authorization(0)).toBeUndefined();
  });

  it('S-02d ante un 401 renueva una vez y reintenta una vez con el token nuevo', async () => {
    setAccessToken('viejo');
    const refresh = jest.fn(async () => {
      setAccessToken('nuevo');
      return true;
    });
    setSessionHandlers({ refresh, onSessionExpired: jest.fn() });
    fetchMock.mockResolvedValueOnce(unauthorized()).mockResolvedValueOnce(reply(200, { ok: 1 }));
    await expect(request('/items', z.unknown())).resolves.toEqual({ ok: 1 });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(authorization(1)).toBe('Bearer nuevo');
  });

  it('S-02e un segundo 401 no entra en ciclo: falla tras un solo reintento', async () => {
    setAccessToken('viejo');
    const refresh = jest.fn(async () => {
      setAccessToken('nuevo');
      return true;
    });
    setSessionHandlers({ refresh, onSessionExpired: jest.fn() });
    fetchMock.mockImplementation(async () => unauthorized());
    await expect(request('/items', z.unknown())).rejects.toMatchObject({ status: 401 });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('S-02f si la renovación falla se cierra la sesión y no se reintenta', async () => {
    setAccessToken('viejo');
    const onSessionExpired = jest.fn();
    setSessionHandlers({ refresh: async () => false, onSessionExpired });
    fetchMock.mockImplementation(async () => unauthorized());
    await expect(request('/items', z.unknown())).rejects.toMatchObject({ status: 401 });
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  // Spec 021-T033 (RF-31, CA-13): el 401 con `details` `stepUp` pide confirmar la identidad.
  const stepUp = () =>
    reply(401, {
      error: {
        code: 'unauthorized',
        message: 'x',
        requestId: 'r2',
        details: [{ field: 'stepUp', issue: 'required' }],
      },
    });

  it('S-02h un 401 stepUp no renueva ni cierra la sesión y llega como step_up_required', async () => {
    setAccessToken('vigente');
    const refresh = jest.fn(async () => true);
    const onSessionExpired = jest.fn();
    setSessionHandlers({ refresh, onSessionExpired });
    fetchMock.mockImplementation(async () => stepUp());
    await expect(
      request('/me', z.unknown(), { method: 'DELETE', body: '{}' }),
    ).rejects.toMatchObject({ status: 401, code: 'step_up_required', requestId: 'r2' });
    expect(refresh).not.toHaveBeenCalled();
    expect(onSessionExpired).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('S-02i si el reintento tras renovar pide stepUp, no vuelve a renovar (sin bucle)', async () => {
    setAccessToken('viejo');
    const refresh = jest.fn(async () => {
      setAccessToken('nuevo');
      return true;
    });
    const onSessionExpired = jest.fn();
    setSessionHandlers({ refresh, onSessionExpired });
    fetchMock.mockResolvedValueOnce(unauthorized()).mockImplementation(async () => stepUp());
    await expect(request('/items', z.unknown())).rejects.toMatchObject({
      code: 'step_up_required',
    });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(onSessionExpired).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('S-02j un 401 sin stepUp (sesión vencida) sigue cerrando la sesión como antes', async () => {
    setAccessToken('viejo');
    const onSessionExpired = jest.fn();
    setSessionHandlers({ refresh: async () => false, onSessionExpired });
    fetchMock.mockImplementation(async () =>
      reply(401, {
        error: {
          code: 'unauthorized',
          message: 'x',
          requestId: 'r3',
          details: [{ field: 'token', issue: 'expired' }],
        },
      }),
    );
    await expect(request('/items', z.unknown())).rejects.toMatchObject({ code: 'unauthorized' });
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('S-02g un 401 de /auth/login no dispara renovación', async () => {
    const refresh = jest.fn(async () => true);
    setSessionHandlers({ refresh, onSessionExpired: jest.fn() });
    fetchMock.mockImplementation(async () => unauthorized());
    await expect(request('/auth/login', z.unknown(), { method: 'POST' })).rejects.toMatchObject({
      status: 401,
    });
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe('S-06 · M6/M9 · sin datos sensibles en consola', () => {
  it('S-06a un error de red, uno del servidor y una respuesta inválida no escriben en consola', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) =>
      jest.spyOn(console, m).mockImplementation(() => undefined),
    );
    setAccessToken('token-secreto');
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    await expect(
      request('/me', z.unknown(), { method: 'DELETE', body: '{"password":"clave-secreta"}' }),
    ).rejects.toBeDefined();
    fetchMock.mockResolvedValueOnce(
      reply(500, { error: { code: 'internal_error', message: 'x', requestId: 'r', details: [] } }),
    );
    await expect(request('/me', z.unknown())).rejects.toBeDefined();
    fetchMock.mockResolvedValueOnce(reply(200, { raro: true }));
    await expect(request('/me', z.object({ id: z.string() }))).rejects.toBeDefined();
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    for (const spy of spies) spy.mockRestore();
  });

  it('S-06b el mensaje del error no contiene el token ni el cuerpo enviado', async () => {
    setAccessToken('token-secreto');
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    const error = await request('/me', z.unknown(), {
      method: 'DELETE',
      body: '{"password":"clave-secreta"}',
    }).catch((e: unknown) => e);
    const text = JSON.stringify(error) + String((error as Error).message);
    expect(text).not.toContain('token-secreto');
    expect(text).not.toContain('clave-secreta');
  });
});
