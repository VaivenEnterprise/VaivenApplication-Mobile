import { login, logout, refreshTokens, register } from '@/features/auth/api';
import { deleteMe, getMe, getUser, updateMe } from '@/features/profile/api';
import { ApiError } from '@/lib/api/errors';

jest.mock('@/lib/config', () => {
  const actual = jest.requireActual<typeof import('@/lib/config')>('@/lib/config');
  return {
    ...actual,
    getConfig: jest.fn(() => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' })),
  };
});

const user = {
  id: '6730f1c2a9b3e4d5f6a7b8c9',
  email: 'ana@example.com',
  displayName: 'Ana',
  phone: null,
  role: 'user',
  ratingAverage: null,
  ratingCount: 0,
  createdAt: '2026-11-06T18:00:00Z',
};
const tokens = { accessToken: 'a', refreshToken: 'r', expiresIn: 900 };

const noContent = (): Response =>
  ({
    ok: true,
    status: 204,
    json: () => Promise.reject(new Error('sin cuerpo')),
  }) as unknown as Response;

const response = (status: number, body: unknown): Response =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

function mockFetch(status: number, body: unknown) {
  return jest.spyOn(globalThis, 'fetch').mockResolvedValue(response(status, body));
}

function lastCall(spy: jest.SpyInstance) {
  const [url, init] = spy.mock.calls.at(-1) as [string, RequestInit];
  return { url, method: init.method, body: init.body as string | undefined };
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('autenticación', () => {
  it('register: POST /auth/register con el cuerpo del contrato', async () => {
    const spy = mockFetch(201, { user, tokens });
    const body = {
      email: 'ana@example.com',
      password: 'una-contrasena-larga',
      displayName: 'Ana',
      acceptTerms: true,
      isAdult: true,
    } as const;
    const result = await register(body);
    expect(result.user.id).toBe(user.id);
    expect(lastCall(spy)).toEqual({
      url: 'http://api.test/api/v1/auth/register',
      method: 'POST',
      body: JSON.stringify(body),
    });
  });

  it('login: solo envía correo y contraseña', async () => {
    const spy = mockFetch(200, { user, tokens });
    await login({ email: 'ana@example.com', password: '12345678' });
    expect(lastCall(spy)).toMatchObject({
      url: 'http://api.test/api/v1/auth/login',
      body: JSON.stringify({ email: 'ana@example.com', password: '12345678' }),
    });
  });

  it('refreshTokens: envía {refreshToken} y devuelve los tokens', async () => {
    const spy = mockFetch(200, { tokens });
    await expect(refreshTokens('r-viejo')).resolves.toEqual(tokens);
    expect(lastCall(spy)).toMatchObject({
      url: 'http://api.test/api/v1/auth/refresh',
      body: JSON.stringify({ refreshToken: 'r-viejo' }),
    });
  });

  it('logout: envía {refreshToken} y acepta 204 sin cuerpo', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(noContent());
    await expect(logout('r')).resolves.toBeUndefined();
    expect(lastCall(spy)).toMatchObject({
      url: 'http://api.test/api/v1/auth/logout',
      body: JSON.stringify({ refreshToken: 'r' }),
    });
  });

  it.each([
    [409, 'conflict'],
    [401, 'unauthorized'],
    [429, 'rate_limited'],
  ])('un %s llega como ApiError con código %s', async (status, code) => {
    mockFetch(status, { error: { code, message: 'x', requestId: 'r1' } });
    await expect(login({ email: 'a@b.co', password: '12345678' })).rejects.toMatchObject({
      status,
      code,
    });
  });

  it('una respuesta que no cumple el contrato es invalid_response', async () => {
    mockFetch(200, { user });
    await expect(login({ email: 'a@b.co', password: '12345678' })).rejects.toMatchObject({
      code: 'invalid_response',
    });
  });

  it('no registra contraseñas ni tokens en consola', async () => {
    const logs = [
      jest.spyOn(console, 'log'),
      jest.spyOn(console, 'error'),
      jest.spyOn(console, 'warn'),
    ];
    mockFetch(401, { error: { code: 'unauthorized', message: 'x', requestId: 'r1' } });
    await expect(login({ email: 'a@b.co', password: 'secreta-123' })).rejects.toBeInstanceOf(
      ApiError,
    );
    for (const spy of logs) expect(spy).not.toHaveBeenCalled();
  });
});

describe('cuenta y perfil', () => {
  it('getMe: GET /me', async () => {
    const spy = mockFetch(200, user);
    await expect(getMe()).resolves.toMatchObject({ displayName: 'Ana' });
    expect(lastCall(spy).url).toBe('http://api.test/api/v1/me');
  });

  it('updateMe: PATCH /me con solo los campos enviados', async () => {
    const spy = mockFetch(200, { ...user, displayName: 'Ana López', phone: '+525512345678' });
    await updateMe({ displayName: 'Ana López', phone: '+525512345678' });
    expect(lastCall(spy)).toMatchObject({
      method: 'PATCH',
      body: JSON.stringify({ displayName: 'Ana López', phone: '+525512345678' }),
    });
  });

  it('updateMe: phone null borra el teléfono', async () => {
    const spy = mockFetch(200, user);
    await updateMe({ phone: null });
    expect(lastCall(spy).body).toBe(JSON.stringify({ phone: null }));
  });

  it('deleteMe: DELETE /me con la contraseña y 204', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(noContent());
    await expect(deleteMe('secreta-123')).resolves.toBeUndefined();
    expect(lastCall(spy)).toMatchObject({
      method: 'DELETE',
      body: JSON.stringify({ password: 'secreta-123' }),
    });
  });

  it('deleteMe: 403 (contraseña) y 409 (reservas activas) llegan con su código', async () => {
    mockFetch(403, { error: { code: 'forbidden', message: 'x', requestId: 'r1' } });
    await expect(deleteMe('mala')).rejects.toMatchObject({ status: 403, code: 'forbidden' });
    mockFetch(409, { error: { code: 'conflict', message: 'x', requestId: 'r1' } });
    await expect(deleteMe('buena')).rejects.toMatchObject({ status: 409, code: 'conflict' });
  });

  it('getUser: GET /users/{id} y escapa el identificador', async () => {
    const spy = mockFetch(200, {
      id: 'abc',
      displayName: 'Ana',
      ratingAverage: 4.5,
      ratingCount: 2,
      memberSince: '2026-11-06T18:00:00Z',
    });
    await getUser('a/b');
    expect(lastCall(spy).url).toBe('http://api.test/api/v1/users/a%2Fb');
  });
});
