/// <reference types="node" />
import { fireEvent, renderRouter, screen, testRouter, waitFor } from 'expo-router/testing-library';
import path from 'node:path';
import { REFRESH_TOKEN_KEY } from '@/features/auth/session';
import { es } from '@/i18n/es-MX';
import { resetAuthInterceptor } from '@/lib/api/authInterceptor';
import { fakeTokens, fakeUser, installFakeApi, installMemorySecureStore, ok } from '@/test/fakeApi';
import { fakeCategories, fakeItem } from '@/test/fakeItems';

// Prueba de integración (spec 006 T006, qa-mobile): con el router real de la app, escribir →
// una sola petición → resultados → abrir el detalle → volver conserva el texto y los filtros
// (CA-01, CA-02, CA-05). El desplazamiento exacto de la lista no se puede medir en Jest: queda
// para la verificación manual en Expo Go (T010).

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
  configResult: { ok: true, config: { apiBaseUrl: 'http://api.test', appEnv: 'development' } },
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn().mockResolvedValue({ granted: false, canAskAgain: true }),
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

// Con cobertura, el primer montaje del árbol completo de la app tarda más de 5 s en frío.
jest.setTimeout(30_000);

const APP_DIR = path.resolve(__dirname, '../../app');
const t = es.search;

const card = (id: string, title: string, over: Record<string, unknown> = {}) => ({
  id,
  title,
  category: 'herramientas_electricas',
  modality: 'rent',
  pricePerDayCents: 3000,
  thumbUrl: null,
  distanceKm: null,
  owner: { ratingAverage: 4.9 },
  ...over,
});

const RECENT = [card('r1', 'Escalera plegable'), card('r2', 'Podadora')];
const TALADROS = [card('t1', 'Taladro percutor'), card('t2', 'Taladro inalámbrico')];

beforeEach(() => resetAuthInterceptor());
afterEach(() => jest.restoreAllMocks());

function openExplore() {
  installMemorySecureStore({ [REFRESH_TOKEN_KEY]: 'refresh-1' });
  return installFakeApi({
    'POST /auth/refresh': () => ok({ tokens: fakeTokens(2) }),
    'GET /me': () => ok(fakeUser),
    'GET /categories': () => ok(fakeCategories),
    'GET /items': ({ query }) => {
      const params = new URLSearchParams(query);
      if (params.get('q') === 'taladro') return ok({ items: TALADROS, nextCursor: null });
      if (params.get('category') === 'hogar') {
        return ok({
          items: [card('h1', 'Lámpara de pie', { category: 'hogar' })],
          nextCursor: null,
        });
      }
      return ok({ items: RECENT, nextCursor: null });
    },
    'GET /items/t1': () =>
      ok(fakeItem({ id: 't1', title: 'Taladro percutor', category: 'herramientas_electricas' })),
  });
}

const searchCalls = (calls: { path: string; query: string }[]) =>
  calls.filter((call) => call.path === '/items').map((call) => new URLSearchParams(call.query));

describe('Explorar: texto, detalle y regreso (integración)', () => {
  it('CA-01: al abrir Explorar sin filtros veo objetos recientes', async () => {
    const { calls } = openExplore();
    await renderRouter(APP_DIR, { initialUrl: '/explorar' });
    expect(await screen.findByText('Escalera plegable')).toBeTruthy();
    expect(screen.getByText('Podadora')).toBeTruthy();
    expect(screen.getByText(t.popularProjects)).toBeTruthy();
    expect(screen.getByText(t.nearYou)).toBeTruthy();
    expect(searchCalls(calls).map((params) => params.get('q'))).toEqual([null]);
  });

  it('CA-02: escribir «taladro» deja una sola petición con q y cambia la lista', async () => {
    const { calls } = openExplore();
    await renderRouter(APP_DIR, { initialUrl: '/explorar' });
    await screen.findByText('Escalera plegable');
    const input = screen.getByPlaceholderText(t.placeholder);

    for (const partial of ['t', 'ta', 'tal', 'tala', 'talad', 'taladr', 'taladro']) {
      await fireEvent.changeText(input, partial);
    }

    expect(await screen.findByText('Taladro percutor')).toBeTruthy();
    expect(screen).toHaveSearchParams({ q: 'taladro' });
    expect(screen.queryByText('Escalera plegable')).toBeNull();
    const withText = searchCalls(calls).filter((params) => params.has('q'));
    expect(withText.map((params) => params.get('q'))).toEqual(['taladro']);
  });

  it('CA-05: abrir el detalle y volver conserva texto y filtros', async () => {
    const { calls } = openExplore();
    await renderRouter(APP_DIR, { initialUrl: '/explorar' });
    await screen.findByText('Escalera plegable');

    await fireEvent.changeText(screen.getByPlaceholderText(t.placeholder), 'taladro');
    await screen.findByText('Taladro percutor');
    await waitFor(() => expect(screen).toHaveSearchParams({ q: 'taladro' }));

    await fireEvent.press(screen.getByRole('button', { name: /Taladro percutor/ }));
    await waitFor(() => expect(screen).toHavePathname('/objeto/t1'));
    expect(await screen.findByText('Taladro percutor')).toBeTruthy();

    await testRouter.back();
    await waitFor(() => expect(screen).toHavePathname('/explorar'));
    expect(screen).toHaveSearchParams({ q: 'taladro' });
    expect(screen.getByPlaceholderText(t.placeholder).props.value).toBe('taladro');
    expect(await screen.findByText('Taladro inalámbrico')).toBeTruthy();
    expect(screen.queryByText('Escalera plegable')).toBeNull();
    // Volver no cambió la consulta: ninguna petición nueva con otro texto.
    expect(new Set(searchCalls(calls).map((params) => params.get('q')))).toEqual(
      new Set([null, 'taladro']),
    );
  });

  it('elegir una categoría la escribe en la ruta, filtra y sobrevive al detalle', async () => {
    const { calls } = openExplore();
    await renderRouter(APP_DIR, { initialUrl: '/explorar' });
    await screen.findByText('Escalera plegable');

    await fireEvent.press(await screen.findByRole('radio', { name: 'Hogar' }));
    expect(await screen.findByText('Lámpara de pie')).toBeTruthy();
    expect(screen).toHaveSearchParams({ category: 'hogar' });
    expect(screen.getByRole('radio', { name: 'Hogar' }).props.accessibilityState).toEqual({
      selected: true,
    });
    expect(searchCalls(calls).some((params) => params.get('category') === 'hogar')).toBe(true);

    await testRouter.navigate('/objeto/t1');
    await waitFor(() => expect(screen).toHavePathname('/objeto/t1'));
    await testRouter.back();
    await waitFor(() => expect(screen).toHavePathname('/explorar'));
    expect(screen).toHaveSearchParams({ category: 'hogar' });
    expect(screen.getByRole('radio', { name: 'Hogar' }).props.accessibilityState).toEqual({
      selected: true,
    });
  });

  it('CA-07: «necesito colgar un cuadro» muestra el proyecto y al tocarlo abre su pantalla', async () => {
    openExplore();
    await renderRouter(APP_DIR, { initialUrl: '/explorar?q=necesito%20colgar%20un%20cuadro' });
    const projectCard = await screen.findByRole('button', { name: /Colgar un cuadro/ });
    await fireEvent.press(projectCard);
    await waitFor(() => expect(screen).toHavePathname('/proyecto/colgar-un-cuadro'));
  });
});
