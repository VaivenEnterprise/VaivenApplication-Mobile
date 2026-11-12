import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { ProjectScreen } from '@/features/project-guide/screens/ProjectScreen';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { failure, installFakeApi, ok } from '@/test/fakeApi';
import { fakeBooking } from '@/test/fakeBookings';

const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
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

const t = es.bookings.guide;
const permissionOf = (granted: boolean, canAskAgain = true) =>
  ({ granted, canAskAgain, status: granted ? 'granted' : 'denied' }) as never;
const ORIGIN = { lat: 19.4326, lng: -99.1332 };

function grantLocation() {
  jest.mocked(Location.getForegroundPermissionsAsync).mockResolvedValue(permissionOf(true));
  jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue(permissionOf(true));
  jest.mocked(Location.getCurrentPositionAsync).mockResolvedValue({
    coords: { latitude: ORIGIN.lat, longitude: ORIGIN.lng },
  } as never);
}
function denyLocation() {
  jest.mocked(Location.getForegroundPermissionsAsync).mockResolvedValue(permissionOf(false, false));
}

const hit = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  title: `Objeto ${id}`,
  modality: 'rent',
  pricePerDayCents: 9000,
  thumbUrl: null,
  distanceKm: 0.3,
  zone: { municipality: 'Coyoacán', neighborhood: 'Del Carmen' },
  approxLocation: { lat: ORIGIN.lat + 0.0027, lng: ORIGIN.lng },
  owner: { id: `u-${id}`, displayName: `Dueño ${id}`, ratingAverage: 4.9, ratingCount: 18 },
  ...over,
});

const BY_TOOL: Record<string, ReturnType<typeof hit>[]> = {
  Taladro: [hit('t1', { distanceKm: 0.3 })],
  Nivel: [
    hit('n1', { distanceKm: 0.8, approxLocation: { lat: ORIGIN.lat, lng: ORIGIN.lng + 0.0076 } }),
  ],
  'Cinta métrica': [
    hit('c1', { distanceKm: 1.2, approxLocation: { lat: ORIGIN.lat - 0.011, lng: ORIGIN.lng } }),
  ],
};

const itemsHandler =
  (overrides: Record<string, ReturnType<typeof hit>[]> = {}) =>
  ({ query }: { query: string }) => {
    const q = new URLSearchParams(query).get('q') ?? '';
    const table = { ...BY_TOOL, ...overrides };
    return ok({ items: table[q] ?? [], nextCursor: null });
  };
const noBookings = () => ok({ items: [], nextCursor: null });

beforeEach(() => {
  mockPush.mockReset();
  mockBack.mockReset();
});
afterEach(() => jest.restoreAllMocks());

function renderScreen(id = 'colgar-un-cuadro') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ProjectScreen id={id} />
    </QueryClientProvider>,
  );
}

describe('ProjectScreen · herramientas y mapa', () => {
  it('CA-08: con ubicación, cada herramienta muestra persona y distancia y hay un pin numerado', async () => {
    grantLocation();
    const api = installFakeApi({ 'GET /items': itemsHandler(), 'GET /me/bookings': noBookings });
    await renderScreen();
    expect(await screen.findByText('Dueño t1 · ~300 m')).toBeTruthy();
    expect(screen.getByText('Dueño n1 · ~800 m')).toBeTruthy();
    expect(screen.getByText('Dueño c1 · ~1.2 km')).toBeTruthy();
    expect(await screen.findByLabelText('Herramienta 1: Taladro, ~300 m')).toBeTruthy();
    expect(screen.getByLabelText('Herramienta 2: Nivel, ~800 m')).toBeTruthy();
    expect(screen.getByLabelText('Herramienta 3: Cinta métrica, ~1.2 km')).toBeTruthy();
    expect(screen.getByText(t.tapPin)).toBeTruthy();
    expect(screen.queryByText(t.locationTitle)).toBeNull();
    // Una consulta por herramienta, con radio de 3 km y límite 3 (RF-13).
    const tools = api.calls.filter((c) => c.path === '/items' && c.query.includes('lat='));
    expect(tools).toHaveLength(3);
    for (const call of tools) {
      const params = new URLSearchParams(call.query);
      expect(params.get('radiusKm')).toBe('3');
      expect(params.get('limit')).toBe('3');
      expect(params.get('lat')).toBe('19.43');
    }
    expect(tools.map((c) => new URLSearchParams(c.query).get('q')).sort()).toEqual([
      'Cinta métrica',
      'Nivel',
      'Taladro',
    ]);
  });

  it('no muestra nada de lo descartado en §7.6 (depósito, domicilio, identidad, calles)', async () => {
    grantLocation();
    installFakeApi({ 'GET /items': itemsHandler(), 'GET /me/bookings': noBookings });
    await renderScreen();
    await screen.findByText('Dueño t1 · ~300 m');
    for (const forbidden of [
      /depósito/i,
      /domicilio/i,
      /identidad verificada/i,
      /calle/i,
      /entrega a domicilio/i,
    ]) {
      expect(screen.queryByText(forbidden)).toBeNull();
    }
  });

  it('CA-09: una herramienta sin resultados dice «Nadie cerca» y se puede ampliar a 10 km', async () => {
    grantLocation();
    const api = installFakeApi({
      'GET /items': ({ query }) => {
        const params = new URLSearchParams(query);
        if (params.get('q') === 'Nivel') {
          return ok({
            items: params.get('radiusKm') === '10' ? [hit('n9', { distanceKm: 6.1 })] : [],
            nextCursor: null,
          });
        }
        return itemsHandler()({ query });
      },
      'GET /me/bookings': noBookings,
    });
    await renderScreen();
    expect(await screen.findByText(t.nobody)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(`${t.widenA11y}: Nivel`));
    expect(await screen.findByText('Dueño n9 · ~6.1 km')).toBeTruthy();
    const widened = api.calls.filter((c) => new URLSearchParams(c.query).get('radiusKm') === '10');
    expect(widened).toHaveLength(1);
    expect(new URLSearchParams(widened[0]?.query).get('q')).toBe('Nivel');
    expect(screen.queryByText(t.nobody)).toBeNull();
  });

  it('con 10 km y aun así nadie, ya no ofrece ampliar', async () => {
    grantLocation();
    installFakeApi({
      'GET /items': ({ query }) =>
        new URLSearchParams(query).get('q') === 'Nivel'
          ? ok({ items: [], nextCursor: null })
          : itemsHandler()({ query }),
      'GET /me/bookings': noBookings,
    });
    await renderScreen();
    await fireEvent.press(await screen.findByLabelText(`${t.widenA11y}: Nivel`));
    await waitFor(() => expect(screen.queryByLabelText(`${t.widenA11y}: Nivel`)).toBeNull());
    expect(await screen.findByText(t.nobody)).toBeTruthy();
  });

  it('un error en una herramienta se reintenta sin afectar a las demás', async () => {
    grantLocation();
    let failures = 0;
    installFakeApi({
      'GET /items': ({ query }) => {
        // Solo falla la consulta con ubicación (la primera, sin posición, la reemplaza la segunda).
        const params = new URLSearchParams(query);
        if (params.get('q') === 'Nivel' && params.has('lat') && failures++ === 0) {
          return failure(500, 'internal_error');
        }
        return itemsHandler()({ query });
      },
      'GET /me/bookings': noBookings,
    });
    await renderScreen();
    expect(await screen.findByText('Dueño t1 · ~300 m')).toBeTruthy();
    await fireEvent.press(await screen.findByText(t.retry));
    expect(await screen.findByText('Dueño n1 · ~800 m')).toBeTruthy();
  });

  it('una herramienta sin ubicación aproximada aparece en la lista pero no como pin', async () => {
    grantLocation();
    installFakeApi({
      'GET /items': itemsHandler({ Nivel: [hit('n1', { approxLocation: null })] }),
      'GET /me/bookings': noBookings,
    });
    await renderScreen();
    expect(await screen.findByLabelText('Herramienta 1: Taladro, ~300 m')).toBeTruthy();
    expect(screen.getByText(/^Dueño n1/)).toBeTruthy();
    expect(screen.queryByLabelText(/^Herramienta 2/)).toBeNull();
  });
});

describe('ProjectScreen · fila y pin sincronizados (CA-10)', () => {
  it('tocar un pin selecciona su fila y abre su ficha', async () => {
    grantLocation();
    installFakeApi({ 'GET /items': itemsHandler(), 'GET /me/bookings': noBookings });
    await renderScreen();
    await fireEvent.press(await screen.findByLabelText('Herramienta 2: Nivel, ~800 m'));
    expect(
      screen.getByLabelText('Herramienta 2: Nivel, ~800 m').props.accessibilityState.selected,
    ).toBe(true);
    const sheet = within(screen.getByTestId('bottom-sheet'));
    expect(sheet.getByText('Pin #2')).toBeTruthy();
    expect(sheet.getByText('Objeto n1')).toBeTruthy();
    expect(sheet.getByText('Dueño n1')).toBeTruthy();
    expect(sheet.getByText('$90.00 / día')).toBeTruthy();
    expect(sheet.getByText('Del Carmen · ~800 m')).toBeTruthy();
    expect(screen.getByTestId('tool-row-2')).toHaveStyle({ borderColor: '#1B7A57' });
    expect(screen.getByTestId('tool-row-1')).not.toHaveStyle({ borderColor: '#1B7A57' });
  });

  it('«Conseguir» selecciona el pin y abre la misma ficha', async () => {
    grantLocation();
    installFakeApi({ 'GET /items': itemsHandler(), 'GET /me/bookings': noBookings });
    await renderScreen();
    await fireEvent.press(await screen.findByLabelText(`${t.getItA11y} Taladro`));
    expect(
      screen.getByLabelText('Herramienta 1: Taladro, ~300 m').props.accessibilityState.selected,
    ).toBe(true);
    expect(within(screen.getByTestId('bottom-sheet')).getByText('Pin #1')).toBeTruthy();
  });

  it('desde la ficha, «Solicitar» y «Ver objeto» navegan', async () => {
    grantLocation();
    installFakeApi({ 'GET /items': itemsHandler(), 'GET /me/bookings': noBookings });
    await renderScreen();
    await fireEvent.press(await screen.findByLabelText(`${t.getItA11y} Taladro`));
    await fireEvent.press(within(screen.getByTestId('bottom-sheet')).getByText(t.request));
    expect(mockPush).toHaveBeenCalledWith(routes.request('t1'));
    await fireEvent.press(await screen.findByLabelText(`${t.getItA11y} Taladro`));
    await fireEvent.press(within(screen.getByTestId('bottom-sheet')).getByText(t.viewItem));
    expect(mockPush).toHaveBeenCalledWith(routes.item('t1'));
  });
});

describe('ProjectScreen · paso a paso (CA-11)', () => {
  it('«Terminé mi proyecto» está deshabilitado hasta marcar los 3 pasos', async () => {
    grantLocation();
    installFakeApi({ 'GET /items': itemsHandler(), 'GET /me/bookings': noBookings });
    await renderScreen();
    await screen.findByText('Dueño t1 · ~300 m');
    const finish = () => screen.getByLabelText(t.finish).props.accessibilityState?.disabled;
    expect(finish()).toBe(true);
    expect(screen.getByText(`0 ${t.stepOf} 3`)).toBeTruthy();
    const steps = es.projects.items['colgar-un-cuadro'].steps;
    await fireEvent.press(screen.getByLabelText(`${t.markDone}: ${steps[0].title}`));
    await fireEvent.press(screen.getByLabelText(`${t.markDone}: ${steps[1].title}`));
    expect(finish()).toBe(true);
    expect(screen.getByText(`2 ${t.stepOf} 3`)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(`${t.markDone}: ${steps[2].title}`));
    expect(finish()).toBeFalsy();
    // Desmarcar vuelve a deshabilitarlo.
    await fireEvent.press(screen.getByLabelText(`${t.unmarkDone}: ${steps[1].title}`));
    expect(finish()).toBe(true);
    expect(
      screen.getByLabelText(`${es.bookings.guide.progressLabel}`).props.accessibilityValue.now,
    ).toBe(67);
  });

  it('el paso activo muestra su texto y su tip; los completados, «Listo»', async () => {
    grantLocation();
    installFakeApi({ 'GET /items': itemsHandler(), 'GET /me/bookings': noBookings });
    await renderScreen();
    const steps = es.projects.items['colgar-un-cuadro'].steps;
    expect(await screen.findByText(steps[0].text)).toBeTruthy();
    expect(screen.getByText(`${t.tip}: ${steps[0].tip}`)).toBeTruthy();
    expect(screen.queryByText(steps[1].text)).toBeNull();
    await fireEvent.press(screen.getByLabelText(`${t.markDone}: ${steps[0].title}`));
    expect(screen.getByText(t.done)).toBeTruthy();
    expect(screen.queryByText(steps[0].text)).toBeNull();
    expect(screen.getByText(steps[1].text)).toBeTruthy();
  });

  it('al terminar, la hoja invita a devolver lo pedido y lleva a Actividad', async () => {
    grantLocation();
    installFakeApi({ 'GET /items': itemsHandler(), 'GET /me/bookings': noBookings });
    await renderScreen();
    await screen.findByText('Dueño t1 · ~300 m');
    for (const step of es.projects.items['colgar-un-cuadro'].steps) {
      await fireEvent.press(screen.getByLabelText(`${t.markDone}: ${step.title}`));
    }
    await fireEvent.press(screen.getByLabelText(t.finish));
    const sheet = within(screen.getByTestId('bottom-sheet'));
    expect(sheet.getByText(t.doneTitle)).toBeTruthy();
    expect(sheet.getByText(t.doneBody)).toBeTruthy();
    await fireEvent.press(sheet.getByText(t.returnTools));
    expect(mockPush).toHaveBeenCalledWith(routes.activity);
  });
});

describe('ProjectScreen · sin ubicación (CA-12)', () => {
  it('no hay mapa, se invita a activar la ubicación y las filas muestran la zona', async () => {
    denyLocation();
    const api = installFakeApi({ 'GET /items': itemsHandler(), 'GET /me/bookings': noBookings });
    await renderScreen();
    expect(await screen.findByText(t.locationTitle)).toBeTruthy();
    expect(screen.getByText(t.locationBody)).toBeTruthy();
    expect(screen.queryByTestId('neighborhood-map')).toBeNull();
    expect(screen.queryByText(t.tapPin)).toBeNull();
    // Filas con zona, sin distancia ni «Ampliar»; se puede seguir pidiendo.
    expect(await screen.findByText('Dueño t1 · Del Carmen')).toBeTruthy();
    expect(screen.queryByText(/~300 m/)).toBeNull();
    expect(screen.getByLabelText(`${t.getItA11y} Taladro`)).toBeTruthy();
    const calls = api.calls.filter((c) => c.path === '/items');
    expect(calls).toHaveLength(3);
    for (const call of calls) {
      const params = new URLSearchParams(call.query);
      expect(params.has('lat')).toBe(false);
      expect(params.has('radiusKm')).toBe(false);
    }
  });

  it('desde la invitación se puede pedir «Conseguir» (CA-12: seguir pidiendo)', async () => {
    denyLocation();
    installFakeApi({ 'GET /items': itemsHandler(), 'GET /me/bookings': noBookings });
    await renderScreen();
    await fireEvent.press(await screen.findByLabelText(`${t.getItA11y} Taladro`));
    const sheet = within(screen.getByTestId('bottom-sheet'));
    expect(sheet.getByText('Del Carmen')).toBeTruthy();
    await fireEvent.press(sheet.getByText(t.request));
    expect(mockPush).toHaveBeenCalledWith(routes.request('t1'));
  });

  it('«Activar» pide el permiso y, si se concede, aparece el mapa', async () => {
    jest
      .mocked(Location.getForegroundPermissionsAsync)
      .mockResolvedValue(permissionOf(false, true));
    jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue(permissionOf(true));
    jest.mocked(Location.getCurrentPositionAsync).mockResolvedValue({
      coords: { latitude: ORIGIN.lat, longitude: ORIGIN.lng },
    } as never);
    installFakeApi({ 'GET /items': itemsHandler(), 'GET /me/bookings': noBookings });
    await renderScreen();
    await fireEvent.press(await screen.findByText(t.locationAction));
    expect(await screen.findByLabelText('Herramienta 1: Taladro, ~300 m')).toBeTruthy();
    expect(screen.queryByText(t.locationTitle)).toBeNull();
  });

  it('si el permiso se niega al activar, sigue la invitación', async () => {
    jest
      .mocked(Location.getForegroundPermissionsAsync)
      .mockResolvedValue(permissionOf(false, true));
    jest
      .mocked(Location.requestForegroundPermissionsAsync)
      .mockResolvedValue(permissionOf(false, false));
    installFakeApi({ 'GET /items': itemsHandler(), 'GET /me/bookings': noBookings });
    await renderScreen();
    await fireEvent.press(await screen.findByText(t.locationAction));
    await waitFor(() => expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled());
    expect(screen.getByText(t.locationTitle)).toBeTruthy();
    expect(screen.queryByTestId('neighborhood-map')).toBeNull();
  });
});

describe('ProjectScreen · solicitada (CA-13)', () => {
  it('la herramienta con una solicitud activa aparece como «Solicitada», sin botón', async () => {
    grantLocation();
    installFakeApi({
      'GET /items': itemsHandler(),
      'GET /me/bookings': () =>
        ok({
          items: [fakeBooking({ item: { ...fakeBooking().item, id: 't1' }, status: 'pending' })],
          nextCursor: null,
        }),
    });
    await renderScreen();
    expect(await screen.findByText(t.requested)).toBeTruthy();
    expect(screen.queryByLabelText(`${t.getItA11y} Taladro`)).toBeNull();
    expect(screen.getByLabelText(`${t.getItA11y} Nivel`)).toBeTruthy();
  });

  it('una solicitud ya rechazada no cuenta como solicitada', async () => {
    grantLocation();
    installFakeApi({
      'GET /items': itemsHandler(),
      'GET /me/bookings': () =>
        ok({
          items: [fakeBooking({ item: { ...fakeBooking().item, id: 't1' }, status: 'rejected' })],
          nextCursor: null,
        }),
    });
    await renderScreen();
    expect(await screen.findByLabelText(`${t.getItA11y} Taladro`)).toBeTruthy();
    expect(screen.queryByText(t.requested)).toBeNull();
  });
});

describe('ProjectScreen · encabezado y proyecto desconocido', () => {
  it('muestra el proyecto con tiempo, pasos y dificultad, y el avatar abre el perfil', async () => {
    grantLocation();
    installFakeApi({ 'GET /items': itemsHandler(), 'GET /me/bookings': noBookings });
    await renderScreen();
    expect(await screen.findAllByText('Colgar un cuadro')).not.toHaveLength(0);
    expect(screen.getByText('30 min')).toBeTruthy();
    expect(screen.getByText(`3 ${t.stepsCount}`)).toBeTruthy();
    expect(screen.getByText('Fácil')).toBeTruthy();
    expect(screen.getByText('3 herramientas')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(es.tabs.profile));
    expect(mockPush).toHaveBeenCalledWith(routes.profile);
    await fireEvent.press(screen.getByLabelText(t.back));
    expect(mockBack).toHaveBeenCalled();
  });

  it('un proyecto que no existe lo dice y permite regresar', async () => {
    installFakeApi({});
    await renderScreen('no-existe');
    expect(await screen.findByText(t.notFoundTitle)).toBeTruthy();
    await fireEvent.press(screen.getByText(t.notFoundAction));
    expect(mockBack).toHaveBeenCalled();
  });
});
