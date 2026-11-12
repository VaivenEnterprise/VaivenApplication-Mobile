/// <reference types="node" />
import { fireEvent, renderRouter, screen, testRouter, waitFor } from 'expo-router/testing-library';
import path from 'node:path';
import { REFRESH_TOKEN_KEY } from '@/features/auth/session';
import { es } from '@/i18n/es-MX';
import { resetAuthInterceptor } from '@/lib/api/authInterceptor';
import {
  failure,
  fakeTokens,
  fakeUser,
  installFakeApi,
  installMemorySecureStore,
  ok,
} from '@/test/fakeApi';

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
  configResult: { ok: true, config: { apiBaseUrl: 'http://api.test', appEnv: 'development' } },
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const APP_DIR = path.resolve(__dirname, 'app');
const TAB_LABELS = [
  es.tabs.home,
  es.tabs.explore,
  es.tabs.myItems,
  es.tabs.activity,
  es.tabs.profile,
] as const;

const sessionApi = {
  'POST /auth/refresh': () => ok({ tokens: fakeTokens(2) }),
  'GET /me': () => ok(fakeUser),
  'GET /items': () => ok({ items: [], nextCursor: null }),
  'GET /me/items': () => ok({ items: [], nextCursor: null }),
  'GET /categories': () => ok([]),
  'GET /me/bookings': () => ok({ items: [], nextCursor: null }),
};

beforeEach(() => {
  resetAuthInterceptor();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('auth gate (RF-04)', () => {
  it('sin sesión solo se ven las rutas (auth)', async () => {
    installMemorySecureStore();
    installFakeApi({});
    await renderRouter(APP_DIR);
    await waitFor(() => expect(screen).toHavePathname('/login'));
    expect(await screen.findByRole('button', { name: es.auth.login.submit })).toBeTruthy();
    expect(screen.queryByRole('tab')).toBeNull();
  });

  it('sin sesión no se puede entrar a una ruta de pestañas', async () => {
    installMemorySecureStore();
    installFakeApi({});
    await renderRouter(APP_DIR, { initialUrl: '/perfil' });
    await waitFor(() => expect(screen).toHavePathname('/login'));
    expect(screen.queryByRole('tab')).toBeNull();
  });

  it('muestra la pantalla de carga mientras restaura la sesión, sin parpadeo de inicio de sesión', async () => {
    installMemorySecureStore({ [REFRESH_TOKEN_KEY]: 'refresh-1' });
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    installFakeApi({
      ...sessionApi,
      'POST /auth/refresh': async () => {
        await gate;
        return ok({ tokens: fakeTokens(2) });
      },
    });
    await renderRouter(APP_DIR);
    expect(screen.getByLabelText(es.auth.restoring, { hidden: true })).toBeTruthy();
    expect(screen.queryByRole('button', { name: es.auth.login.submit })).toBeNull();
    release();
    await waitFor(() => expect(screen).toHavePathname('/inicio'));
  });

  it('CA-02: con sesión guardada entra directo a las pestañas sin pedir datos', async () => {
    installMemorySecureStore({ [REFRESH_TOKEN_KEY]: 'refresh-1' });
    installFakeApi(sessionApi);
    await renderRouter(APP_DIR);
    await waitFor(() => expect(screen).toHavePathname('/inicio'));
    expect(screen.queryByRole('button', { name: es.auth.login.submit })).toBeNull();
  });

  it('con el token guardado vencido vuelve a inicio de sesión', async () => {
    installMemorySecureStore({ [REFRESH_TOKEN_KEY]: 'refresh-viejo' });
    installFakeApi({ 'POST /auth/refresh': () => failure(401, 'unauthorized') });
    await renderRouter(APP_DIR);
    await waitFor(() => expect(screen).toHavePathname('/login'));
  });

  it('cuenta suspendida: aviso con la fecha y «Entendido» lleva a inicio de sesión', async () => {
    installMemorySecureStore({ [REFRESH_TOKEN_KEY]: 'refresh-1' });
    installFakeApi({
      'POST /auth/refresh': () => ok({ tokens: fakeTokens(2) }),
      'GET /me': () =>
        failure(403, 'forbidden', [{ field: 'suspendedUntil', issue: '2026-12-01T18:00:00Z' }]),
    });
    await renderRouter(APP_DIR);
    expect(await screen.findByText(es.auth.suspended.title)).toBeTruthy();
    expect(screen.getByText(/Hasta el 1 de diciembre de 2026/)).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: es.auth.suspended.action }));
    await waitFor(() => expect(screen).toHavePathname('/login'));
  });
});

describe('pestañas (RF-05, RF-13)', () => {
  async function openSignedIn(initialUrl?: string) {
    installMemorySecureStore({ [REFRESH_TOKEN_KEY]: 'refresh-1' });
    installFakeApi(sessionApi);
    await renderRouter(APP_DIR, initialUrl === undefined ? {} : { initialUrl });
    await waitFor(() => expect(screen.getAllByRole('tab').length).toBeGreaterThan(0));
  }

  it('CA-10: la barra tiene cinco etiquetas y ninguna es «Mensajes»', async () => {
    await openSignedIn();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.props.accessibilityLabel)).toEqual([...TAB_LABELS]);
    expect(screen.queryByRole('tab', { name: es.tabs.messages })).toBeNull();
  });

  it('la pestaña activa se anuncia como seleccionada', async () => {
    await openSignedIn();
    expect(screen.getByRole('tab', { name: es.tabs.home, selected: true })).toBeTruthy();
    expect(screen.getByRole('tab', { name: es.tabs.explore, selected: false })).toBeTruthy();
  });

  it('CA-06: «Actividad» abre la lista real de la spec 007', async () => {
    await openSignedIn();
    await fireEvent.press(screen.getByRole('tab', { name: es.tabs.activity }));
    await waitFor(() => expect(screen).toHavePathname('/actividad'));
    expect(screen.getByRole('tab', { name: es.tabs.activity, selected: true })).toBeTruthy();
    expect(await screen.findByText(es.bookings.activity.emptyRequesterTitle)).toBeTruthy();
    expect(screen.queryByText(es.tabs.soon)).toBeNull();
  });

  it('«Explorar» abre la búsqueda real de la spec 006', async () => {
    await openSignedIn();
    await fireEvent.press(screen.getByRole('tab', { name: es.tabs.explore }));
    await waitFor(() => expect(screen).toHavePathname('/explorar'));
    expect(screen.getByRole('tab', { name: es.tabs.explore, selected: true })).toBeTruthy();
    expect(await screen.findByPlaceholderText(es.search.placeholder)).toBeTruthy();
    expect(screen.getByText(es.search.popularProjects)).toBeTruthy();
    expect(screen.queryByText(es.tabs.soon)).toBeNull();
  });

  it('«Mis objetos» abre la lista real de la spec 005', async () => {
    await openSignedIn();
    await fireEvent.press(screen.getByRole('tab', { name: es.tabs.myItems }));
    await waitFor(() => expect(screen).toHavePathname('/mis-objetos'));
    expect(screen.getByRole('tab', { name: es.tabs.myItems, selected: true })).toBeTruthy();
    expect(await screen.findByText(es.items.list.emptyTitle)).toBeTruthy();
  });

  it('las rutas de publicar y editar objeto existen dentro de Mis objetos', async () => {
    await openSignedIn();
    await testRouter.navigate('/mis-objetos/nuevo');
    expect(await screen.findByRole('header', { name: es.items.form.createTitle })).toBeTruthy();
    await testRouter.navigate('/mis-objetos/abc/editar');
    expect(await screen.findByText(es.items.detail.notFoundTitle)).toBeTruthy();
  });

  it('la ruta Mensajes existe aunque no aparezca en la barra', async () => {
    await openSignedIn();
    await testRouter.navigate('/mensajes');
    expect(await screen.findByText(es.tabs.soon)).toBeTruthy();
    expect(screen.queryByRole('tab', { name: es.tabs.messages })).toBeNull();
  });

  it('el detalle de objeto, el de reserva y el de proyecto son reales (specs 005 y 007)', async () => {
    await openSignedIn();
    await testRouter.navigate('/objeto/abc');
    expect(await screen.findByText(es.items.detail.notFoundTitle)).toBeTruthy();
    await testRouter.navigate('/reserva/abc');
    expect(await screen.findByText(es.bookings.detail.notFoundTitle)).toBeTruthy();
    await testRouter.navigate('/proyecto/no-existe');
    expect(await screen.findByText(es.bookings.guide.notFoundTitle)).toBeTruthy();
    expect(screen.queryByText(es.tabs.placeholder.project)).toBeNull();
  });
});
