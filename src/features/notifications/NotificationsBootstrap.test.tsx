import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { runBeforeSignOut } from '@/features/auth/signOutHooks';
import {
  BANNER_VISIBLE_MS,
  NotificationsBootstrap,
} from '@/features/notifications/NotificationsBootstrap';
import { resetPushState } from '@/features/notifications/push';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { installFakeApi, installMemorySecureStore, ok } from '@/test/fakeApi';
import { PUSH_TOKEN, installFakePush } from '@/test/fakePush';

const mockPush = jest.fn();
let mockPath = '/inicio';
let mockStatus: 'signedIn' | 'signedOut' = 'signedIn';
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPath,
}));
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
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({ status: mockStatus, user: null }),
}));
jest.setTimeout(30_000);

const t = es.notifications;
const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 24, left: 0, right: 0, bottom: 0 },
};
const BOOKING = { bookingId: 'b1' };
const API = {
  'POST /me/push-tokens': () => ({ status: 204 }),
  'DELETE /me/push-tokens': () => ({ status: 204 }),
  'GET /me/notifications/unread-count': () => ok({ count: 0 }),
};

async function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <QueryClientProvider client={client}>
        <NotificationsBootstrap />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
  return { client, ...view };
}

beforeEach(() => {
  mockPush.mockReset();
  mockPath = '/inicio';
  mockStatus = 'signedIn';
  resetPushState();
  installMemorySecureStore({ 'vaiven.push.primerSeen': '1' });
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('NotificationsBootstrap — toques', () => {
  it('CA-02: con la app cerrada, el último toque abre el destino al arrancar', async () => {
    const push = installFakePush({ permission: 'granted' });
    installFakeApi(API);
    push.setLastResponse({ data: BOOKING }, 'cold');
    await mount();
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith(routes.booking('b1')));
    expect(push.notifications.clearLastNotificationResponse).toHaveBeenCalled();
  });

  it('un toque con la app abierta abre el destino y no se repite el mismo', async () => {
    const push = installFakePush({ permission: 'granted' });
    installFakeApi(API);
    await mount();
    await act(async () => push.emitResponse({ data: { conversationId: 'c1' } }, 'same'));
    await act(async () => push.emitResponse({ data: { conversationId: 'c1' } }, 'same'));
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(routes.chat('c1'));
  });

  it('sin destino en `data` abre el centro de avisos', async () => {
    const push = installFakePush({ permission: 'granted' });
    installFakeApi(API);
    await mount();
    await act(async () => push.emitResponse({ data: {} }, 'empty'));
    expect(mockPush).toHaveBeenCalledWith(routes.notifications);
  });

  it('sin sesión no escucha nada', async () => {
    const push = installFakePush({ permission: 'granted' });
    mockStatus = 'signedOut';
    installFakeApi(API);
    await mount();
    expect(push.hasReceivedListener()).toBe(false);
  });
});

describe('NotificationsBootstrap — aviso flotante', () => {
  it('RF-04: muestra el banner, abre el destino al tocarlo y se cierra', async () => {
    const push = installFakePush({ permission: 'granted' });
    installFakeApi(API);
    await mount();
    await act(async () =>
      push.emitReceived({
        title: 'Solicitud nueva',
        body: 'Beto quiere tu taladro',
        data: BOOKING,
      }),
    );
    const banner = await screen.findByLabelText(/Solicitud nueva\. Beto quiere tu taladro/);
    await fireEvent.press(banner);
    expect(mockPush).toHaveBeenCalledWith(routes.booking('b1'));
    expect(screen.queryByLabelText(/Solicitud nueva/)).toBeNull();
  });

  it('se oculta solo a los 4 s', async () => {
    const push = installFakePush({ permission: 'granted' });
    installFakeApi(API);
    await mount();
    jest.useFakeTimers();
    await act(async () => push.emitReceived({ title: 'Mensaje nuevo', body: 'Hola', data: {} }));
    expect(screen.getByLabelText(/Mensaje nuevo/)).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(BANNER_VISIBLE_MS + 10);
    });
    expect(screen.queryByLabelText(/Mensaje nuevo/)).toBeNull();
  });

  it('la «X» lo cierra', async () => {
    const push = installFakePush({ permission: 'granted' });
    installFakeApi(API);
    await mount();
    await act(async () => push.emitReceived({ title: 'Mensaje nuevo', body: 'Hola', data: {} }));
    await fireEvent.press(await screen.findByRole('button', { name: t.banner.dismiss }));
    expect(screen.queryByLabelText(/Mensaje nuevo/)).toBeNull();
  });

  it('no aparece durante el escaneo de QR', async () => {
    const push = installFakePush({ permission: 'granted' });
    installFakeApi(API);
    mockPath = '/escanear';
    await mount();
    await act(async () => push.emitReceived({ title: 'Mensaje nuevo', body: 'Hola', data: {} }));
    expect(screen.queryByLabelText(/Mensaje nuevo/)).toBeNull();
  });

  it('una push recibida refresca el conteo de no leídos', async () => {
    const push = installFakePush({ permission: 'granted' });
    installFakeApi(API);
    const { client } = await mount();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    await act(async () => push.emitReceived({ title: 'x', body: 'y', data: {} }));
    expect(invalidate).toHaveBeenCalled();
  });
});

describe('NotificationsBootstrap — pantalla previa y token', () => {
  it('con el permiso sin decidir muestra la pantalla previa una sola vez', async () => {
    installFakePush({ permission: 'undetermined' });
    installMemorySecureStore();
    installFakeApi(API);
    await mount();
    expect(await screen.findByText(t.primer.title)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: t.primer.later }));
    await waitFor(() => expect(screen.queryByText(t.primer.title)).toBeNull());
  });

  it('«Activar avisos» pide el permiso y registra el token', async () => {
    installFakePush({ permission: 'undetermined', grantOnRequest: true });
    installMemorySecureStore();
    const api = installFakeApi(API);
    await mount();
    await fireEvent.press(await screen.findByRole('button', { name: t.primer.enable }));
    await waitFor(() =>
      expect(
        api.calls.find((c) => c.method === 'POST' && c.path === '/me/push-tokens')?.body,
      ).toMatchObject({ token: PUSH_TOKEN }),
    );
  });

  it('CA-06: al cerrar sesión se da de baja el token antes de salir', async () => {
    installFakePush({ permission: 'granted' });
    const api = installFakeApi(API);
    await mount();
    await waitFor(() =>
      expect(api.calls.some((c) => c.method === 'POST' && c.path === '/me/push-tokens')).toBe(true),
    );
    await runBeforeSignOut();
    const del = api.calls.find((c) => c.method === 'DELETE' && c.path === '/me/push-tokens');
    expect(del).toBeDefined();
    expect(del?.body).toEqual({ token: PUSH_TOKEN });
  });

  it('al desmontar se retira el gancho de cierre de sesión', async () => {
    installFakePush({ permission: 'granted' });
    const api = installFakeApi(API);
    const view = await mount();
    await waitFor(() => expect(api.calls.some((c) => c.method === 'POST')).toBe(true));
    await view.unmount();
    await runBeforeSignOut();
    expect(api.calls.some((c) => c.method === 'DELETE')).toBe(false);
  });
});
