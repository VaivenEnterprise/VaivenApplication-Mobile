import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { Text } from 'react-native';
import { ExploreScreen } from '@/features/search/screens/ExploreScreen';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { failure, installFakeApi, ok } from '@/test/fakeApi';
import { fakeCategories } from '@/test/fakeItems';

const mockPush = jest.fn();
const mockSetParams = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useNavigation: () => ({ setParams: mockSetParams }),
  useLocalSearchParams: () => mockParams,
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

jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

const t = es.search;
const permissionOf = (granted: boolean, canAskAgain = true) =>
  ({ granted, canAskAgain, status: granted ? 'granted' : 'denied' }) as never;

const card = (n: number) => ({
  id: `i${n}`,
  title: `Objeto ${n}`,
  category: 'hogar',
  modality: 'rent',
  pricePerDayCents: 3000,
  thumbUrl: null,
  distanceKm: null,
  owner: { ratingAverage: 4.9 },
});

const page = (ids: number[], nextCursor: string | null = null) =>
  ok({ items: ids.map(card), nextCursor });

function renderExplore(props: Parameters<typeof ExploreScreen>[0] = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ExploreScreen {...props} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.mocked(Location.getForegroundPermissionsAsync).mockResolvedValue(permissionOf(false));
  mockParams = {};
  mockPush.mockReset();
  mockSetParams.mockReset();
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('ExploreScreen · inicio (sin texto ni filtros)', () => {
  it('CA-01 y CA-08: muestra recientes, «Proyectos populares» y «Cerca de ti»', async () => {
    const { calls } = installFakeApi({
      'GET /items': () => page([1, 2, 3]),
      'GET /categories': () => ok(fakeCategories),
    });
    await renderExplore();
    await waitFor(() => expect(screen.getByText('Objeto 1')).toBeTruthy());
    expect(screen.getByText(t.popularProjects)).toBeTruthy();
    expect(screen.getByText(t.nearYou)).toBeTruthy();
    expect(screen.getByText('Colgar un cuadro')).toBeTruthy();
    expect(screen.getByPlaceholderText(t.placeholder)).toBeTruthy();
    expect(calls.filter((call) => call.path === '/items').map((call) => call.query)).toEqual([
      'limit=20',
    ]);
    expect(screen.getAllByRole('button', { name: /Objeto/ })).toHaveLength(3);
  });

  it('expone el slot renderTopSections sobre la lista (spec 015)', async () => {
    installFakeApi({ 'GET /items': () => page([1]) });
    await renderExplore({ renderTopSections: () => <Text>Recomendado de prueba</Text> });
    expect(screen.getByText('Recomendado de prueba')).toBeTruthy();
  });

  it('muestra esqueletos mientras llegan los resultados', async () => {
    installFakeApi({ 'GET /items': () => new Promise(() => undefined) as never });
    await renderExplore();
    expect(screen.getByTestId('search-skeleton')).toBeTruthy();
  });

  it('muestra el error con reintento y se recupera', async () => {
    let fail = true;
    installFakeApi({ 'GET /items': () => (fail ? failure(500, 'internal_error') : page([1])) });
    await renderExplore();
    await waitFor(() => expect(screen.getByText(es.errors.internal_error)).toBeTruthy());
    fail = false;
    await fireEvent.press(screen.getByRole('button', { name: es.common.retry }));
    await waitFor(() => expect(screen.getByText('Objeto 1')).toBeTruthy());
  });

  it('RF-07: tocar una tarjeta abre el detalle del objeto', async () => {
    installFakeApi({ 'GET /items': () => page([1, 2]) });
    await renderExplore();
    await waitFor(() => expect(screen.getByText('Objeto 2')).toBeTruthy());
    await fireEvent.press(screen.getByRole('button', { name: /Objeto 2/ }));
    expect(mockPush).toHaveBeenCalledWith(routes.item('i2'));
  });

  it('tocar un proyecto popular abre su pantalla', async () => {
    installFakeApi({ 'GET /items': () => page([1]) });
    await renderExplore();
    await fireEvent.press(screen.getByRole('button', { name: /Colgar un cuadro/ }));
    expect(mockPush).toHaveBeenCalledWith(routes.project('colgar-un-cuadro'));
  });

  it('RF-06: pagina con el cursor al llegar al final', async () => {
    const { calls } = installFakeApi({
      'GET /items': ({ query }) =>
        query.includes('cursor=c1') ? page([3, 4]) : page([1, 2], 'c1'),
    });
    await renderExplore();
    await waitFor(() => expect(screen.getByText('Objeto 2')).toBeTruthy());
    await fireEvent(screen.getByTestId('search-results'), 'endReached');
    await waitFor(() => expect(screen.getByText('Objeto 4')).toBeTruthy());
    expect(calls.map((call) => call.query)).toContain('limit=20&cursor=c1');
  });
});

describe('ExploreScreen · búsqueda', () => {
  it('CA-02: el texto llega a la ruta tras 400 ms y no antes', async () => {
    jest.useFakeTimers();
    installFakeApi({ 'GET /items': () => page([1]) });
    await renderExplore();
    await fireEvent.changeText(screen.getByPlaceholderText(t.placeholder), 'taladro');
    await act(async () => {
      jest.advanceTimersByTime(399);
    });
    expect(mockSetParams).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(mockSetParams).toHaveBeenCalledTimes(1);
    expect(mockSetParams).toHaveBeenCalledWith(expect.objectContaining({ q: 'taladro' }));
  });

  it('con texto en la ruta pide la consulta con q y muestra los resultados', async () => {
    mockParams = { q: 'taladro' };
    const { calls } = installFakeApi({ 'GET /items': () => page([7]) });
    await renderExplore();
    await waitFor(() => expect(screen.getByText('Objeto 7')).toBeTruthy());
    expect(calls.at(-1)?.query).toBe('limit=20&q=taladro');
    expect(screen.queryByText(t.popularProjects)).toBeNull();
    expect(screen.getByPlaceholderText(t.placeholder).props.value).toBe('taladro');
  });

  it('un solo carácter no consulta con texto', async () => {
    mockParams = { q: 'a' };
    const { calls } = installFakeApi({ 'GET /items': () => page([1]) });
    await renderExplore();
    await waitFor(() => expect(screen.getByText('Objeto 1')).toBeTruthy());
    expect(calls.at(-1)?.query).toBe('limit=20');
  });

  it('CA-07: «necesito colgar un cuadro» muestra la tarjeta del proyecto y la abre', async () => {
    mockParams = { q: 'necesito colgar un cuadro' };
    installFakeApi({ 'GET /items': () => page([1]) });
    await renderExplore();
    const projectCard = screen.getByRole('button', { name: /Colgar un cuadro/ });
    expect(screen.getByText(es.projects.label)).toBeTruthy();
    await fireEvent.press(projectCard);
    expect(mockPush).toHaveBeenCalledWith(routes.project('colgar-un-cuadro'));
  });

  it('un texto sin relación con proyectos no muestra tarjeta de proyecto', async () => {
    mockParams = { q: 'xyz' };
    installFakeApi({ 'GET /items': () => page([1]) });
    await renderExplore();
    expect(screen.queryByText(es.projects.label)).toBeNull();
  });

  it('CA-06: sin resultados muestra el vacío y «Limpiar filtros» borra texto y filtros', async () => {
    mockParams = { q: 'zzz', category: 'hogar' };
    installFakeApi({ 'GET /items': () => page([]) });
    await renderExplore();
    await waitFor(() => expect(screen.getByText(t.state.emptyTitle)).toBeTruthy());
    await fireEvent.press(screen.getByRole('button', { name: t.state.clearFilters }));
    expect(mockSetParams).toHaveBeenCalledWith({
      q: undefined,
      category: undefined,
      modality: undefined,
      municipality: undefined,
      from: undefined,
      to: undefined,
      radiusKm: undefined,
    });
    expect(screen.getByPlaceholderText(t.placeholder).props.value).toBe('');
  });

  it('elegir una categoría escribe el filtro en la ruta; «Todo» lo quita', async () => {
    mockParams = { category: 'hogar' };
    installFakeApi({
      'GET /items': () => page([1]),
      'GET /categories': () => ok(fakeCategories),
    });
    await renderExplore();
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Hogar' })).toBeTruthy());
    await fireEvent.press(screen.getByRole('radio', { name: 'Herramientas manuales' }));
    expect(mockSetParams).toHaveBeenLastCalledWith(
      expect.objectContaining({ category: 'herramientas_manuales' }),
    );
    await fireEvent.press(screen.getByRole('radio', { name: t.allCategories }));
    expect(mockSetParams).toHaveBeenLastCalledWith(
      expect.objectContaining({ category: undefined }),
    );
  });

  it('la consulta incluye la categoría de la ruta y el botón de filtros cuenta uno', async () => {
    mockParams = { category: 'hogar' };
    const { calls } = installFakeApi({
      'GET /items': () => page([1]),
      'GET /categories': () => ok(fakeCategories),
    });
    await renderExplore();
    await waitFor(() => expect(screen.getByText('Objeto 1')).toBeTruthy());
    expect(calls.find((call) => call.path === '/items')?.query).toBe('limit=20&category=hogar');
    expect(
      screen.getByRole('button', { name: `${t.filtersButton}, 1 ${t.filtersActive}` }),
    ).toBeTruthy();
  });
});

describe('ExploreScreen · filtros y distancia', () => {
  const ALL_EMPTY = {
    q: undefined,
    category: undefined,
    modality: undefined,
    municipality: undefined,
    from: undefined,
    to: undefined,
    radiusKm: undefined,
  };

  it('CA-03: aplicar la hoja escribe los filtros en la ruta y conserva el texto', async () => {
    mockParams = { q: 'taladro' };
    installFakeApi({
      'GET /items': () => page([1]),
      'GET /categories': () => ok(fakeCategories),
    });
    await renderExplore();
    await fireEvent.press(screen.getByRole('button', { name: t.filtersButton }));
    expect(screen.getByRole('header', { name: t.filters.title })).toBeTruthy();

    await fireEvent.press(screen.getByRole('tab', { name: es.items.modality.rent }));
    await fireEvent.changeText(
      screen.getByPlaceholderText(t.filters.municipalityPlaceholder),
      'Coyoacán',
    );
    await fireEvent.press(screen.getByRole('button', { name: t.filters.apply }));

    expect(mockSetParams).toHaveBeenCalledWith({
      ...ALL_EMPTY,
      q: 'taladro',
      modality: 'rent',
      municipality: 'Coyoacán',
    });
  });

  it('CA-03: con fechas en la ruta, la consulta lleva from y to', async () => {
    mockParams = { from: '2026-11-14', to: '2026-11-16' };
    const { calls } = installFakeApi({ 'GET /items': () => page([1]) });
    await renderExplore();
    await waitFor(() => expect(screen.getByText('Objeto 1')).toBeTruthy());
    expect(calls.find((call) => call.path === '/items')?.query).toBe(
      'limit=20&from=2026-11-14&to=2026-11-16',
    );
    expect(
      screen.getByRole('button', { name: `${t.filtersButton}, 1 ${t.filtersActive}` }),
    ).toBeTruthy();
  });

  it('RF-04: con permiso concedido, el radio de la ruta consulta con posición redondeada y muestra «~N km»', async () => {
    mockParams = { radiusKm: '3' };
    jest.mocked(Location.getForegroundPermissionsAsync).mockResolvedValue(permissionOf(true));
    jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue(permissionOf(true));
    jest
      .mocked(Location.getCurrentPositionAsync)
      .mockResolvedValue({ coords: { latitude: 19.4326077, longitude: -99.133208 } } as never);
    const { calls } = installFakeApi({
      'GET /items': () =>
        ok({
          items: [{ ...card(1), distanceKm: 1.6, owner: { ratingAverage: 4.9 } }],
          nextCursor: null,
        }),
    });
    await renderExplore();
    expect(await screen.findByText('~2 km · ★ 4.9')).toBeTruthy();
    const queries = calls.filter((call) => call.path === '/items').map((call) => call.query);
    expect(queries).toEqual(['limit=20&lat=19.43&lng=-99.13&radiusKm=3']);
  });

  it('CA-04: con el permiso negado se quita el radio, la búsqueda sigue y el filtro no aparece', async () => {
    mockParams = { radiusKm: '5', q: 'sierra' };
    jest
      .mocked(Location.getForegroundPermissionsAsync)
      .mockResolvedValue(permissionOf(false, false));
    const { calls } = installFakeApi({
      'GET /items': () => page([1]),
      'GET /categories': () => ok(fakeCategories),
    });
    await renderExplore();
    await waitFor(() =>
      expect(mockSetParams).toHaveBeenCalledWith(
        expect.objectContaining({ radiusKm: undefined, q: 'sierra' }),
      ),
    );
    await fireEvent.press(screen.getByRole('button', { name: /^Filtros/ }));
    expect(screen.queryByText(t.filters.distance)).toBeNull();
    expect(calls.every((call) => !call.query.includes('lat='))).toBe(true);
  });

  it('CA-04: negar el permiso al elegir un radio oculta el filtro sin aplicar nada', async () => {
    jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue(permissionOf(false));
    installFakeApi({
      'GET /items': () => page([1]),
      'GET /categories': () => ok(fakeCategories),
    });
    await renderExplore();
    await fireEvent.press(screen.getByRole('button', { name: t.filtersButton }));
    await fireEvent.press(screen.getByRole('radio', { name: '3 km' }));
    await waitFor(() => expect(screen.queryByRole('radio', { name: '3 km' })).toBeNull());
    expect(screen.queryByText(t.filters.distance)).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: t.filters.apply }));
    expect(mockSetParams).toHaveBeenCalledWith(expect.objectContaining({ radiusKm: undefined }));
    expect(screen.getByPlaceholderText(t.placeholder)).toBeTruthy();
  });

  it('elegir un radio con permiso lo aplica desde la hoja', async () => {
    jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue(permissionOf(true));
    jest
      .mocked(Location.getCurrentPositionAsync)
      .mockResolvedValue({ coords: { latitude: 19.4, longitude: -99.1 } } as never);
    installFakeApi({
      'GET /items': () => page([1]),
      'GET /categories': () => ok(fakeCategories),
    });
    await renderExplore();
    await fireEvent.press(screen.getByRole('button', { name: t.filtersButton }));
    await fireEvent.press(screen.getByRole('radio', { name: '10 km' }));
    await waitFor(() =>
      expect(screen.getByRole('radio', { name: '10 km' }).props.accessibilityState).toEqual({
        selected: true,
      }),
    );
    await fireEvent.press(screen.getByRole('button', { name: t.filters.apply }));
    expect(mockSetParams).toHaveBeenCalledWith(expect.objectContaining({ radiusKm: '10' }));
  });
});
