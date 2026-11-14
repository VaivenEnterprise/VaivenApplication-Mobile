import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';
import {
  ANDROID_CHANNEL_ID,
  DISABLED_KEY,
  currentPlatform,
  ensureChannel,
  getExpoToken,
  getPermission,
  getRegisteredToken,
  isPushSupported,
  readFlag,
  registerDevice,
  requestPermission,
  resetPushState,
  unregisterDevice,
  writeFlag,
} from '@/features/notifications/push';
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
let mockProjectId: unknown = 'proj-123';
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return { extra: { eas: { projectId: mockProjectId } } };
    },
  },
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

const setOs = (os: string) =>
  Object.defineProperty(Platform, 'OS', { value: os, configurable: true });

beforeEach(() => {
  mockProjectId = 'proj-123';
  resetPushState();
  setOs('android');
  installMemorySecureStore();
});
afterEach(() => jest.restoreAllMocks());

describe('permisos', () => {
  it.each([
    ['granted', 'granted'],
    ['denied', 'denied'],
    ['undetermined', 'undetermined'],
  ] as const)('lee el permiso %s', async (system, expected) => {
    installFakePush({ permission: system });
    expect(await getPermission()).toBe(expected);
  });

  it('un estado desconocido cuenta como sin decidir', async () => {
    const fake = installFakePush();
    fake.notifications.getPermissionsAsync.mockResolvedValue({ status: 'raro' } as never);
    expect(await getPermission()).toBe('undetermined');
  });

  it('pide el permiso y crea antes el canal de Android', async () => {
    const fake = installFakePush({ permission: 'undetermined' });
    expect(await requestPermission()).toBe('granted');
    const channel = fake.notifications.setNotificationChannelAsync.mock.invocationCallOrder[0] ?? 0;
    const request = fake.notifications.requestPermissionsAsync.mock.invocationCallOrder[0] ?? 0;
    expect(channel).toBeLessThan(request);
  });

  it('devuelve denegado si la persona lo niega', async () => {
    installFakePush({ permission: 'undetermined', grantOnRequest: false });
    expect(await requestPermission()).toBe('denied');
  });
});

describe('canal y plataforma', () => {
  it('crea el canal «Vaivén» con importancia alta en Android', async () => {
    const fake = installFakePush();
    await ensureChannel();
    expect(fake.notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      ANDROID_CHANNEL_ID,
      { name: 'Vaivén', importance: AndroidImportance.HIGH },
    );
  });

  it('en iOS no crea canal', async () => {
    setOs('ios');
    const fake = installFakePush();
    await ensureChannel();
    expect(fake.notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
    expect(currentPlatform()).toBe('ios');
  });

  it('un fallo al crear el canal no interrumpe', async () => {
    const fake = installFakePush();
    fake.notifications.setNotificationChannelAsync.mockRejectedValue(new Error('x'));
    await expect(ensureChannel()).resolves.toBeUndefined();
  });

  it('reconoce plataforma android y descarta otras', () => {
    expect(currentPlatform()).toBe('android');
    setOs('web');
    expect(currentPlatform()).toBeNull();
  });

  it('en emulador no hay push (P-08)', () => {
    installFakePush({ isDevice: false });
    expect(isPushSupported()).toBe(false);
  });
});

describe('token', () => {
  it('pide el token con el projectId de la configuración (P-02)', async () => {
    const fake = installFakePush();
    expect(await getExpoToken()).toBe(PUSH_TOKEN);
    expect(fake.notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({
      projectId: 'proj-123',
    });
  });

  it.each([[undefined], [''], [42]])(
    'sin projectId válido (%s) no pide el token',
    async (value) => {
      mockProjectId = value;
      const fake = installFakePush();
      expect(await getExpoToken()).toBeNull();
      expect(fake.notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
    },
  );

  it('un token vacío cuenta como sin token', async () => {
    const fake = installFakePush();
    fake.notifications.getExpoPushTokenAsync.mockResolvedValue({ data: '', type: 'expo' } as never);
    expect(await getExpoToken()).toBeNull();
  });

  it('devuelve null si no se puede obtener', async () => {
    installFakePush({ token: null });
    expect(await getExpoToken()).toBeNull();
  });

  it('registerDevice lo envía al servidor y lo recuerda', async () => {
    installFakePush();
    const api = installFakeApi({ 'POST /me/push-tokens': () => ({ status: 204 }) });
    expect(await registerDevice()).toBe(true);
    expect(api.calls[0]?.body).toEqual({ token: PUSH_TOKEN, platform: 'android' });
    expect(getRegisteredToken()).toBe(PUSH_TOKEN);
  });

  it('registerDevice sin token no llama al servidor', async () => {
    installFakePush({ token: null });
    const api = installFakeApi({});
    expect(await registerDevice()).toBe(false);
    expect(api.calls).toHaveLength(0);
  });

  it('registerDevice en una plataforma sin push devuelve false', async () => {
    setOs('web');
    installFakePush();
    expect(await registerDevice()).toBe(false);
  });

  it('registerDevice propaga un fallo del servidor', async () => {
    installFakePush();
    installFakeApi({
      'POST /me/push-tokens': () => ({
        status: 500,
        body: { error: { code: 'internal_error', message: 'x' } },
      }),
    });
    await expect(registerDevice()).rejects.toMatchObject({ status: 500 });
    expect(getRegisteredToken()).toBeNull();
  });

  it('unregisterDevice elimina el token registrado (CA-06)', async () => {
    installFakePush();
    const api = installFakeApi({
      'POST /me/push-tokens': () => ({ status: 204 }),
      'DELETE /me/push-tokens': () => ({ status: 204 }),
    });
    await registerDevice();
    await unregisterDevice();
    expect(api.calls.at(-1)).toMatchObject({ method: 'DELETE', body: { token: PUSH_TOKEN } });
    expect(getRegisteredToken()).toBeNull();
  });

  it('unregisterDevice sin registro previo pide el token y lo elimina', async () => {
    installFakePush();
    const api = installFakeApi({ 'DELETE /me/push-tokens': () => ({ status: 204 }) });
    await unregisterDevice();
    expect(api.calls[0]?.body).toEqual({ token: PUSH_TOKEN });
  });

  it('unregisterDevice en emulador no hace nada', async () => {
    installFakePush({ isDevice: false });
    const api = installFakeApi({});
    await unregisterDevice();
    expect(api.calls).toHaveLength(0);
  });

  it('unregisterDevice ignora un fallo del servidor', async () => {
    installFakePush();
    installFakeApi({
      'POST /me/push-tokens': () => ({ status: 204 }),
      'DELETE /me/push-tokens': () => ({
        status: 500,
        body: { error: { code: 'internal_error', message: 'x' } },
      }),
    });
    await registerDevice();
    await expect(unregisterDevice()).resolves.toBeUndefined();
    expect(getRegisteredToken()).toBeNull();
  });
});

describe('marcas guardadas', () => {
  it('escribe, lee y borra una marca', async () => {
    expect(await readFlag(DISABLED_KEY)).toBe(false);
    await writeFlag(DISABLED_KEY, true);
    expect(await readFlag(DISABLED_KEY)).toBe(true);
    await writeFlag(DISABLED_KEY, false);
    expect(await readFlag(DISABLED_KEY)).toBe(false);
  });
});
