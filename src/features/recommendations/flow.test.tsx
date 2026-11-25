import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { AccessibilityInfo } from 'react-native';
import { ClearHistoryRow, renderEffects, renderTopSections } from '@/features/recommendations';
import { ItemDetailScreen } from '@/features/items/screens/ItemDetailScreen';
import { ProfileScreen } from '@/features/profile/screens/ProfileScreen';
import { ExploreScreen } from '@/features/search/screens/ExploreScreen';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { failure, fakeUser, installFakeApi, ok, type FakeReply } from '@/test/fakeApi';
import { fakeCategories, fakeItem } from '@/test/fakeItems';

// Prueba del flujo de punta a punta (T006): Explorar, el detalle y el Perfil reales con los *slots*
// de recomendaciones conectados y la API simulada. Cubre CA-01 a CA-04.

jest.setTimeout(30_000);

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn() }),
  useNavigation: () => ({ setParams: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));
jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
let mockUserId = 'otra-persona';
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({
    status: 'signedIn',
    user: { ...jest.requireActual('@/test/fakeApi').fakeUser, id: mockUserId },
    signOut: jest.fn(),
    setUser: jest.fn(),
  }),
}));
jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

const t = es.recommendations;
const ITEM_ID = '6731a2b3c4d5e6f7a8b9c0d1';
const NO_CONTENT: FakeReply = { status: 204 };
const ON = { features: { recommendations: true } };

const rec = (n: number, reason: object) => ({
  item: {
    id: `r${n}`,
    title: `Recomendado ${n}`,
    category: 'hogar',
    modality: 'rent',
    pricePerDayCents: 8000,
    thumbUrl: null,
  },
  reason,
});
const personal = {
  items: [
    rec(1, { code: 'similar_to', itemId: 'v1', itemTitle: 'Sierra circular' }),
    rec(2, { code: 'popular_in_category' }),
  ],
  nextCursor: null,
};
const coldStart = { items: [rec(3, { code: 'popular' })], nextCursor: null };

const recent = {
  items: [
    {
      id: 'e1',
      title: 'Objeto reciente',
      category: 'hogar',
      modality: 'rent',
      pricePerDayCents: 3000,
      thumbUrl: null,
      distanceKm: null,
      owner: { ratingAverage: 4.9 },
    },
  ],
  nextCursor: null,
};

function newClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}
const withClient = (client: QueryClient, children: React.ReactNode) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);
const explore = () => <ExploreScreen renderTopSections={renderTopSections} />;
const detail = () => <ItemDetailScreen id={ITEM_ID} renderEffects={renderEffects} />;
const profile = () => <ProfileScreen renderExtraRows={() => <ClearHistoryRow />} />;
const events = (api: { calls: { path: string }[] }) =>
  api.calls.filter((call) => call.path === '/recommendations/events');

beforeEach(() => {
  mockPush.mockReset();
  mockUserId = 'otra-persona';
  jest.mocked(Location.getForegroundPermissionsAsync).mockResolvedValue({
    granted: false,
    canAskAgain: true,
    status: 'denied',
  } as never);
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
});
afterEach(() => jest.restoreAllMocks());

describe('CA-01 · Explorar muestra la fila con motivos', () => {
  it('con historial, «Recomendado para ti» aparece con sus motivos junto al resto de Explorar', async () => {
    installFakeApi({
      'GET /meta': () => ok(ON),
      'GET /recommendations': () => ok(personal),
      'GET /items': () => ok(recent),
      'GET /categories': () => ok(fakeCategories),
    });
    await render(withClient(newClient(), explore()));
    expect(await screen.findByRole('header', { name: t.title })).toBeTruthy();
    expect(await screen.findByText('Porque viste: Sierra circular')).toBeTruthy();
    expect(screen.getByText(t.reason.popularInCategory)).toBeTruthy();
    // El resto de Explorar sigue ahí.
    expect(await screen.findByText('Objeto reciente')).toBeTruthy();
    expect(screen.getByText(es.search.popularProjects)).toBeTruthy();
  });

  it('al tocar una recomendación se abre su detalle', async () => {
    installFakeApi({
      'GET /meta': () => ok(ON),
      'GET /recommendations': () => ok(personal),
      'GET /items': () => ok(recent),
      'GET /categories': () => ok(fakeCategories),
    });
    await render(withClient(newClient(), explore()));
    await fireEvent.press(await screen.findByRole('button', { name: /Recomendado 1/ }));
    expect(mockPush).toHaveBeenCalledWith(routes.item('r1'));
  });
});

describe('CA-04 · función apagada o con error, Explorar funciona igual', () => {
  const others = {
    'GET /items': () => ok(recent),
    'GET /categories': () => ok(fakeCategories),
  };

  it.each([
    ['apagada', { 'GET /meta': () => ok({ features: { recommendations: false } }) }],
    ['sin /meta con la sección features', { 'GET /meta': () => ok({ name: 'x' }) }],
    ['con /meta caído', { 'GET /meta': () => failure(500, 'internal_error') }],
    [
      'con la lista en 503',
      {
        'GET /meta': () => ok(ON),
        'GET /recommendations': () => failure(503, 'service_unavailable'),
      },
    ],
    [
      'con la lista vacía',
      {
        'GET /meta': () => ok(ON),
        'GET /recommendations': () => ok({ items: [], nextCursor: null }),
      },
    ],
  ])('%s: no hay fila y Explorar muestra sus objetos', async (_name, handlers) => {
    const api = installFakeApi({ ...others, ...handlers });
    await render(withClient(newClient(), explore()));
    expect(await screen.findByText('Objeto reciente')).toBeTruthy();
    // Si la función está encendida se espera a la lista; si no, basta con que /meta responda.
    const path = 'GET /recommendations' in handlers ? '/recommendations' : '/meta';
    await waitFor(() => expect(api.calls.some((call) => call.path === path)).toBe(true));
    await waitFor(() => expect(screen.queryByTestId('recommended-loading')).toBeNull());
    expect(screen.queryByText(t.title)).toBeNull();
    expect(screen.getByText(es.search.popularProjects)).toBeTruthy();
    expect(screen.getByText(es.search.nearYou)).toBeTruthy();
  });

  it('apagada, el detalle de un objeto ajeno no envía ningún evento', async () => {
    const api = installFakeApi({
      'GET /meta': () => ok({ features: { recommendations: false } }),
      'GET /categories': () => ok(fakeCategories),
      [`GET /items/${ITEM_ID}`]: () => ok(fakeItem({ declaredValueCents: null })),
    });
    await render(withClient(newClient(), detail()));
    expect(await screen.findByText('Taladro percutor 600 W')).toBeTruthy();
    await waitFor(() => expect(api.calls.some((call) => call.path === '/meta')).toBe(true));
    expect(events(api)).toHaveLength(0);
  });
});

describe('CA-02 · el detalle envía un solo evento y no cambia', () => {
  const handlers = (event: () => FakeReply) => ({
    'GET /meta': () => ok(ON),
    'GET /categories': () => ok(fakeCategories),
    [`GET /items/${ITEM_ID}`]: () => ok(fakeItem({ declaredValueCents: null })),
    'POST /recommendations/events': event,
  });

  it('un objeto ajeno envía un evento view y la pantalla se ve igual', async () => {
    const api = installFakeApi(handlers(() => NO_CONTENT));
    await render(withClient(newClient(), detail()));
    expect(await screen.findByText('Taladro percutor 600 W')).toBeTruthy();
    await waitFor(() => expect(events(api)).toHaveLength(1));
    expect(events(api)[0]).toMatchObject({ body: { itemId: ITEM_ID, type: 'view' } });
    expect(screen.getByText('Ana López')).toBeTruthy();
    expect(screen.getByText('Devolver limpio. No usar en metal.')).toBeTruthy();
    // Nada visible lo delata: ni avisos ni errores.
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('no repite el evento al volver a pintar la pantalla', async () => {
    const api = installFakeApi(handlers(() => NO_CONTENT));
    const client = newClient();
    const { rerender } = await render(withClient(client, detail()));
    await screen.findByText('Taladro percutor 600 W');
    await waitFor(() => expect(events(api)).toHaveLength(1));
    await rerender(withClient(client, detail()));
    await rerender(withClient(client, detail()));
    expect(events(api)).toHaveLength(1);
  });

  it('un objeto propio no envía evento', async () => {
    mockUserId = fakeItem().owner.id;
    const api = installFakeApi(handlers(() => NO_CONTENT));
    await render(withClient(newClient(), detail()));
    await screen.findByText('Taladro percutor 600 W');
    await waitFor(() => expect(api.calls.some((call) => call.path === '/meta')).toBe(true));
    expect(events(api)).toHaveLength(0);
  });

  it('si el evento falla, la pantalla no muestra nada ni reintenta', async () => {
    const api = installFakeApi(handlers(() => failure(503, 'service_unavailable')));
    await render(withClient(newClient(), detail()));
    expect(await screen.findByText('Taladro percutor 600 W')).toBeTruthy();
    await waitFor(() => expect(events(api)).toHaveLength(1));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(events(api)).toHaveLength(1);
  });
});

describe('CA-03 · borrar historial devuelve la fila al arranque en frío', () => {
  it('tras confirmar, Explorar vuelve a pedir la lista y ya no dice «Porque viste»', async () => {
    let list = personal;
    const api = installFakeApi({
      'GET /meta': () => ok(ON),
      'GET /recommendations': () => ok(list),
      'DELETE /recommendations/history': () => {
        list = coldStart;
        return NO_CONTENT;
      },
      'GET /items': () => ok(recent),
      'GET /categories': () => ok(fakeCategories),
      'GET /me': () => ok(fakeUser),
    });
    const client = newClient();

    const first = await render(withClient(client, explore()));
    expect(await screen.findByText('Porque viste: Sierra circular')).toBeTruthy();
    await first.unmount();

    await render(withClient(client, profile()));
    await fireEvent.press(screen.getByRole('button', { name: t.clear.row }));
    expect(await screen.findByText(t.clear.title)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: t.clear.confirm }));
    expect(await screen.findByText(t.clear.success)).toBeTruthy();
    expect(api.calls.filter((call) => call.method === 'DELETE')).toHaveLength(1);

    await screen.unmount();
    await render(withClient(client, explore()));
    expect(await screen.findByText(t.reason.popular)).toBeTruthy();
    expect(screen.queryByText(/Porque viste/)).toBeNull();
    expect(api.calls.filter((call) => call.path === '/recommendations')).toHaveLength(2);
  });

  it('cancelar la confirmación no borra nada', async () => {
    const api = installFakeApi({
      'GET /meta': () => ok(ON),
      'DELETE /recommendations/history': () => NO_CONTENT,
      'GET /me': () => ok(fakeUser),
    });
    await render(withClient(newClient(), profile()));
    await fireEvent.press(screen.getByRole('button', { name: t.clear.row }));
    await fireEvent.press(await screen.findByRole('button', { name: t.clear.cancel }));
    expect(api.calls.some((call) => call.method === 'DELETE')).toBe(false);
  });
});
