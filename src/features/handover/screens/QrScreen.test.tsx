import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QrScreen } from '@/features/handover/screens/QrScreen';
import { es } from '@/i18n/es-MX';
import { failure, installFakeApi, ok } from '@/test/fakeApi';
import { BOOKING_ID, fakeBooking } from '@/test/fakeBookings';
import { FAKE_TOKEN, fakeQrToken, fakeRecordedStage, fakeStage } from '@/test/fakeHandover';

const mockReplace = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: mockBack, replace: mockReplace }),
}));
jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
// El dibujo del QR es de la librería; aquí se comprueba qué texto recibe.
jest.mock('react-native-qrcode-svg', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ value }: { value: string }) => <Text>{`QR:${value}`}</Text>,
  };
});

jest.setTimeout(30_000);
const t = es.handover.qr;
const BASE = `/bookings/${BOOKING_ID}`;
const START = new Date('2026-11-12T18:00:00Z');

const owner = (over = {}) =>
  fakeBooking({
    status: 'accepted',
    viewerRole: 'owner',
    delivery: fakeRecordedStage(),
    ...over,
  });

function routes(booking = owner(), extra: Record<string, () => ReturnType<typeof ok>> = {}) {
  return {
    [`GET ${BASE}`]: () => ok(booking),
    [`GET ${BASE}/delivery`]: () =>
      ok(fakeRecordedStage({ qr: { state: 'active', expiresAt: null } })),
    [`POST ${BASE}/delivery/qr`]: () => ({
      status: 201,
      body: fakeQrToken(BOOKING_ID, 'delivery'),
    }),
    ...extra,
  };
}

function show(stage: 'delivery' | 'return' | null = 'delivery') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <QrScreen bookingId={BOOKING_ID} stage={stage} />
    </QueryClientProvider>,
  );
}

const advance = (ms: number) =>
  act(async () => {
    jest.advanceTimersByTime(ms);
  });

beforeEach(() => {
  jest.restoreAllMocks();
  mockReplace.mockReset();
  mockBack.mockReset();
  jest.useFakeTimers({ now: START });
});
afterEach(() => jest.useRealTimers());

describe('QrScreen', () => {
  it('genera el código al abrir, lo dibuja y pide que lo escanee la otra persona', async () => {
    const api = installFakeApi(routes());
    await show();
    expect(
      await screen.findByText(`QR:vaiven://qr?b=${BOOKING_ID}&s=delivery&t=${FAKE_TOKEN}`),
    ).toBeTruthy();
    expect(screen.getByText(t.titleDelivery)).toBeTruthy();
    expect(screen.getByText('15:00')).toBeTruthy();
    expect(screen.getByText(`${t.askToScan} Luis Pérez ${t.askToScanEnd}`)).toBeTruthy();
    expect(api.calls.filter((c) => c.method === 'POST')).toHaveLength(1);
  });

  it('cuenta los 15 minutos y avisa cuando quedan menos de 2', async () => {
    installFakeApi(routes());
    await show();
    await screen.findByText('15:00');
    await advance(13 * 60_000 + 30_000);
    expect(screen.getByText('01:30')).toBeTruthy();
  });

  it('al vencer atenúa el QR y «Generar nuevo» pide otro código (CA-03)', async () => {
    let issued = 0;
    const api = installFakeApi(
      routes(owner(), {
        [`POST ${BASE}/delivery/qr`]: () => {
          issued += 1;
          return {
            status: 201,
            body: fakeQrToken(BOOKING_ID, 'delivery', {
              expiresAt: issued === 1 ? '2026-11-12T18:15:00Z' : '2026-11-12T18:30:00Z',
            }),
          } as never;
        },
      }),
    );
    await show();
    await screen.findByText('15:00');
    await advance(15 * 60_000 + 1000);
    expect(await screen.findByText(t.expired)).toBeTruthy();
    expect(screen.queryByText('00:00')).toBeNull();
    await fireEvent.press(screen.getByText(t.regenerate));
    await waitFor(() => expect(screen.queryByText(t.expired)).toBeNull());
    expect(api.calls.filter((c) => c.method === 'POST')).toHaveLength(2);
    expect(screen.getByText('14:59')).toBeTruthy();
  });

  it('muestra y oculta el código para dictarlo', async () => {
    installFakeApi(routes());
    await show();
    await fireEvent.press(await screen.findByText(t.showCode));
    expect(screen.getByText(FAKE_TOKEN)).toBeTruthy();
    expect(screen.getByText(t.codeHint)).toBeTruthy();
    await fireEvent.press(screen.getByText(t.hideCode));
    expect(screen.queryByText(FAKE_TOKEN)).toBeNull();
  });

  it('consulta la etapa cada 5 s y, al confirmarse, muestra el éxito y vuelve a leer la reserva', async () => {
    let confirmed = false;
    const api = installFakeApi(
      routes(owner(), {
        [`GET ${BASE}/delivery`]: () =>
          ok(
            confirmed
              ? fakeRecordedStage({
                  confirmedAt: '2026-11-12T18:03:00Z',
                  qr: { state: 'used', expiresAt: null },
                })
              : fakeRecordedStage({ qr: { state: 'active', expiresAt: null } }),
          ),
      }),
    );
    await show();
    await screen.findByText('15:00');
    const before = api.calls.filter(
      (c) => c.path === `${BASE}/delivery` && c.method === 'GET',
    ).length;
    confirmed = true;
    await advance(5000);
    expect(await screen.findByText(t.doneTitleDelivery)).toBeTruthy();
    expect(
      api.calls.filter((c) => c.path === `${BASE}/delivery` && c.method === 'GET').length,
    ).toBeGreaterThan(before);
    await waitFor(() =>
      expect(api.calls.filter((c) => c.path === BASE && c.method === 'GET').length).toBeGreaterThan(
        1,
      ),
    );
    await fireEvent.press(screen.getByText(t.done));
    expect(String(mockReplace.mock.calls[0]?.[0])).toContain(`/reserva/${BOOKING_ID}`);
  });

  it('si la etapa ya estaba confirmada abre directo el éxito de la devolución', async () => {
    installFakeApi({
      [`GET ${BASE}`]: () =>
        ok(
          owner({
            status: 'completed',
            viewerRole: 'requester',
            return: fakeRecordedStage({ confirmedAt: '2026-11-14T10:00:00Z' }),
          }),
        ),
    });
    await show('return');
    expect(await screen.findByText(t.doneTitleReturn)).toBeTruthy();
  });

  it('sin evidencia registrada no genera código y manda a registrarla', async () => {
    const api = installFakeApi(routes(owner({ delivery: fakeStage() })));
    await show();
    expect(await screen.findByText(t.needsEvidenceTitle)).toBeTruthy();
    expect(api.calls.some((c) => c.method === 'POST')).toBe(false);
    await fireEvent.press(screen.getByText(t.editEvidence));
    expect(String(mockReplace.mock.calls[0]?.[0])).toContain(
      `/entrega/${BOOKING_ID}/evidencia?stage=delivery`,
    );
  });

  it('si el servidor responde conflicto ofrece editar el estado', async () => {
    installFakeApi(
      routes(owner(), { [`POST ${BASE}/delivery/qr`]: () => failure(409, 'conflict') as never }),
    );
    await show();
    expect(await screen.findByText(t.failedConflict)).toBeTruthy();
    await fireEvent.press(screen.getByText(t.editEvidence));
    expect(mockReplace).toHaveBeenCalled();
  });

  it('si falla otra cosa ofrece reintentar', async () => {
    let calls = 0;
    const api = installFakeApi(
      routes(owner(), {
        [`POST ${BASE}/delivery/qr`]: () => {
          calls += 1;
          return (
            calls === 1
              ? failure(500, 'internal')
              : { status: 201, body: fakeQrToken(BOOKING_ID, 'delivery') }
          ) as never;
        },
      }),
    );
    await show();
    expect(await screen.findByText(t.failed)).toBeTruthy();
    await fireEvent.press(screen.getByText(es.common.retry));
    expect(await screen.findByText('15:00')).toBeTruthy();
    expect(api.calls.filter((c) => c.method === 'POST')).toHaveLength(2);
  });

  it('quien debe escanear no ve el código', async () => {
    const api = installFakeApi(routes(owner({ viewerRole: 'requester' })));
    await show();
    expect(await screen.findByText(es.handover.evidence.notAllowedTitle)).toBeTruthy();
    expect(api.calls.some((c) => c.method === 'POST')).toBe(false);
  });

  it('con una etapa inválida o sin cargar la reserva ofrece salidas', async () => {
    installFakeApi({ [`GET ${BASE}`]: () => failure(500, 'internal') });
    await show();
    expect(await screen.findByText(es.common.retry)).toBeTruthy();
  });

  it('el botón Volver regresa', async () => {
    installFakeApi(routes());
    await show();
    await fireEvent.press(await screen.findByLabelText(es.handover.back));
    expect(mockBack).toHaveBeenCalled();
  });
});
