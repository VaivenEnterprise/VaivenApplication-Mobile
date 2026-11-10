/// <reference types="node" />
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import path from 'node:path';
import { REFRESH_TOKEN_KEY } from '@/features/auth/session';
import { es } from '@/i18n/es-MX';
import { getAccessToken, resetAuthInterceptor } from '@/lib/api/authInterceptor';
import { request } from '@/lib/api/client';
import { z } from 'zod';
import {
  failure,
  fakeTokens,
  fakeUser,
  installFakeApi,
  installMemorySecureStore,
  ok,
} from '@/test/fakeApi';

// Integración de sesión (spec 003, T011) sobre el árbol real de `src/app`: formularios, API
// simulada sobre `fetch`, almacén seguro en memoria y navegación con guardia de sesión.

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
  configResult: { ok: true, config: { apiBaseUrl: 'http://api.test', appEnv: 'development' } },
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const APP_DIR = path.resolve(__dirname, '../../app');
const register = es.auth.register;
const login = es.auth.login;

// El recorrido completo monta el árbol real varias veces; con cobertura y carga puede pasar de 5 s.
const LONG_TEST_MS = 30_000;

const baseApi = {
  'GET /me': () => ok(fakeUser),
  'GET /items': () => ok({ items: [], nextCursor: null }),
};

beforeEach(() => resetAuthInterceptor());
afterEach(() => jest.restoreAllMocks());

describe('sesión de punta a punta', () => {
  it(
    'registro → pestañas → cerrar sesión → inicio de sesión → pestañas',
    async () => {
      const store = installMemorySecureStore();
      const api = installFakeApi({
        ...baseApi,
        'POST /auth/register': () => ({
          status: 201,
          body: { user: fakeUser, tokens: fakeTokens(1) },
        }),
        'POST /auth/logout': () => ({ status: 204 }),
        'POST /auth/login': () => ok({ user: fakeUser, tokens: fakeTokens(3) }),
      });

      await renderRouter(APP_DIR);
      await waitFor(() => expect(screen).toHavePathname('/login'));

      // Registro
      await fireEvent.press(await screen.findByRole('link', { name: login.createOne }));
      await screen.findByText(register.title);
      await fireEvent.changeText(screen.getByLabelText(register.name), 'Ana López');
      await fireEvent.changeText(screen.getByLabelText(register.email), 'ana@example.com');
      await fireEvent.changeText(screen.getByLabelText(register.password), 'secreto123');
      await fireEvent.changeText(screen.getByLabelText(register.confirm), 'secreto123');
      await fireEvent.press(screen.getByRole('checkbox', { name: register.adult }));
      await fireEvent.press(screen.getByRole('checkbox', { name: /Acepto los/ }));
      await fireEvent.press(screen.getByRole('button', { name: register.submit }));

      // Pestañas: Inicio con el saludo, token de refresco guardado y de acceso solo en memoria
      expect(await screen.findByRole('tab', { name: es.tabs.home })).toBeTruthy();
      await waitFor(() => expect(screen).toHavePathname('/inicio'));
      expect(await screen.findByText(`${es.inicio.greeting} Ana`)).toBeTruthy();
      expect(store.get(REFRESH_TOKEN_KEY)).toBe('refresh-1');
      expect(getAccessToken()).toBe('access-1');
      expect(JSON.stringify([...store.values()])).not.toContain('access-1');
      expect(screen.queryByRole('button', { name: register.submit })).toBeNull();

      // Cerrar sesión desde Perfil
      await fireEvent.press(screen.getByRole('tab', { name: es.tabs.profile }));
      await fireEvent.press(await screen.findByText(es.profile.signOut));
      await waitFor(() => expect(screen).toHavePathname('/login'));
      expect(store.has(REFRESH_TOKEN_KEY)).toBe(false);
      expect(getAccessToken()).toBeNull();
      expect(api.calls.find((call) => call.path === '/auth/logout')?.body).toEqual({
        refreshToken: 'refresh-1',
      });
      expect(screen.queryByRole('tab')).toBeNull();

      // Volver a entrar
      await fireEvent.changeText(await screen.findByLabelText(login.email), 'ana@example.com');
      await fireEvent.changeText(screen.getByLabelText(login.password), 'secreto123');
      await fireEvent.press(screen.getByRole('button', { name: login.submit }));
      expect(await screen.findByRole('tab', { name: es.tabs.home })).toBeTruthy();
      expect(store.get(REFRESH_TOKEN_KEY)).toBe('refresh-3');
    },
    LONG_TEST_MS,
  );

  it('con una sesión guardada, al abrir la app entra directo y restaura una sola vez', async () => {
    installMemorySecureStore({ [REFRESH_TOKEN_KEY]: 'refresh-1' });
    const api = installFakeApi({
      ...baseApi,
      'POST /auth/refresh': () => ok({ tokens: fakeTokens(2) }),
    });
    await renderRouter(APP_DIR);
    expect(await screen.findByRole('tab', { name: es.tabs.home })).toBeTruthy();
    expect(api.calls.filter((call) => call.path === '/auth/refresh')).toHaveLength(1);
  });
});

describe('refresco concurrente (P-03)', () => {
  it('varias peticiones con 401 comparten un solo refresco y se repiten con el token nuevo', async () => {
    installMemorySecureStore({ [REFRESH_TOKEN_KEY]: 'refresh-1' });
    let refreshes = 0;
    const api = installFakeApi({
      ...baseApi,
      'POST /auth/refresh': async () => {
        refreshes += 1;
        for (let turn = 0; turn < 5; turn += 1) await Promise.resolve();
        return ok({ tokens: fakeTokens(2) });
      },
      'GET /me': (req) =>
        req.authorization === 'Bearer access-2' ? ok(fakeUser) : failure(401, 'unauthorized'),
      'GET /items': (req) =>
        req.authorization === 'Bearer access-2'
          ? ok({ items: [], nextCursor: null })
          : failure(401, 'unauthorized'),
    });
    await renderRouter(APP_DIR);
    expect(await screen.findByRole('tab', { name: es.tabs.home })).toBeTruthy();
    const restored = refreshes;
    expect(restored).toBe(1);

    // Se vence el token de acceso en memoria y tres peticiones salen a la vez.
    const { setAccessToken } = jest.requireActual<typeof import('@/lib/api/authInterceptor')>(
      '@/lib/api/authInterceptor',
    );
    setAccessToken('access-vencido');
    api.calls.length = 0;
    const results = await Promise.all([
      request('/me', z.object({ id: z.string() }).passthrough()),
      request('/me', z.object({ id: z.string() }).passthrough()),
      request('/items?limit=6', z.object({ items: z.array(z.unknown()) }).passthrough()),
    ]);

    expect(results).toHaveLength(3);
    expect(refreshes).toBe(restored + 1);
    expect(getAccessToken()).toBe('access-2');
    const retried = api.calls.filter((call) => call.authorization === 'Bearer access-2');
    expect(retried).toHaveLength(3);
  });

  it('si el refresco falla, la sesión termina y se vuelve a inicio de sesión', async () => {
    const store = installMemorySecureStore({ [REFRESH_TOKEN_KEY]: 'refresh-1' });
    installFakeApi({
      ...baseApi,
      'POST /auth/refresh': () => failure(401, 'unauthorized'),
    });
    await renderRouter(APP_DIR);
    await waitFor(() => expect(screen).toHavePathname('/login'));
    expect(store.has(REFRESH_TOKEN_KEY)).toBe(false);
    expect(screen.queryByRole('tab')).toBeNull();
  });
});
