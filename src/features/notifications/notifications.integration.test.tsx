import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ItemRoute from '@/app/objeto/[id]';
import { runBeforeSignOut } from '@/features/auth/signOutHooks';
import { NotificationsBootstrap } from '@/features/notifications/NotificationsBootstrap';
import { resetPushState } from '@/features/notifications/push';
import { NotificationsScreen } from '@/features/notifications/screens/NotificationsScreen';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { installFakeApi, installMemorySecureStore, ok } from '@/test/fakeApi';
import { fakeCategories, fakeItem } from '@/test/fakeItems';
import { fakeNotification, fakeNotificationPage } from '@/test/fakeNotifications';
import { PUSH_TOKEN, installFakePush } from '@/test/fakePush';

// Flujo completo de la spec 011 en el móvil (T011): aviso → destino, registro y baja del token al
// cerrar sesión, y reportar un objeto (CA-01, CA-02, CA-05, CA-06). Las piezas son las reales.

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/inicio',
  useLocalSearchParams: () => ({ id: '6731a2b3c4d5e6f7a8b9c0d1' }),
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
  useSession: () => ({
    status: 'signedIn',
    user: { ...jest.requireActual('@/test/fakeApi').fakeUser, id: 'yo' },
  }),
}));
jest.setTimeout(30_000);

const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 24, left: 0, right: 0, bottom: 0 },
};
const recent = () => new Date(Date.now() - 600_000).toISOString();

function mount(node: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <QueryClientProvider client={client}>{node}</QueryClientProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  mockPush.mockReset();
  resetPushState();
  installMemorySecureStore({ 'vaiven.push.primerSeen': '1' });
});
afterEach(() => jest.restoreAllMocks());

describe('spec 011 — integración móvil', () => {
  it('CA-01 y CA-02: una push abre su destino y el aviso del centro se marca leído y abre lo mismo', async () => {
    const push = installFakePush({ permission: 'granted' });
    let unread = 1;
    const api = installFakeApi({
      'GET /me/notifications': () =>
        ok(
          fakeNotificationPage([
            fakeNotification({
              data: { bookingId: 'b1' },
              createdAt: recent(),
              readAt: unread === 1 ? null : recent(),
            }),
          ]),
        ),
      'GET /me/notifications/unread-count': () => ok({ count: unread }),
      'POST /me/notifications/read': () => {
        unread = 0;
        return { status: 204 };
      },
      'POST /me/push-tokens': () => ({ status: 204 }),
    });
    await mount(
      <>
        <NotificationsBootstrap />
        <NotificationsScreen />
      </>,
    );

    // Llega una push con la app abierta: banner → toque → destino.
    await act(async () =>
      push.emitReceived({
        title: 'Solicitud aceptada',
        body: 'Ana aceptó',
        data: { bookingId: 'b1' },
      }),
    );
    await fireEvent.press(
      await screen.findByRole('alert', { name: /Solicitud aceptada\. Ana aceptó/ }),
    );
    expect(mockPush).toHaveBeenLastCalledWith(routes.booking('b1'));

    // En el centro de avisos el mismo aviso se marca leído y abre el mismo destino.
    await fireEvent.press(await screen.findByLabelText(/^No leído\. Solicitud aceptada/));
    expect(mockPush).toHaveBeenLastCalledWith(routes.booking('b1'));
    await waitFor(() =>
      expect(api.calls.find((c) => c.path === '/me/notifications/read')?.body).toEqual({
        ids: [fakeNotification().id],
      }),
    );
    await waitFor(() => expect(screen.queryByTestId('unread-dot')).toBeNull());
  });

  it('CA-06: registra el token al entrar y lo da de baja antes de cerrar sesión', async () => {
    installFakePush({ permission: 'granted' });
    const api = installFakeApi({
      'GET /me/notifications/unread-count': () => ok({ count: 0 }),
      'POST /me/push-tokens': () => ({ status: 204 }),
      'DELETE /me/push-tokens': () => ({ status: 204 }),
    });
    await mount(<NotificationsBootstrap />);
    await waitFor(() =>
      expect(
        api.calls.find((c) => c.method === 'POST' && c.path === '/me/push-tokens')?.body,
      ).toEqual({
        token: PUSH_TOKEN,
        platform: expect.stringMatching(/^(ios|android)$/),
      }),
    );
    await runBeforeSignOut();
    expect(api.calls.find((c) => c.method === 'DELETE')?.body).toEqual({ token: PUSH_TOKEN });
  });

  it('RF-06 y CA-05: reportar un objeto confirma y un segundo reporte avisa «Ya lo reportaste»', async () => {
    let created = false;
    const api = installFakeApi({
      'GET /categories': () => ok(fakeCategories),
      [`GET /items/${fakeItem().id}`]: () => ok(fakeItem()),
      'POST /reports': () => {
        const status = created ? 200 : 201;
        created = true;
        return { status, body: { id: 'r1' } };
      },
    });
    await mount(<ItemRoute />);
    const open = async () => {
      await fireEvent.press(await screen.findByRole('button', { name: es.items.detail.more }));
      await fireEvent.press(screen.getByRole('button', { name: es.reports.button.item }));
      await fireEvent.press(await screen.findByRole('radio', { name: es.reports.reasons.spam }));
      await fireEvent.press(screen.getByRole('button', { name: es.reports.sheet.submit }));
    };
    await open();
    expect(await screen.findByText(es.reports.sheet.success)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: es.reports.sheet.done }));
    await open();
    expect(await screen.findByText(es.reports.sheet.duplicate)).toBeTruthy();
    expect(api.calls.filter((c) => c.path === '/reports')).toHaveLength(2);
  });
});
