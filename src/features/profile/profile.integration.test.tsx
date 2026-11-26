/// <reference types="node" />
import { fireEvent, renderRouter, screen, testRouter, waitFor } from 'expo-router/testing-library';
import path from 'node:path';
import { REFRESH_TOKEN_KEY } from '@/features/auth/session';
import { es } from '@/i18n/es-MX';
import { resetAuthInterceptor } from '@/lib/api/authInterceptor';
import {
  failure,
  fakeTokens,
  fakeUser,
  installFakeApi,
  installMemorySecureStore,
  ok,
  type FakeHandler,
} from '@/test/fakeApi';

// Spec 016 · T006 (RF-05): perfil de punta a punta — editar el perfil y eliminar la cuenta
// con el árbol completo de la app y la API simulada.

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
  configResult: { ok: true, config: { apiBaseUrl: 'http://api.test', appEnv: 'development' } },
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Con cobertura, el primer montaje del árbol completo de la app tarda más de 5 s en frío.
jest.setTimeout(120_000);

const APP_DIR = path.resolve(__dirname, '..', '..', 'app');
const t = es.profile;

const baseHandlers = (): Record<string, FakeHandler> => ({
  'POST /auth/refresh': () => ok({ tokens: fakeTokens(2) }),
  'GET /me': () => ok(fakeUser),
  'GET /items': () => ok({ items: [], nextCursor: null }),
  'GET /categories': () => ok([]),
  'GET /me/bookings': () => ok({ items: [], nextCursor: null }),
  'GET /conversations/unread-count': () => ok({ count: 0 }),
  'GET /me/notifications/unread-count': () => ok({ count: 0 }),
});

async function openApp(extra: Record<string, FakeHandler>) {
  installMemorySecureStore({ [REFRESH_TOKEN_KEY]: 'refresh-1' });
  const api = installFakeApi({ ...baseHandlers(), ...extra });
  await renderRouter(APP_DIR);
  await waitFor(() => expect(screen.getAllByRole('tab').length).toBeGreaterThan(0));
  return api;
}

beforeEach(() => resetAuthInterceptor());
afterEach(() => jest.restoreAllMocks());

async function openDeleteSheet(password: string) {
  await testRouter.navigate('/perfil');
  await fireEvent.press(await screen.findByRole('button', { name: t.deleteAccount }));
  await fireEvent.changeText(await screen.findByLabelText(t.delete.password), password);
  await fireEvent.press(screen.getByRole('button', { name: t.delete.confirm }));
}

describe('perfil de punta a punta (spec 003, RF-05 de 016)', () => {
  it('editar el nombre → PATCH /me → «Guardado» → vuelve al perfil con el nombre nuevo', async () => {
    let name = fakeUser.displayName;
    const api = await openApp({
      'GET /me': () => ok({ ...fakeUser, displayName: name }),
      'PATCH /me': (r) => {
        name = (r.body as { displayName: string }).displayName;
        return ok({ ...fakeUser, displayName: name });
      },
    });
    await testRouter.navigate('/perfil');
    await testRouter.navigate('/perfil/editar');
    const field = await screen.findByLabelText(t.edit.name);
    await fireEvent.changeText(field, 'Ana M.');
    await fireEvent.press(screen.getByRole('button', { name: t.edit.save }));

    await waitFor(() =>
      expect(api.calls.some((c) => c.method === 'PATCH' && c.path === '/me')).toBe(true),
    );
    const patch = api.calls.find((c) => c.method === 'PATCH' && c.path === '/me');
    expect(patch?.body).toMatchObject({ displayName: 'Ana M.' });
    expect(patch?.authorization).toBe('Bearer access-2');
    await waitFor(() => expect(screen).toHavePathname('/perfil'), { timeout: 8000 });
    expect(await screen.findByRole('header', { name: 'Ana M.' })).toBeTruthy();
  });

  it('un teléfono inválido no sale a la red', async () => {
    const api = await openApp({});
    await testRouter.navigate('/perfil/editar');
    await fireEvent.changeText(await screen.findByLabelText(t.edit.phone), '123');
    await fireEvent.press(screen.getByRole('button', { name: t.edit.save }));
    expect(await screen.findByText(t.edit.phoneInvalid)).toBeTruthy();
    expect(api.calls.some((c) => c.method === 'PATCH')).toBe(false);
  });

  it('eliminar la cuenta con contraseña incorrecta (403) se explica y conserva la sesión', async () => {
    const api = await openApp({ 'DELETE /me': () => failure(403, 'forbidden') });
    await openDeleteSheet('equivocada');
    expect(await screen.findByText(t.delete.wrongPassword)).toBeTruthy();
    expect(api.calls.find((c) => c.method === 'DELETE')?.body).toEqual({ password: 'equivocada' });
    expect(api.calls.some((c) => c.path === '/auth/logout')).toBe(false);
    expect(screen.getAllByRole('tab').length).toBeGreaterThan(0);
  });

  it('con reservas activas (409) avisa de operaciones pendientes y conserva la sesión', async () => {
    const api = await openApp({ 'DELETE /me': () => failure(409, 'conflict') });
    await openDeleteSheet('correcta-123');
    expect(await screen.findByText(t.delete.pending)).toBeTruthy();
    expect(api.calls.some((c) => c.path === '/auth/logout')).toBe(false);
    expect(screen.getAllByRole('tab').length).toBeGreaterThan(0);
  });

  it('eliminar la cuenta con la contraseña correcta cierra la sesión y lleva a iniciar sesión', async () => {
    const api = await openApp({
      'DELETE /me': () => ({ status: 204 }),
      'POST /auth/logout': () => ({ status: 204 }),
    });
    await openDeleteSheet('correcta-123');
    await waitFor(() => expect(screen).toHavePathname('/login'), { timeout: 8000 });
    expect(api.calls.find((c) => c.method === 'DELETE')?.body).toEqual({
      password: 'correcta-123',
    });
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
  });
});
