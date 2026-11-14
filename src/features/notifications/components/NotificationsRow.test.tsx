import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { NotificationsRow } from '@/features/notifications/components/NotificationsRow';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { installFakeApi, ok } from '@/test/fakeApi';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useIsFocused: () => true,
}));
jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
jest.setTimeout(30_000);

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <NotificationsRow />
    </QueryClientProvider>,
  );
}

beforeEach(() => mockPush.mockReset());
afterEach(() => jest.restoreAllMocks());

describe('NotificationsRow', () => {
  it('muestra la insignia con los avisos sin leer y abre el centro', async () => {
    installFakeApi({ 'GET /me/notifications/unread-count': () => ok({ count: 3 }) });
    await mount();
    expect(await screen.findByText('3')).toBeTruthy();
    await fireEvent.press(
      screen.getByRole('button', { name: new RegExp(es.notifications.profileRow) }),
    );
    expect(mockPush).toHaveBeenCalledWith(routes.notifications);
  });

  it('sin avisos pendientes no lleva insignia', async () => {
    const api = installFakeApi({ 'GET /me/notifications/unread-count': () => ok({ count: 0 }) });
    await mount();
    await waitFor(() => expect(api.calls).toHaveLength(1));
    expect(screen.queryByText('0')).toBeNull();
  });
});
