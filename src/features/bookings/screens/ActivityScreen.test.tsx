import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ActivityScreen } from '@/features/bookings/screens/ActivityScreen';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { failure, installFakeApi, ok } from '@/test/fakeApi';
import { fakeBooking } from '@/test/fakeBookings';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));

const t = es.bookings.activity;

beforeEach(() => mockPush.mockReset());
afterEach(() => jest.restoreAllMocks());

function renderScreen() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ActivityScreen />
    </QueryClientProvider>,
  );
}

const roleOf = (query: string) => new URLSearchParams(query).get('role');
const page = (
  ids: [string, Parameters<typeof fakeBooking>[0]?][],
  nextCursor: string | null = null,
) =>
  ok({
    items: ids.map(([id, over]) =>
      fakeBooking({ id, item: { ...fakeBooking().item, title: `Objeto ${id}` }, ...over }),
    ),
    nextCursor,
  });

describe('ActivityScreen', () => {
  it('CA-04: la solicitud enviada aparece en «Solicito» como pendiente', async () => {
    const api = installFakeApi({ 'GET /me/bookings': () => page([['b1']]) });
    await renderScreen();
    expect(await screen.findByText('Objeto b1')).toBeTruthy();
    expect(screen.getByText('Pendiente')).toBeTruthy();
    expect(screen.getByText('Con Ana López · 12–14 nov')).toBeTruthy();
    expect(roleOf(api.calls[0]?.query ?? '')).toBe('requester');
    expect(screen.getByLabelText(t.requester).props.accessibilityState.selected).toBe(true);
  });

  it('«Presto» pide el rol de propietario y muestra a quien solicita', async () => {
    const api = installFakeApi({
      'GET /me/bookings': ({ query }) =>
        roleOf(query) === 'owner'
          ? page([['o1', { viewerRole: 'owner', expiresAt: '2099-01-01T00:00:00Z' }]])
          : page([['r1']]),
    });
    await renderScreen();
    await screen.findByText('Objeto r1');
    await fireEvent.press(screen.getByLabelText(t.owner));
    expect(await screen.findByText('Objeto o1')).toBeTruthy();
    expect(screen.getByText('Con Luis Pérez · 12–14 nov')).toBeTruthy();
    expect(screen.getByText(new RegExp(`^${t.respondBefore}`))).toBeTruthy();
    expect(api.calls.map((c) => roleOf(c.query))).toEqual(['requester', 'owner']);
  });

  it('filtra por grupo de estado', async () => {
    installFakeApi({
      'GET /me/bookings': () =>
        page([
          ['p', { status: 'pending' }],
          ['a', { status: 'accepted' }],
          ['c', { status: 'completed' }],
          ['x', { status: 'cancelled' }],
        ]),
    });
    await renderScreen();
    await screen.findByText('Objeto p');
    await fireEvent.press(screen.getByLabelText(t.filterPending));
    expect(screen.getByText('Objeto p')).toBeTruthy();
    expect(screen.queryByText('Objeto a')).toBeNull();
    await fireEvent.press(screen.getByLabelText(t.filterInProgress));
    expect(screen.getByText('Objeto a')).toBeTruthy();
    expect(screen.queryByText('Objeto p')).toBeNull();
    await fireEvent.press(screen.getByLabelText(t.filterDone));
    expect(screen.getByText('Objeto c')).toBeTruthy();
    expect(screen.getByText('Objeto x')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(t.filterAll));
    expect(screen.getByText('Objeto p')).toBeTruthy();
  });

  it('un filtro sin coincidencias dice que no hay resultados', async () => {
    installFakeApi({ 'GET /me/bookings': () => page([['p', { status: 'pending' }]]) });
    await renderScreen();
    await screen.findByText('Objeto p');
    await fireEvent.press(screen.getByLabelText(t.filterDone));
    expect(await screen.findByText(t.emptyFilteredTitle)).toBeTruthy();
  });

  it('con un filtro activo sigue pidiendo páginas hasta encontrar coincidencias', async () => {
    const api = installFakeApi({
      'GET /me/bookings': ({ query }) =>
        query.includes('cursor=c1')
          ? page([['c', { status: 'completed' }]])
          : page([['p', { status: 'pending' }]], 'c1'),
    });
    await renderScreen();
    await screen.findByText('Objeto p');
    await fireEvent.press(screen.getByLabelText(t.filterDone));
    expect(await screen.findByText('Objeto c')).toBeTruthy();
    expect(api.calls).toHaveLength(2);
  });

  it('pagina con el cursor al llegar al final', async () => {
    const api = installFakeApi({
      'GET /me/bookings': ({ query }) =>
        query.includes('cursor=c1') ? page([['b2']]) : page([['b1']], 'c1'),
    });
    await renderScreen();
    await screen.findByText('Objeto b1');
    await fireEvent(screen.getByTestId('activity-list'), 'onEndReached');
    expect(await screen.findByText('Objeto b2')).toBeTruthy();
    expect(new URLSearchParams(api.calls[1]?.query).get('cursor')).toBe('c1');
  });

  it('vacío de «Solicito»: invita a explorar', async () => {
    installFakeApi({ 'GET /me/bookings': () => ok({ items: [], nextCursor: null }) });
    await renderScreen();
    expect(await screen.findByText(t.emptyRequesterTitle)).toBeTruthy();
    await fireEvent.press(screen.getByText(t.emptyRequesterAction));
    expect(mockPush).toHaveBeenCalledWith(routes.explore);
  });

  it('vacío de «Presto»: explica cuándo aparecerán solicitudes', async () => {
    installFakeApi({ 'GET /me/bookings': () => ok({ items: [], nextCursor: null }) });
    await renderScreen();
    await screen.findByText(t.emptyRequesterTitle);
    await fireEvent.press(screen.getByLabelText(t.owner));
    expect(await screen.findByText(t.emptyOwnerTitle)).toBeTruthy();
  });

  it('error con reintento', async () => {
    let calls = 0;
    installFakeApi({
      'GET /me/bookings': () => (++calls === 1 ? failure(500, 'internal_error') : page([['b1']])),
    });
    await renderScreen();
    expect(await screen.findByText(es.errors.internal_error)).toBeTruthy();
    await fireEvent.press(screen.getByText(es.common.retry));
    await waitFor(() => expect(screen.getByText('Objeto b1')).toBeTruthy());
  });

  it('abrir una tarjeta lleva al detalle de la reserva', async () => {
    installFakeApi({ 'GET /me/bookings': () => page([['b1']]) });
    await renderScreen();
    await fireEvent.press(await screen.findByText('Objeto b1'));
    expect(mockPush).toHaveBeenCalledWith(routes.booking('b1'));
  });
});
