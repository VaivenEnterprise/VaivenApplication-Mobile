import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OfflineBanner } from '@/features/connectivity/OfflineBanner';
import { PROBE_BACKOFF_MS, RECOVERED_VISIBLE_MS } from '@/features/connectivity/useOnline';
import { getHealth } from '@/features/diagnostics/api/getHealth';
import { ApiError } from '@/lib/api/errors';
import { es } from '@/i18n/es-MX';

jest.mock('@/features/diagnostics/api/getHealth', () => ({ getHealth: jest.fn() }));

const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 24, left: 0, right: 0, bottom: 0 },
};
const networkError = () => new ApiError('network_error', 'x', null, null);

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

async function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <QueryClientProvider client={client}>
        <OfflineBanner />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
  return client;
}

const failQuery = (client: QueryClient) =>
  act(async () => {
    await client
      .fetchQuery({ queryKey: ['x'], queryFn: () => Promise.reject(networkError()), retry: false })
      .catch(() => undefined);
  });

describe('OfflineBanner', () => {
  it('en línea no muestra nada', async () => {
    await mount();
    expect(screen.queryByTestId('offline-banner')).toBeNull();
  });

  it('CA-02: sin conexión muestra el aviso con el indicador de reintento y deja el flujo libre', async () => {
    const client = await mount();
    await failQuery(client);
    expect(screen.getByText(es.connectivity.offline)).toBeTruthy();
    expect(screen.getByLabelText(es.connectivity.retrying)).toBeTruthy();
    // El aviso incluye la barra de estado, así que no tapa los encabezados.
    expect(screen.getByTestId('offline-banner').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ paddingTop: 24 })]),
    );
  });

  it('al volver muestra «De vuelta en línea» 2 s y desaparece', async () => {
    jest.mocked(getHealth).mockResolvedValue({ status: 'ok' });
    const client = await mount();
    await failQuery(client);
    await act(async () => {
      jest.advanceTimersByTime(PROBE_BACKOFF_MS[0]);
    });
    expect(screen.getByText(es.connectivity.backOnline)).toBeTruthy();
    expect(screen.queryByLabelText(es.connectivity.retrying)).toBeNull();
    await act(async () => {
      jest.advanceTimersByTime(RECOVERED_VISIBLE_MS);
    });
    expect(screen.queryByTestId('offline-banner')).toBeNull();
  });
});
