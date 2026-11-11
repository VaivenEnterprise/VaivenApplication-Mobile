import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { MyItemsScreen } from '@/features/items/screens/MyItemsScreen';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { failure, installFakeApi, ok } from '@/test/fakeApi';
import { fakeItem } from '@/test/fakeItems';

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
  }),
}));

const t = es.items.list;

function renderList() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MyItemsScreen />
    </QueryClientProvider>,
  );
}

const page = (items: ReturnType<typeof fakeItem>[], nextCursor: string | null = null) =>
  ok({ items, nextCursor });

beforeEach(() => mockPush.mockReset());
afterEach(() => jest.restoreAllMocks());

describe('MyItemsScreen', () => {
  it('muestra tres filas de carga mientras llega la lista', async () => {
    installFakeApi({ 'GET /me/items': () => new Promise(() => undefined) as never });
    await renderList();
    expect(screen.getAllByTestId('my-items-skeleton')).toHaveLength(3);
    expect(screen.getByRole('header', { name: t.title })).toBeTruthy();
  });

  it('lista mis objetos con precio y estado, y abre el detalle al tocar una fila', async () => {
    installFakeApi({
      'GET /me/items': () =>
        page([
          fakeItem(),
          fakeItem({
            id: 'b2',
            title: 'Escalera',
            modality: 'loan',
            pricePerDayCents: 0,
            status: 'paused',
          }),
        ]),
    });
    await renderList();
    expect(await screen.findByText('Taladro percutor 600 W')).toBeTruthy();
    expect(screen.getByText('$30 / día')).toBeTruthy();
    expect(screen.getByText(es.items.status.active)).toBeTruthy();
    expect(screen.getByText(es.items.money.free)).toBeTruthy();
    expect(screen.getByText(es.items.status.paused)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(/^Escalera/));
    expect(mockPush).toHaveBeenCalledWith(routes.item('b2'));
  });

  it('vacío: invita a publicar el primer objeto', async () => {
    installFakeApi({ 'GET /me/items': () => page([]) });
    await renderList();
    expect(await screen.findByText(t.emptyTitle)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: t.emptyAction }));
    expect(mockPush).toHaveBeenCalledWith(routes.newItem);
  });

  it('el botón «+» abre el formulario de publicar', async () => {
    installFakeApi({ 'GET /me/items': () => page([fakeItem()]) });
    await renderList();
    await screen.findByText('Taladro percutor 600 W');
    await fireEvent.press(screen.getByRole('button', { name: t.publish }));
    expect(mockPush).toHaveBeenCalledWith(routes.newItem);
  });

  it('filtra por estado pidiendo status al servidor', async () => {
    const api = installFakeApi({
      'GET /me/items': ({ query }) =>
        query.includes('status=paused')
          ? page([fakeItem({ id: 'p1', title: 'Pausado uno', status: 'paused' })])
          : page([fakeItem()]),
    });
    await renderList();
    await screen.findByText('Taladro percutor 600 W');
    await fireEvent.press(screen.getByRole('tab', { name: t.filterPaused }));
    expect(await screen.findByText('Pausado uno')).toBeTruthy();
    expect(api.calls.some((c) => c.query.includes('status=paused'))).toBe(true);
    await fireEvent.press(screen.getByRole('tab', { name: t.filterActive }));
    await waitFor(() =>
      expect(api.calls.some((c) => c.query.includes('status=active'))).toBe(true),
    );
  });

  it('un filtro sin resultados no ofrece «primer objeto»', async () => {
    installFakeApi({
      'GET /me/items': ({ query }) => (query.includes('status=') ? page([]) : page([fakeItem()])),
    });
    await renderList();
    await screen.findByText('Taladro percutor 600 W');
    await fireEvent.press(screen.getByRole('tab', { name: t.filterPaused }));
    expect(await screen.findByText(t.emptyFilteredTitle)).toBeTruthy();
    expect(screen.queryByRole('button', { name: t.emptyAction })).toBeNull();
  });

  it('error: muestra el mensaje y reintenta', async () => {
    let fail = true;
    installFakeApi({
      'GET /me/items': () => (fail ? failure(500, 'internal_error') : page([fakeItem()])),
    });
    await renderList();
    expect(await screen.findByText(es.errors.internal_error)).toBeTruthy();
    fail = false;
    await fireEvent.press(screen.getByRole('button', { name: es.common.retry }));
    expect(await screen.findByText('Taladro percutor 600 W')).toBeTruthy();
  });

  it('pagina con cursor al llegar al final y no repite cuando ya no hay más', async () => {
    const api = installFakeApi({
      'GET /me/items': ({ query }) =>
        query.includes('cursor=c2')
          ? page([fakeItem({ id: 'b2', title: 'Segunda página' })], null)
          : page([fakeItem()], 'c2'),
    });
    await renderList();
    await screen.findByText('Taladro percutor 600 W');
    await fireEvent(screen.getByTestId('my-items-list'), 'endReached');
    expect(await screen.findByText('Segunda página')).toBeTruthy();
    const calls = api.calls.length;
    await fireEvent(screen.getByTestId('my-items-list'), 'endReached');
    expect(api.calls).toHaveLength(calls);
  });

  it('jalar para recargar vuelve a pedir la lista', async () => {
    const api = installFakeApi({ 'GET /me/items': () => page([fakeItem()]) });
    await renderList();
    await screen.findByText('Taladro percutor 600 W');
    const refresh = screen.getByTestId('my-items-list').props.refreshControl;
    await act(async () => {
      refresh.props.onRefresh();
    });
    await waitFor(() => expect(api.calls).toHaveLength(2));
  });
});
