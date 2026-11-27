/// <reference types="node" />
import { fireEvent, renderRouter, screen, testRouter, waitFor } from 'expo-router/testing-library';
import path from 'node:path';
import { REFRESH_TOKEN_KEY } from '@/features/auth/session';
import { es } from '@/i18n/es-MX';
import { resetAuthInterceptor } from '@/lib/api/authInterceptor';
import {
  fakeTokens,
  fakeUser,
  installFakeApi,
  installMemorySecureStore,
  ok,
  type FakeHandler,
} from '@/test/fakeApi';
import { fakeCategories, fakeItem } from '@/test/fakeItems';

// Spec 021-T037 (RF-35, CA-17, defecto F-2): editar un objeto propio con el árbol real de rutas.

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
  configResult: { ok: true, config: { apiBaseUrl: 'http://api.test', appEnv: 'development' } },
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.setTimeout(120_000);

const APP_DIR = path.resolve(__dirname, '..', '..', 'app');
const t = es.items;

async function openApp() {
  let item = fakeItem();
  installMemorySecureStore({ [REFRESH_TOKEN_KEY]: 'refresh-1' });
  const handlers: Record<string, FakeHandler> = {
    'POST /auth/refresh': () => ok({ tokens: fakeTokens(2) }),
    'GET /me': () => ok(fakeUser),
    'GET /items': () => ok({ items: [], nextCursor: null }),
    'GET /me/items': () => ok({ items: [item], nextCursor: null }),
    [`GET /items/${item.id}`]: () => ok(item),
    [`PATCH /items/${item.id}`]: (r) => {
      item = { ...item, ...(r.body as object), version: item.version + 1 };
      return ok(item);
    },
    'GET /categories': () => ok(fakeCategories),
    'GET /me/bookings': () => ok({ items: [], nextCursor: null }),
    'GET /conversations/unread-count': () => ok({ count: 0 }),
    'GET /me/notifications/unread-count': () => ok({ count: 0 }),
  };
  const api = installFakeApi(handlers);
  await renderRouter(APP_DIR);
  await waitFor(() => expect(screen.getAllByRole('tab').length).toBeGreaterThan(0));
  return { api, id: item.id };
}

beforeEach(() => resetAuthInterceptor());
afterEach(() => jest.restoreAllMocks());

describe('editar un objeto propio de punta a punta (spec 021-T037)', () => {
  it('detalle → Editar → Guardar envía PATCH y vuelve al detalle con el cambio', async () => {
    const { api, id } = await openApp();
    await testRouter.navigate(`/objeto/${id}`);
    await fireEvent.press(await screen.findByRole('button', { name: t.owner.edit }));
    const title = await screen.findByLabelText(t.form.title);
    await fireEvent.changeText(title, 'Taladro percutor 800 W');
    await fireEvent.press(screen.getByRole('button', { name: t.form.save }));

    await waitFor(() => expect(api.calls.some((c) => c.method === 'PATCH')).toBe(true));
    expect(api.calls.find((c) => c.method === 'PATCH')?.body).toEqual({
      version: 1,
      title: 'Taladro percutor 800 W',
    });
    await waitFor(() => expect(screen).toHavePathname(`/objeto/${id}`), { timeout: 8000 });
    expect(await screen.findByText('Taladro percutor 800 W')).toBeTruthy();
  });

  it('«Volver» desde la edición regresa al detalle y la pestaña no se queda en la edición', async () => {
    const { id } = await openApp();
    await testRouter.navigate('/mis-objetos');
    await testRouter.navigate(`/objeto/${id}`);
    await fireEvent.press(await screen.findByRole('button', { name: t.owner.edit }));
    await screen.findByLabelText(t.form.title);
    await fireEvent.press(screen.getByRole('button', { name: es.common.back }));
    await waitFor(() => expect(screen).toHavePathname(`/objeto/${id}`), { timeout: 8000 });
    await testRouter.navigate('/mis-objetos');
    await waitFor(() => expect(screen).toHavePathname('/mis-objetos'));
    expect(screen.queryByLabelText(t.form.title)).toBeNull();
  });
});
