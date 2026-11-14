import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { NotificationsScreen } from '@/features/notifications/screens/NotificationsScreen';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { failure, installFakeApi, installMemorySecureStore, ok } from '@/test/fakeApi';
import { fakeNotification, fakeNotificationPage } from '@/test/fakeNotifications';
import { installFakePush } from '@/test/fakePush';

const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
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
jest.setTimeout(30_000);

const t = es.notifications;
const LIST = 'GET /me/notifications';
const COUNT = 'GET /me/notifications/unread-count';
const READ = 'POST /me/notifications/read';

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();

beforeEach(() => {
  mockPush.mockReset();
  mockBack.mockReset();
  installFakePush({ permission: 'granted' });
  installMemorySecureStore();
});
afterEach(() => jest.restoreAllMocks());

function renderScreen() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <NotificationsScreen />
    </QueryClientProvider>,
  );
}

describe('NotificationsScreen', () => {
  it('lista los avisos agrupados por día, con los no leídos destacados', async () => {
    installFakeApi({
      [LIST]: () =>
        ok(
          fakeNotificationPage([
            fakeNotification({ id: 'a', title: 'Solicitud nueva', createdAt: hoursAgo(0.2) }),
            fakeNotification({
              id: 'b',
              title: 'Mensaje nuevo',
              type: 'message_received',
              readAt: hoursAgo(1),
              createdAt: hoursAgo(5 * 24),
            }),
          ]),
        ),
      [COUNT]: () => ok({ count: 1 }),
    });
    await renderScreen();
    expect(await screen.findByText('Solicitud nueva')).toBeTruthy();
    expect(screen.getByText('Mensaje nuevo')).toBeTruthy();
    expect(screen.getByText('Hoy')).toBeTruthy();
    expect(screen.getAllByTestId('unread-dot')).toHaveLength(1);
  });

  it('tocar un aviso de reserva lo marca leído y abre la reserva (CA-01)', async () => {
    const api = installFakeApi({
      [LIST]: () =>
        ok(
          fakeNotificationPage([
            fakeNotification({ id: 'a', data: { bookingId: 'b1' }, createdAt: hoursAgo(0.2) }),
          ]),
        ),
      [COUNT]: () => ok({ count: 1 }),
      [READ]: () => ({ status: 204 }),
    });
    await renderScreen();
    await fireEvent.press(await screen.findByLabelText(/^No leído\. Solicitud aceptada/));
    expect(mockPush).toHaveBeenCalledWith(routes.booking('b1'));
    await waitFor(() =>
      expect(api.calls.find((c) => c.path === '/me/notifications/read')?.body).toEqual({
        ids: ['a'],
      }),
    );
    await waitFor(() => expect(screen.queryByTestId('unread-dot')).toBeNull());
  });

  it('un aviso ya leído solo abre el destino', async () => {
    const api = installFakeApi({
      [LIST]: () =>
        ok(
          fakeNotificationPage([
            fakeNotification({
              id: 'a',
              type: 'message_received',
              data: { conversationId: 'c1' },
              readAt: hoursAgo(1),
              createdAt: hoursAgo(0.5),
            }),
          ]),
        ),
      [COUNT]: () => ok({ count: 0 }),
    });
    await renderScreen();
    await fireEvent.press(await screen.findByRole('button', { name: /Solicitud aceptada/ }));
    expect(mockPush).toHaveBeenCalledWith(routes.chat('c1'));
    expect(api.calls.some((c) => c.path === '/me/notifications/read')).toBe(false);
  });

  it('un aviso sin destino no navega', async () => {
    installFakeApi({
      [LIST]: () =>
        ok(
          fakeNotificationPage([
            fakeNotification({ id: 'a', data: {}, readAt: hoursAgo(1), createdAt: hoursAgo(1) }),
          ]),
        ),
      [COUNT]: () => ok({ count: 0 }),
    });
    await renderScreen();
    await fireEvent.press(await screen.findByRole('button', { name: /Solicitud aceptada/ }));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('contenido retirado abre una tarjeta con su texto y el enlace a la incidencia (RF-08)', async () => {
    installFakeApi({
      [LIST]: () =>
        ok(
          fakeNotificationPage([
            fakeNotification({
              id: 'a',
              type: 'content_removed',
              title: 'Retiramos tu objeto',
              body: 'Incumple las reglas de contenido.',
              data: { itemId: 'i1', incidentId: 'x1' },
              readAt: hoursAgo(1),
              createdAt: hoursAgo(1),
            }),
          ]),
        ),
      [COUNT]: () => ok({ count: 0 }),
    });
    await renderScreen();
    await fireEvent.press(await screen.findByRole('button', { name: /Retiramos tu objeto/ }));
    expect(mockPush).not.toHaveBeenCalled();
    const sheet = await screen.findByTestId('bottom-sheet');
    expect(within(sheet).getByText(t.detail.title)).toBeTruthy();
    expect(within(sheet).getByText('Incumple las reglas de contenido.')).toBeTruthy();
    await fireEvent.press(within(sheet).getByRole('button', { name: t.detail.viewIncident }));
    expect(mockPush).toHaveBeenCalledWith(routes.incident('x1'));
  });

  it('una sanción sin incidencia no ofrece el enlace', async () => {
    installFakeApi({
      [LIST]: () =>
        ok(
          fakeNotificationPage([
            fakeNotification({
              id: 'a',
              type: 'sanction_applied',
              title: 'Cuenta suspendida',
              data: {},
              readAt: hoursAgo(1),
              createdAt: hoursAgo(1),
            }),
          ]),
        ),
      [COUNT]: () => ok({ count: 0 }),
    });
    await renderScreen();
    await fireEvent.press(await screen.findByRole('button', { name: /Cuenta suspendida/ }));
    const sheet = await screen.findByTestId('bottom-sheet');
    expect(within(sheet).queryByText(t.detail.viewIncident)).toBeNull();
    await fireEvent.press(within(sheet).getByRole('button', { name: t.detail.done }));
  });

  it('«Marcar todas» envía all y deja todo leído', async () => {
    const api = installFakeApi({
      [LIST]: () =>
        ok(
          fakeNotificationPage([
            fakeNotification({ id: 'a', createdAt: hoursAgo(1) }),
            fakeNotification({ id: 'b', createdAt: hoursAgo(2) }),
          ]),
        ),
      [COUNT]: () => ok({ count: 2 }),
      [READ]: () => ({ status: 204 }),
    });
    await renderScreen();
    await screen.findAllByTestId('unread-dot');
    await fireEvent.press(screen.getByRole('button', { name: t.center.markAll }));
    await waitFor(() =>
      expect(api.calls.find((c) => c.path === '/me/notifications/read')?.body).toEqual({
        all: true,
      }),
    );
    await waitFor(() => expect(screen.queryAllByTestId('unread-dot')).toHaveLength(0));
  });

  it('«Marcar todas» está deshabilitado si no hay nada sin leer', async () => {
    installFakeApi({
      [LIST]: () =>
        ok(
          fakeNotificationPage([fakeNotification({ readAt: hoursAgo(1), createdAt: hoursAgo(1) })]),
        ),
      [COUNT]: () => ok({ count: 0 }),
    });
    await renderScreen();
    await screen.findByText('Solicitud aceptada');
    expect(screen.getByRole('button', { name: t.center.markAll }).props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    );
  });

  it('si no se puede marcar, avisa', async () => {
    installFakeApi({
      [LIST]: () => ok(fakeNotificationPage([fakeNotification({ createdAt: hoursAgo(1) })])),
      [COUNT]: () => ok({ count: 1 }),
      [READ]: () => failure(500, 'internal_error'),
    });
    await renderScreen();
    await screen.findByText('Solicitud aceptada');
    await fireEvent.press(screen.getByRole('button', { name: t.center.markAll }));
    expect(await screen.findByText(t.center.markFailed)).toBeTruthy();
  });

  it('carga la siguiente página con «Ver más avisos»', async () => {
    installFakeApi({
      [LIST]: ({ query }) =>
        ok(
          query.includes('cursor=c2')
            ? fakeNotificationPage([fakeNotification({ id: 'n2', title: 'Segundo' })], null)
            : fakeNotificationPage([fakeNotification({ id: 'n1', title: 'Primero' })], 'c2'),
        ),
      [COUNT]: () => ok({ count: 0 }),
    });
    await renderScreen();
    await screen.findByText('Primero');
    await fireEvent.press(screen.getByRole('button', { name: t.center.loadMore }));
    expect(await screen.findByText('Segundo')).toBeTruthy();
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: t.center.loadMore })).toBeNull(),
    );
  });

  it('sin avisos muestra «Todo al día»', async () => {
    installFakeApi({ [LIST]: () => ok(fakeNotificationPage([])), [COUNT]: () => ok({ count: 0 }) });
    await renderScreen();
    expect(await screen.findByText(t.center.emptyTitle)).toBeTruthy();
  });

  it('si falla la carga ofrece reintentar', async () => {
    let attempts = 0;
    installFakeApi({
      [LIST]: () => {
        attempts += 1;
        return attempts === 1 ? failure(500, 'internal_error') : ok(fakeNotificationPage());
      },
      [COUNT]: () => ok({ count: 0 }),
    });
    await renderScreen();
    await fireEvent.press(await screen.findByRole('button', { name: es.common.retry }));
    expect(await screen.findByText('Solicitud aceptada')).toBeTruthy();
  });

  it('«Volver» regresa a la pantalla anterior', async () => {
    installFakeApi({ [LIST]: () => ok(fakeNotificationPage([])), [COUNT]: () => ok({ count: 0 }) });
    await renderScreen();
    await fireEvent.press(screen.getByRole('button', { name: t.center.back }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});

describe('interruptor de avisos en el teléfono', () => {
  it('con el permiso negado indica «Desactivados» y ofrece abrir ajustes (CA-03)', async () => {
    installFakePush({ permission: 'denied' });
    const open = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    installFakeApi({ [LIST]: () => ok(fakeNotificationPage([])), [COUNT]: () => ok({ count: 0 }) });
    await renderScreen();
    expect(await screen.findByText(t.push.denied)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: t.push.openSettings }));
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('en emulador queda deshabilitado', async () => {
    installFakePush({ isDevice: false });
    installFakeApi({ [LIST]: () => ok(fakeNotificationPage([])), [COUNT]: () => ok({ count: 0 }) });
    await renderScreen();
    expect(await screen.findByText(t.push.unavailable)).toBeTruthy();
    expect(screen.getByLabelText(t.push.toggleA11y).props.disabled).toBe(true);
  });

  it('activarlo registra el token y apagarlo lo elimina (RF-09)', async () => {
    installFakePush({ permission: 'undetermined' });
    const api = installFakeApi({
      [LIST]: () => ok(fakeNotificationPage([])),
      [COUNT]: () => ok({ count: 0 }),
      'POST /me/push-tokens': () => ({ status: 204 }),
      'DELETE /me/push-tokens': () => ({ status: 204 }),
    });
    await renderScreen();
    const toggle = await screen.findByLabelText(t.push.toggleA11y);
    await waitFor(() => expect(screen.getByText(t.push.off)).toBeTruthy());
    await fireEvent(toggle, 'valueChange', true);
    expect(await screen.findByText(t.push.on)).toBeTruthy();
    await fireEvent(screen.getByLabelText(t.push.toggleA11y), 'valueChange', false);
    expect(await screen.findByText(t.push.off)).toBeTruthy();
    expect(api.calls.map((c) => `${c.method} ${c.path}`)).toEqual(
      expect.arrayContaining(['POST /me/push-tokens', 'DELETE /me/push-tokens']),
    );
  });

  it('si no se pudo activar muestra el aviso', async () => {
    installFakePush({ permission: 'granted', token: null });
    installFakeApi({ [LIST]: () => ok(fakeNotificationPage([])), [COUNT]: () => ok({ count: 0 }) });
    await renderScreen();
    await screen.findByText(t.push.on);
    await fireEvent(screen.getByLabelText(t.push.toggleA11y), 'valueChange', false);
    await fireEvent(screen.getByLabelText(t.push.toggleA11y), 'valueChange', true);
    expect(await screen.findByText(t.push.enableFailed)).toBeTruthy();
  });
});
