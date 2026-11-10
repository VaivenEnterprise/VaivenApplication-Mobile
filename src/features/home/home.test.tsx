import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { MessagesButton } from '@/components/navigation/MessagesButton';
import { HomeItemTile } from '@/features/home/components/HomeItemTile';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { es } from '@/i18n/es-MX';
import { failure, fakeUser, installFakeApi, ok } from '@/test/fakeApi';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn() }),
}));
jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({
    status: 'signedIn',
    user: { ...jest.requireActual('@/test/fakeApi').fakeUser },
    setUser: jest.fn(),
    signOut: jest.fn(),
  }),
}));

const t = es.inicio;
const card = (over: Record<string, unknown>) => ({
  id: 'i1',
  title: 'Taladro',
  category: 'herramientas',
  modality: 'rent',
  pricePerDayCents: 9000,
  zone: 'Centro',
  approxLocation: { lat: 0, lng: 0 },
  distanceKm: 1,
  thumbUrl: null,
  photoCount: 1,
  owner: { id: 'o', displayName: 'Luis' },
  createdAt: '2026-11-01T00:00:00Z',
  ...over,
});
const list = (...items: unknown[]) => ({ items, nextCursor: null });

async function renderHome(props: Parameters<typeof HomeScreen>[0] = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return await render(
    <QueryClientProvider client={client}>
      <HomeScreen {...props} />
    </QueryClientProvider>,
  );
}

beforeEach(() => mockPush.mockReset());
afterEach(() => jest.restoreAllMocks());

describe('HomeScreen', () => {
  it('saluda por el primer nombre, pide 6 objetos y los muestra con precio y «Gratis»', async () => {
    const api = installFakeApi({
      'GET /me': () => ok(fakeUser),
      'GET /items': () =>
        ok(
          list(
            card({ id: 'a', title: 'Taladro' }),
            card({ id: 'b', title: 'Escalera', modality: 'loan', pricePerDayCents: 0 }),
          ),
        ),
    });
    await renderHome();
    expect(await screen.findByText('Taladro')).toBeTruthy();
    expect(screen.getByText(`${t.greeting} Ana`)).toBeTruthy();
    expect(screen.getByText(`$90 ${t.perDay}`)).toBeTruthy();
    expect(screen.getByText(t.free)).toBeTruthy();
    expect(api.calls.find((c) => c.path === '/items')?.query).toBe('limit=6');
    expect(screen.getByText(t.kitTitle)).toBeTruthy();
    expect(screen.getByText(t.historyTitle)).toBeTruthy();
    expect(screen.getByText(t.popularProjects)).toBeTruthy();
  });

  it('navega: objeto, «Ver todo», perfil y mensajes', async () => {
    installFakeApi({
      'GET /me': () => ok(fakeUser),
      'GET /items': () => ok(list(card({ id: 'a' }))),
    });
    await renderHome();
    await fireEvent.press(await screen.findByLabelText(`Taladro, $90 ${t.perDay}`));
    expect(mockPush).toHaveBeenLastCalledWith('/objeto/a');
    await fireEvent.press(screen.getByLabelText(`${t.seeAll} ${t.recent}`));
    expect(mockPush).toHaveBeenLastCalledWith('/explorar');
    await fireEvent.press(screen.getByLabelText(t.profileA11y));
    expect(mockPush).toHaveBeenLastCalledWith('/perfil');
    await fireEvent.press(screen.getByLabelText(t.messages));
    expect(mockPush).toHaveBeenLastCalledWith('/mensajes');
  });

  it('sin objetos muestra el estado vacío y «Publicar» lleva a Mis objetos', async () => {
    installFakeApi({ 'GET /me': () => ok(fakeUser), 'GET /items': () => ok(list()) });
    await renderHome();
    expect(await screen.findByText(t.emptyTitle)).toBeTruthy();
    await fireEvent.press(screen.getByText(t.publish));
    expect(mockPush).toHaveBeenLastCalledWith('/mis-objetos');
  });

  it('un 500 afecta solo a la sección: el resto sigue y se puede reintentar', async () => {
    let calls = 0;
    installFakeApi({
      'GET /me': () => ok(fakeUser),
      'GET /items': () => (++calls === 1 ? failure(500, 'internal_error') : ok(list(card({})))),
    });
    await renderHome();
    expect(await screen.findByText(es.errors.internal_error)).toBeTruthy();
    expect(screen.getByText(t.popularProjects)).toBeTruthy();
    expect(screen.getByText(`${t.greeting} Ana`)).toBeTruthy();
    await fireEvent.press(screen.getByText(es.common.retry));
    expect(await screen.findByText('Taladro')).toBeTruthy();
  });

  it('muestra esqueletos mientras carga', async () => {
    installFakeApi({
      'GET /me': () => ok(fakeUser),
      'GET /items': () => new Promise(() => undefined) as never,
    });
    await renderHome();
    expect(await screen.findByTestId('home-recent-loading')).toBeTruthy();
  });

  it('jalar para recargar vuelve a pedir /me y /items', async () => {
    const api = installFakeApi({
      'GET /me': () => ok(fakeUser),
      'GET /items': () => ok(list(card({}))),
    });
    await renderHome();
    await screen.findByText('Taladro');
    const before = api.calls.length;
    await act(async () => {
      const { refreshControl } = screen.getByTestId('screen-scroll').props;
      await refreshControl.props.onRefresh();
    });
    await waitFor(() => expect(api.calls.length).toBeGreaterThanOrEqual(before + 2));
    expect(
      api.calls
        .slice(before)
        .map((c) => c.path)
        .sort(),
    ).toEqual(['/items', '/me']);
  });

  it('las specs dueñas reemplazan kit, historial y encabezado con render…', async () => {
    installFakeApi({ 'GET /me': () => ok(fakeUser), 'GET /items': () => ok(list()) });
    await renderHome({
      renderKit: () => <Text>KIT</Text>,
      renderHistory: () => <Text>HISTORIAL</Text>,
      renderHeaderExtra: () => <Text>EXTRA</Text>,
      unreadCount: 3,
    });
    expect(await screen.findByText('KIT')).toBeTruthy();
    expect(screen.getByText('HISTORIAL')).toBeTruthy();
    expect(screen.getByText('EXTRA')).toBeTruthy();
    expect(screen.queryByText(t.kitTitle)).toBeNull();
    expect(screen.getByLabelText(`${t.messages}, 3 ${t.unread}`)).toBeTruthy();
  });
});

describe('MessagesButton', () => {
  it('sin cuenta no muestra insignia; limita a 99+', async () => {
    const { rerender } = await render(<MessagesButton />);
    expect(screen.getByLabelText(t.messages)).toBeTruthy();
    await rerender(<MessagesButton badgeCount={150} />);
    expect(screen.getByText('99+')).toBeTruthy();
    await rerender(<MessagesButton badgeCount={-2} />);
    expect(screen.queryByText('99+')).toBeNull();
  });

  it('usa onPress si se pasa', async () => {
    const onPress = jest.fn();
    await render(<MessagesButton onPress={onPress} />);
    await fireEvent.press(screen.getByLabelText(t.messages));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe('HomeItemTile', () => {
  it('préstamo con precio 0 y renta gratis muestran «Gratis»; foto opcional', async () => {
    const onPress = jest.fn();
    await render(
      <HomeItemTile
        item={{
          id: 'x',
          title: 'Pala',
          modality: 'rent',
          pricePerDayCents: 0,
          thumbUrl: 'http://img/x.jpg',
        }}
        onPress={onPress}
      />,
    );
    expect(screen.getByText(t.free)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(`Pala, ${t.itemA11yFree}`));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
