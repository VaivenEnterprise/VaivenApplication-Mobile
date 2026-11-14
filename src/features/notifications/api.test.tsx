import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import {
  deletePushToken,
  fetchNotifications,
  fetchUnreadCount,
  markNotificationsRead,
  registerPushToken,
} from '@/features/notifications/api';
import {
  useMarkNotificationsRead,
  useNotifications,
  useUnreadCount,
  useUnreadNotifications,
} from '@/features/notifications/hooks';
import { notificationsKeys } from '@/features/notifications/keys';
import { failure, installFakeApi, ok } from '@/test/fakeApi';
import { fakeNotification, fakeNotificationPage } from '@/test/fakeNotifications';

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
let mockFocused = true;
jest.mock('expo-router', () => ({ useIsFocused: () => mockFocused }));
jest.setTimeout(30_000);

beforeEach(() => {
  mockFocused = true;
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

const LIST = 'GET /me/notifications';
const COUNT = 'GET /me/notifications/unread-count';
const READ = 'POST /me/notifications/read';

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, Wrapper };
}

describe('api de avisos', () => {
  it('fetchNotifications pide una página con límite y cursor', async () => {
    const api = installFakeApi({
      [LIST]: () => ok(fakeNotificationPage([fakeNotification()], 'c2')),
    });
    const page = await fetchNotifications('c1');
    expect(page.nextCursor).toBe('c2');
    expect(page.items[0]?.type).toBe('booking_accepted');
    expect(api.calls[0]?.query).toBe('limit=20&cursor=c1');
  });

  it('fetchNotifications sin cursor no lo envía', async () => {
    const api = installFakeApi({ [LIST]: () => ok(fakeNotificationPage()) });
    await fetchNotifications(null);
    expect(api.calls[0]?.query).toBe('limit=20');
  });

  it('una respuesta que no cumple el esquema es invalid_response', async () => {
    installFakeApi({ [LIST]: () => ok({ items: 'x' }) });
    await expect(fetchNotifications(null)).rejects.toMatchObject({ code: 'invalid_response' });
  });

  it('un tipo de aviso desconocido no invalida la página', async () => {
    installFakeApi({
      [LIST]: () => ok(fakeNotificationPage([fakeNotification({ type: 'tipo_nuevo' })])),
    });
    const page = await fetchNotifications(null);
    expect(page.items[0]?.type).toBe('tipo_nuevo');
  });

  it('fetchUnreadCount devuelve el número', async () => {
    installFakeApi({ [COUNT]: () => ok({ count: 3 }) });
    expect(await fetchUnreadCount()).toBe(3);
  });

  it('markNotificationsRead envía ids o all', async () => {
    const api = installFakeApi({ [READ]: () => ({ status: 204 }) });
    await markNotificationsRead({ ids: ['a', 'b'] });
    await markNotificationsRead({ all: true });
    expect(api.calls.map((call) => call.body)).toEqual([{ ids: ['a', 'b'] }, { all: true }]);
  });

  it('registerPushToken y deletePushToken usan /me/push-tokens', async () => {
    const api = installFakeApi({
      'POST /me/push-tokens': () => ({ status: 204 }),
      'DELETE /me/push-tokens': () => ({ status: 204 }),
    });
    await registerPushToken('ExponentPushToken[abc]', 'android');
    await deletePushToken('ExponentPushToken[abc]');
    expect(api.calls[0]).toMatchObject({
      method: 'POST',
      body: { token: 'ExponentPushToken[abc]', platform: 'android' },
    });
    expect(api.calls[1]).toMatchObject({
      method: 'DELETE',
      body: { token: 'ExponentPushToken[abc]' },
    });
  });

  it('un 401 en el conteo llega como ApiError', async () => {
    installFakeApi({ [COUNT]: () => failure(401, 'unauthorized') });
    await expect(fetchUnreadCount()).rejects.toMatchObject({ status: 401 });
  });
});

describe('hooks de avisos', () => {
  it('useNotifications pagina por cursor', async () => {
    const api = installFakeApi({
      [LIST]: ({ query }) =>
        ok(
          query.includes('cursor=c2')
            ? fakeNotificationPage([fakeNotification({ id: 'n2' })], null)
            : fakeNotificationPage([fakeNotification({ id: 'n1' })], 'c2'),
        ),
    });
    const { Wrapper } = wrapper();
    const { result } = await renderHook(() => useNotifications(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(1));
    expect(result.current.hasNextPage).toBe(true);
    await act(async () => {
      await result.current.fetchNextPage();
    });
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    expect(result.current.hasNextPage).toBe(false);
    expect(api.calls).toHaveLength(2);
  });

  it('useMarkNotificationsRead con ids marca solo esos avisos y pide el conteo de nuevo', async () => {
    let count = 2;
    installFakeApi({
      [LIST]: () =>
        ok(fakeNotificationPage([fakeNotification({ id: 'n1' }), fakeNotification({ id: 'n2' })])),
      [COUNT]: () => ok({ count }),
      [READ]: () => {
        count = 1;
        return { status: 204 };
      },
    });
    const { Wrapper } = wrapper();
    const list = await renderHook(() => useNotifications(), { wrapper: Wrapper });
    const unread = await renderHook(() => useUnreadCount(), { wrapper: Wrapper });
    const mark = await renderHook(() => useMarkNotificationsRead(), { wrapper: Wrapper });
    await waitFor(() => expect(list.result.current.data).toBeDefined());
    await waitFor(() => expect(unread.result.current.data).toBe(2));
    await act(async () => {
      await mark.result.current.mutateAsync({ ids: ['n1'] });
    });
    const items = list.result.current.data?.pages[0]?.items ?? [];
    expect(items.find((n) => n.id === 'n1')?.readAt).not.toBeNull();
    expect(items.find((n) => n.id === 'n2')?.readAt).toBeNull();
    await waitFor(() => expect(unread.result.current.data).toBe(1));
  });

  it('useMarkNotificationsRead con all marca todos', async () => {
    installFakeApi({
      [LIST]: () =>
        ok(fakeNotificationPage([fakeNotification({ id: 'n1' }), fakeNotification({ id: 'n2' })])),
      [COUNT]: () => ok({ count: 0 }),
      [READ]: () => ({ status: 204 }),
    });
    const { Wrapper } = wrapper();
    const list = await renderHook(() => useNotifications(), { wrapper: Wrapper });
    const mark = await renderHook(() => useMarkNotificationsRead(), { wrapper: Wrapper });
    await waitFor(() => expect(list.result.current.data).toBeDefined());
    await act(async () => {
      await mark.result.current.mutateAsync({ all: true });
    });
    await waitFor(() => {
      const items = list.result.current.data?.pages[0]?.items ?? [];
      expect(items.every((n) => n.readAt !== null)).toBe(true);
    });
  });

  it('un fallo al marcar vuelve a pedir los avisos', async () => {
    const api = installFakeApi({
      [LIST]: () => ok(fakeNotificationPage()),
      [READ]: () => failure(500, 'internal_error'),
    });
    const { Wrapper, client } = wrapper();
    const list = await renderHook(() => useNotifications(), { wrapper: Wrapper });
    const mark = await renderHook(() => useMarkNotificationsRead(), { wrapper: Wrapper });
    await waitFor(() => expect(list.result.current.data).toBeDefined());
    const before = api.calls.length;
    await act(async () => {
      await mark.result.current.mutateAsync({ all: true }).catch(() => undefined);
    });
    await waitFor(() => expect(api.calls.length).toBeGreaterThan(before + 1));
    expect(client.getQueryState(notificationsKeys.list)).toBeDefined();
  });

  it('useUnreadNotifications renueva el conteo cada 60 s solo en primer plano', async () => {
    jest.useFakeTimers();
    let count = 1;
    const api = installFakeApi({ [COUNT]: () => ok({ count }) });
    const { Wrapper } = wrapper();
    const view = await renderHook(() => useUnreadNotifications(), { wrapper: Wrapper });
    const { result } = view;
    await act(async () => {
      await jest.advanceTimersByTimeAsync(10);
    });
    expect(result.current).toBe(1);
    expect(api.calls).toHaveLength(1);
    count = 4;
    await act(async () => {
      await jest.advanceTimersByTimeAsync(60_000);
    });
    expect(result.current).toBe(4);
    expect(api.calls).toHaveLength(2);
    mockFocused = false;
    await view.rerender(undefined);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(10);
    });
    const afterBlur = api.calls.length;
    await act(async () => {
      await jest.advanceTimersByTimeAsync(120_000);
    });
    expect(api.calls).toHaveLength(afterBlur);
  });

  it('useUnreadNotifications devuelve 0 mientras no hay dato o si falla', async () => {
    installFakeApi({ [COUNT]: () => failure(500, 'internal_error') });
    const { Wrapper } = wrapper();
    const { result } = await renderHook(() => useUnreadNotifications(), { wrapper: Wrapper });
    expect(result.current).toBe(0);
  });
});
