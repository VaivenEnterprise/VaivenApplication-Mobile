import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { ClearHistoryRow } from '@/features/recommendations/components/ClearHistoryRow';
import { RecommendedCard, reasonText } from '@/features/recommendations/components/RecommendedCard';
import { RecommendedRow } from '@/features/recommendations/components/RecommendedRow';
import type { Recommendation } from '@/features/recommendations/types';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { failure, installFakeApi, ok, type FakeReply } from '@/test/fakeApi';

jest.setTimeout(30_000);

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({ status: 'signedIn', user: { id: 'yo' } }),
}));

const t = es.recommendations;
const NO_CONTENT: FakeReply = { status: 204 };
const ON = { features: { recommendations: true } };

const paid: Recommendation = {
  item: {
    id: 'a1',
    title: 'Taladro percutor 600 W',
    modality: 'rent',
    pricePerDayCents: 9000,
    thumbUrl: 'https://img.test/a.jpg',
  },
  reason: { code: 'similar_to', itemId: 'b1', itemTitle: 'Taladro Bosch' },
};
const free: Recommendation = {
  item: { id: 'a2', title: 'Escalera', modality: 'loan', pricePerDayCents: 0, thumbUrl: null },
  reason: { code: 'popular_nearby' },
};

function wrap(children: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{children}</QueryClientProvider>);
}

beforeEach(() => {
  mockPush.mockReset();
  // El *skeleton* respeta «reducir movimiento»: así no anima durante la prueba.
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
});
afterEach(() => jest.restoreAllMocks());

describe('reasonText', () => {
  it.each([
    [{ code: 'similar_to', itemTitle: 'Taladro Bosch' }, 'Porque viste: Taladro Bosch'],
    [{ code: 'similar_to' }, t.reason.similarToGeneric],
    [{ code: 'similar_to', itemTitle: '' }, t.reason.similarToGeneric],
    [{ code: 'popular_in_category' }, t.reason.popularInCategory],
    [{ code: 'popular_nearby' }, t.reason.popularNearby],
    [{ code: 'popular' }, t.reason.popular],
  ] as const)('arma el texto de %j', (reason, text) => {
    expect(reasonText(reason)).toBe(text);
  });
});

describe('RecommendedCard', () => {
  it('muestra título, precio y el motivo en una línea', async () => {
    await render(<RecommendedCard recommendation={paid} onPress={jest.fn()} />);
    expect(screen.getByText('Taladro percutor 600 W').props.numberOfLines).toBe(1);
    expect(screen.getByText('$90 / día')).toBeTruthy();
    const why = screen.getByText('Porque viste: Taladro Bosch');
    expect(why.props.numberOfLines).toBe(1);
  });

  it('un objeto gratuito muestra «Gratis» y no un precio', async () => {
    await render(<RecommendedCard recommendation={free} onPress={jest.fn()} />);
    expect(screen.getByText(t.free)).toBeTruthy();
    expect(screen.queryByText(/\/ día/)).toBeNull();
    expect(screen.getByText(t.reason.popularNearby)).toBeTruthy();
  });

  it('es un botón accesible con título, precio y motivo, y avisa el id al tocarlo', async () => {
    const onPress = jest.fn();
    await render(<RecommendedCard recommendation={paid} onPress={onPress} />);
    const button = screen.getByRole('button', {
      name: 'Taladro percutor 600 W, $90 por día, Porque viste: Taladro Bosch',
    });
    await fireEvent.press(button);
    expect(onPress).toHaveBeenCalledWith('a1');
  });
});

describe('RecommendedRow', () => {
  it('muestra el título y las tarjetas; al tocar una abre el detalle (CA-01)', async () => {
    installFakeApi({
      'GET /meta': () => ok(ON),
      'GET /recommendations': () => ok({ items: [paid, free], nextCursor: null }),
    });
    await wrap(<RecommendedRow />);
    expect(await screen.findByRole('header', { name: t.title })).toBeTruthy();
    expect(await screen.findByText('Porque viste: Taladro Bosch')).toBeTruthy();
    expect(screen.getAllByRole('button')).toHaveLength(2);
    await fireEvent.press(screen.getByRole('button', { name: /Escalera/ }));
    expect(mockPush).toHaveBeenCalledWith(routes.item('a2'));
  });

  it('mientras carga muestra tres tarjetas de relleno', async () => {
    installFakeApi({
      'GET /meta': () => ok(ON),
      'GET /recommendations': () => new Promise(() => {}),
    });
    await wrap(<RecommendedRow />);
    expect(await screen.findByTestId('recommended-loading')).toBeTruthy();
    expect(screen.getByRole('header', { name: t.title })).toBeTruthy();
  });

  it.each([
    ['la función apagada', { 'GET /meta': () => ok({ features: { recommendations: false } }) }],
    [
      'una lista vacía',
      {
        'GET /meta': () => ok(ON),
        'GET /recommendations': () => ok({ items: [], nextCursor: null }),
      },
    ],
    [
      'un error del servidor',
      {
        'GET /meta': () => ok(ON),
        'GET /recommendations': () => failure(500, 'internal_error'),
      },
    ],
  ])('no muestra nada con %s (CA-04)', async (_name, handlers) => {
    const api = installFakeApi(handlers);
    await wrap(<RecommendedRow />);
    // Se espera a que llegue la respuesta de la lista (si la función está encendida) antes de afirmar.
    const path = 'GET /recommendations' in handlers ? '/recommendations' : '/meta';
    await waitFor(() => expect(api.calls.some((call) => call.path === path)).toBe(true));
    await waitFor(() => expect(screen.queryByTestId('recommended-loading')).toBeNull());
    expect(screen.queryByText(t.title)).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('ClearHistoryRow', () => {
  it('pide confirmación y no borra al cancelar', async () => {
    const api = installFakeApi({ 'DELETE /recommendations/history': () => NO_CONTENT });
    await wrap(<ClearHistoryRow />);
    await fireEvent.press(screen.getByRole('button', { name: t.clear.row }));
    expect(await screen.findByText(t.clear.title)).toBeTruthy();
    expect(screen.getByText(t.clear.body)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: t.clear.cancel }));
    expect(api.calls).toHaveLength(0);
    expect(screen.queryByText(t.clear.success)).toBeNull();
  });

  it('al confirmar borra el historial y avisa «Historial borrado» (CA-03)', async () => {
    const api = installFakeApi({ 'DELETE /recommendations/history': () => NO_CONTENT });
    await wrap(<ClearHistoryRow />);
    await fireEvent.press(screen.getByRole('button', { name: t.clear.row }));
    await fireEvent.press(await screen.findByRole('button', { name: t.clear.confirm }));
    expect(await screen.findByText(t.clear.success)).toBeTruthy();
    expect(api.calls.filter((call) => call.method === 'DELETE')).toHaveLength(1);
  });

  it('si falla muestra un aviso con salida y no el de éxito', async () => {
    installFakeApi({ 'DELETE /recommendations/history': () => failure(500, 'internal_error') });
    await wrap(<ClearHistoryRow />);
    await fireEvent.press(screen.getByRole('button', { name: t.clear.row }));
    await fireEvent.press(await screen.findByRole('button', { name: t.clear.confirm }));
    expect(await screen.findByText(t.clear.error)).toBeTruthy();
    expect(screen.queryByText(t.clear.success)).toBeNull();
  });
});
