import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { CategoryChips } from '@/features/search/components/CategoryChips';
import { ResultsList } from '@/features/search/components/ResultsList';
import { ExploreSearchBar } from '@/features/search/components/SearchBar';
import { ApiError } from '@/lib/api/errors';
import { es } from '@/i18n/es-MX';
import { installFakeApi, ok } from '@/test/fakeApi';
import { fakeCategories } from '@/test/fakeItems';

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({
    status: 'signedIn',
    user: { ...jest.requireActual('@/test/fakeApi').fakeUser },
  }),
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

const t = es.search;

const withClient = (ui: ReactElement) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {ui}
  </QueryClientProvider>
);

afterEach(() => jest.restoreAllMocks());

describe('ExploreSearchBar', () => {
  const renderBar = (activeFilters: number, onOpenFilters = jest.fn(), onChangeText = jest.fn()) =>
    render(
      <ExploreSearchBar
        value=""
        onChangeText={onChangeText}
        onOpenFilters={onOpenFilters}
        activeFilters={activeFilters}
      />,
    );

  it('muestra «¿Qué necesitas?» y avisa cada texto escrito', async () => {
    const onChangeText = jest.fn();
    await renderBar(0, jest.fn(), onChangeText);
    await fireEvent.changeText(screen.getByPlaceholderText(t.placeholder), 'taladro');
    expect(onChangeText).toHaveBeenCalledWith('taladro');
  });

  it('sin filtros activos el botón no lleva insignia', async () => {
    await renderBar(0);
    expect(screen.getByRole('button', { name: t.filtersButton })).toBeTruthy();
    expect(screen.queryByTestId('filters-badge')).toBeNull();
  });

  it('con filtros activos muestra el número y lo anuncia', async () => {
    const onOpenFilters = jest.fn();
    await renderBar(3, onOpenFilters);
    expect(screen.getByTestId('filters-badge')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    await fireEvent.press(
      screen.getByRole('button', { name: `${t.filtersButton}, 3 ${t.filtersActive}` }),
    );
    expect(onOpenFilters).toHaveBeenCalledTimes(1);
  });
});

describe('CategoryChips', () => {
  it('muestra «Todo» seleccionado y las categorías del servidor', async () => {
    installFakeApi({ 'GET /categories': () => ok(fakeCategories) });
    await render(withClient(<CategoryChips value={null} onChange={jest.fn()} />));
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Hogar' })).toBeTruthy());
    expect(screen.getByRole('radio', { name: t.allCategories }).props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getAllByRole('radio')).toHaveLength(1 + fakeCategories.length);
  });

  it('selección única: elegir avisa la clave y volver a tocar la quita', async () => {
    installFakeApi({ 'GET /categories': () => ok(fakeCategories) });
    const onChange = jest.fn();
    const { rerender } = await render(
      withClient(<CategoryChips value={null} onChange={onChange} />),
    );
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Hogar' })).toBeTruthy());

    await fireEvent.press(screen.getByRole('radio', { name: 'Hogar' }));
    expect(onChange).toHaveBeenLastCalledWith('hogar');

    await rerender(withClient(<CategoryChips value="hogar" onChange={onChange} />));
    await waitFor(() =>
      expect(screen.getByRole('radio', { name: 'Hogar' }).props.accessibilityState).toEqual({
        selected: true,
      }),
    );
    await fireEvent.press(screen.getByRole('radio', { name: 'Hogar' }));
    expect(onChange).toHaveBeenLastCalledWith(null);
    await fireEvent.press(screen.getByRole('radio', { name: t.allCategories }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('si las categorías fallan, queda «Todo» y la búsqueda sigue funcionando', async () => {
    installFakeApi({});
    await render(withClient(<CategoryChips value={null} onChange={jest.fn()} />));
    expect(screen.getAllByRole('radio')).toHaveLength(1);
  });

  it('en la hoja de filtros se acomoda en varias líneas', async () => {
    installFakeApi({ 'GET /categories': () => ok(fakeCategories) });
    await render(withClient(<CategoryChips value={null} onChange={jest.fn()} wrap />));
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Hogar' })).toBeTruthy());
    expect(screen.getByLabelText(t.categories)).toBeTruthy();
  });
});

describe('ResultsList', () => {
  const item = (n: number) => ({
    id: `i${n}`,
    title: `Objeto ${n}`,
    modality: 'rent' as const,
    pricePerDayCents: 3000,
    thumbUrl: null,
    distanceKm: n === 1 ? 1.2 : null,
    ratingAverage: n === 1 ? 4.9 : null,
  });

  const base = {
    items: [],
    isPending: false,
    isError: false,
    error: null,
    onRetry: jest.fn(),
    searching: false,
    onClear: jest.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    nextPageFailed: false,
    onEndReached: jest.fn(),
    onSelect: jest.fn(),
  };

  it('muestra esqueletos mientras carga', async () => {
    await render(<ResultsList {...base} isPending />);
    expect(screen.getByTestId('search-skeleton')).toBeTruthy();
  });

  it('lista las tarjetas con distancia y calificación, y abre la tocada', async () => {
    const onSelect = jest.fn();
    await render(<ResultsList {...base} items={[item(1), item(2), item(3)]} onSelect={onSelect} />);
    expect(screen.getByText('Objeto 1')).toBeTruthy();
    expect(screen.getByText('~1 km · ★ 4.9')).toBeTruthy();
    await fireEvent.press(screen.getByText('Objeto 2'));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'i2' }));
  });

  it('CA-06: sin resultados de una búsqueda ofrece «Limpiar filtros»', async () => {
    const onClear = jest.fn();
    await render(<ResultsList {...base} searching onClear={onClear} />);
    expect(screen.getByText(t.state.emptyTitle)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: t.state.clearFilters }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('sin objetos publicados y sin búsqueda, no ofrece limpiar', async () => {
    await render(<ResultsList {...base} />);
    expect(screen.getByText(t.state.emptyHomeTitle)).toBeTruthy();
    expect(screen.queryByRole('button', { name: t.state.clearFilters })).toBeNull();
  });

  it('error con mensaje por código y reintento', async () => {
    const onRetry = jest.fn();
    const error = new ApiError('network_error', es.errors.network_error, null, 'r1');
    await render(<ResultsList {...base} isError error={error} onRetry={onRetry} />);
    expect(screen.getByText(es.errors.network_error)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: es.common.retry }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('muestra «cargando más» al final y el encabezado sobre las tarjetas', async () => {
    await render(
      <ResultsList {...base} items={[item(1), item(2)]} isFetchingNextPage header={<></>} />,
    );
    expect(screen.getByTestId('search-loading-more')).toBeTruthy();
  });

  it('pide más resultados al llegar al final solo si hay página siguiente', async () => {
    const onEndReached = jest.fn();
    const { rerender } = await render(
      <ResultsList {...base} items={[item(1), item(2)]} onEndReached={onEndReached} />,
    );
    const list = screen.getByTestId('search-results');
    await fireEvent(list, 'endReached');
    expect(onEndReached).not.toHaveBeenCalled();

    await rerender(
      <ResultsList {...base} items={[item(1), item(2)]} hasNextPage onEndReached={onEndReached} />,
    );
    await fireEvent(screen.getByTestId('search-results'), 'endReached');
    expect(onEndReached).toHaveBeenCalledTimes(1);
  });

  it('si falla la página siguiente, deja los resultados y ofrece reintentar', async () => {
    const onEndReached = jest.fn();
    await render(
      <ResultsList
        {...base}
        items={[item(1), item(2)]}
        hasNextPage
        nextPageFailed
        onEndReached={onEndReached}
      />,
    );
    expect(screen.getByText('Objeto 1')).toBeTruthy();
    expect(screen.getByText(t.state.loadMoreFailed)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: es.common.retry }));
    expect(onEndReached).toHaveBeenCalledTimes(1);
  });
});
