import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import type { ReactNode } from 'react';
import {
  DISABLED_KEY,
  PRIMER_SEEN_KEY,
  getRegisteredToken,
  resetPushState,
} from '@/features/notifications/push';
import {
  usePush,
  usePushPrimer,
  useRegisterWhenOn,
  type PushStatus,
} from '@/features/notifications/usePushRegistration';
import { installFakeApi, installMemorySecureStore } from '@/test/fakeApi';
import { PUSH_TOKEN, installFakePush } from '@/test/fakePush';

jest.mock('expo-notifications', () => ({
  AndroidImportance: { HIGH: 4 },
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  getLastNotificationResponse: jest.fn(),
  clearLastNotificationResponse: jest.fn(),
}));
jest.mock('expo-device', () => ({ isDevice: true }));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { eas: { projectId: 'proj-123' } } } },
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
jest.setTimeout(30_000);

const POST = 'POST /me/push-tokens';
const DELETE = 'DELETE /me/push-tokens';

beforeEach(() => {
  resetPushState();
  Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
});
afterEach(() => jest.restoreAllMocks());

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, Wrapper };
}

async function status(): Promise<PushStatus | null> {
  const { Wrapper } = wrapper();
  const { result } = await renderHook(() => usePush(), { wrapper: Wrapper });
  await waitFor(() => expect(result.current.status).not.toBeNull());
  return result.current.status;
}

describe('estado de los avisos push', () => {
  it('en emulador no están disponibles (P-08)', async () => {
    installFakePush({ isDevice: false });
    installMemorySecureStore();
    expect(await status()).toBe('unavailable');
  });

  it('con el permiso negado están desactivados (CA-03)', async () => {
    installFakePush({ permission: 'denied' });
    installMemorySecureStore();
    expect(await status()).toBe('denied');
  });

  it('sin decidir el permiso queda «undetermined»', async () => {
    installFakePush({ permission: 'undetermined' });
    installMemorySecureStore();
    expect(await status()).toBe('undetermined');
  });

  it('con permiso concedido están activados', async () => {
    installFakePush({ permission: 'granted' });
    installMemorySecureStore();
    expect(await status()).toBe('on');
  });

  it('con permiso concedido pero apagados por la persona están desactivados', async () => {
    installFakePush({ permission: 'granted' });
    installMemorySecureStore({ [DISABLED_KEY]: '1' });
    expect(await status()).toBe('off');
  });

  it('relee el permiso al volver a la app (cambió en los ajustes del teléfono)', async () => {
    const fake = installFakePush({ permission: 'denied' });
    installMemorySecureStore();
    let handler: ((state: AppStateStatus) => void) | null = null;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      handler = listener;
      return { remove: jest.fn() } as unknown as ReturnType<typeof AppState.addEventListener>;
    });
    const { Wrapper } = wrapper();
    const { result } = await renderHook(() => usePush(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.status).toBe('denied'));
    fake.setPermission('granted');
    await act(async () => {
      handler?.('active');
    });
    await waitFor(() => expect(result.current.status).toBe('on'));
  });
});

describe('activar', () => {
  it('pide el permiso, registra el token y deja activado', async () => {
    installFakePush({ permission: 'undetermined' });
    const store = installMemorySecureStore({ [DISABLED_KEY]: '1' });
    const api = installFakeApi({ [POST]: () => ({ status: 204 }) });
    const { Wrapper } = wrapper();
    const { result } = await renderHook(() => usePush(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.status).toBe('undetermined'));
    let enabled = false;
    await act(async () => {
      enabled = await result.current.enable();
    });
    expect(enabled).toBe(true);
    await waitFor(() => expect(result.current.status).toBe('on'));
    expect(api.calls[0]?.body).toEqual({ token: PUSH_TOKEN, platform: 'android' });
    expect(getRegisteredToken()).toBe(PUSH_TOKEN);
    expect(store.get(PRIMER_SEEN_KEY)).toBe('1');
    expect(store.has(DISABLED_KEY)).toBe(false);
  });

  it('si la persona niega el permiso queda desactivado y no hay registro (CA-03)', async () => {
    installFakePush({ permission: 'undetermined', grantOnRequest: false });
    const store = installMemorySecureStore();
    const api = installFakeApi({ [POST]: () => ({ status: 204 }) });
    const { Wrapper } = wrapper();
    const { result } = await renderHook(() => usePush(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.status).toBe('undetermined'));
    let enabled = true;
    await act(async () => {
      enabled = await result.current.enable();
    });
    expect(enabled).toBe(false);
    await waitFor(() => expect(result.current.status).toBe('denied'));
    expect(result.current.failed).toBe(false);
    expect(api.calls).toHaveLength(0);
    expect(store.get(PRIMER_SEEN_KEY)).toBe('1');
  });

  it('si no se puede obtener el token lo informa sin romper la app', async () => {
    installFakePush({ permission: 'granted', token: null });
    installMemorySecureStore();
    installFakeApi({});
    const { Wrapper } = wrapper();
    const { result } = await renderHook(() => usePush(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.status).toBe('on'));
    let enabled = true;
    await act(async () => {
      enabled = await result.current.enable();
    });
    expect(enabled).toBe(false);
    await waitFor(() => expect(result.current.failed).toBe(true));
    expect(result.current.status).toBe('on');
  });

  it('en emulador no hace nada', async () => {
    installFakePush({ isDevice: false });
    installMemorySecureStore();
    const api = installFakeApi({});
    const { Wrapper } = wrapper();
    const { result } = await renderHook(() => usePush(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.status).toBe('unavailable'));
    let enabled = true;
    await act(async () => {
      enabled = await result.current.enable();
    });
    expect(enabled).toBe(false);
    expect(api.calls).toHaveLength(0);
  });
});

describe('desactivar', () => {
  it('elimina el token del servidor y recuerda que se apagó', async () => {
    installFakePush({ permission: 'granted' });
    const store = installMemorySecureStore();
    const api = installFakeApi({
      [POST]: () => ({ status: 204 }),
      [DELETE]: () => ({ status: 204 }),
    });
    const { Wrapper } = wrapper();
    const { result } = await renderHook(() => usePush(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.status).toBe('on'));
    await act(async () => {
      await result.current.enable();
    });
    await act(async () => {
      await result.current.disable();
    });
    await waitFor(() => expect(result.current.status).toBe('off'));
    expect(api.calls.at(-1)).toMatchObject({ method: 'DELETE', body: { token: PUSH_TOKEN } });
    expect(store.get(DISABLED_KEY)).toBe('1');
  });

  it('un fallo al apagar deja el interruptor como estaba', async () => {
    installFakePush({ permission: 'granted' });
    const store = installMemorySecureStore();
    const secure = jest.requireMock('expo-secure-store') as { setItemAsync: jest.Mock };
    secure.setItemAsync.mockRejectedValue(new Error('almacén caído'));
    installFakeApi({ [DELETE]: () => ({ status: 204 }) });
    const { Wrapper } = wrapper();
    const { result } = await renderHook(() => usePush(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.status).toBe('on'));
    await act(async () => {
      await result.current.disable();
    });
    expect(store.has(DISABLED_KEY)).toBe(false);
  });
});

describe('pantalla previa', () => {
  const render = async (initial: PushStatus | null) => {
    const { Wrapper } = wrapper();
    return renderHook(({ s }: { s: PushStatus | null }) => usePushPrimer(s), {
      wrapper: Wrapper,
      initialProps: { s: initial },
    });
  };

  it('se ofrece una vez cuando el permiso está sin decidir', async () => {
    installMemorySecureStore();
    const { result } = await render('undetermined');
    await waitFor(() => expect(result.current.visible).toBe(true));
  });

  it('no se ofrece si ya se vio (P-03)', async () => {
    installMemorySecureStore({ [PRIMER_SEEN_KEY]: '1' });
    const { result } = await render('undetermined');
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.visible).toBe(false);
  });

  it.each<PushStatus | null>(['denied', 'on', 'off', 'unavailable', null])(
    'no se ofrece con el estado %s',
    async (state) => {
      installMemorySecureStore();
      const { result } = await render(state);
      await act(async () => {
        await Promise.resolve();
      });
      expect(result.current.visible).toBe(false);
    },
  );

  it('«Ahora no» la oculta y lo recuerda', async () => {
    const store = installMemorySecureStore();
    const { result } = await render('undetermined');
    await waitFor(() => expect(result.current.visible).toBe(true));
    await act(async () => {
      result.current.dismiss();
    });
    await waitFor(() => expect(result.current.visible).toBe(false));
    await waitFor(() => expect(store.get(PRIMER_SEEN_KEY)).toBe('1'));
  });
});

describe('registro al iniciar', () => {
  it('registra el token una vez cuando los avisos están activados', async () => {
    installFakePush({ permission: 'granted' });
    installMemorySecureStore();
    const api = installFakeApi({ [POST]: () => ({ status: 204 }) });
    const { Wrapper } = wrapper();
    const view = await renderHook(({ s }: { s: PushStatus | null }) => useRegisterWhenOn(s), {
      wrapper: Wrapper,
      initialProps: { s: 'on' as PushStatus | null },
    });
    await waitFor(() => expect(api.calls).toHaveLength(1));
    await view.rerender({ s: 'on' });
    expect(api.calls).toHaveLength(1);
  });

  it.each<PushStatus | null>(['off', 'denied', 'undetermined', 'unavailable', null])(
    'no registra con el estado %s',
    async (state) => {
      installFakePush({ permission: 'granted' });
      installMemorySecureStore();
      const api = installFakeApi({ [POST]: () => ({ status: 204 }) });
      const { Wrapper } = wrapper();
      await renderHook(() => useRegisterWhenOn(state), { wrapper: Wrapper });
      await act(async () => {
        await Promise.resolve();
      });
      expect(api.calls).toHaveLength(0);
    },
  );

  it('un fallo de red al registrar no rompe nada', async () => {
    installFakePush({ permission: 'granted' });
    installMemorySecureStore();
    installFakeApi({
      [POST]: () => ({ status: 500, body: { error: { code: 'internal_error', message: 'x' } } }),
    });
    const { Wrapper } = wrapper();
    await renderHook(() => useRegisterWhenOn('on'), { wrapper: Wrapper });
    await act(async () => {
      await Promise.resolve();
    });
    expect(getRegisteredToken()).toBeNull();
  });
});
