import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Vibration } from 'react-native';
import { BookingDetailScreen } from '@/features/bookings/screens/BookingDetailScreen';
import type { Booking, ViewerRole } from '@/features/bookings';
import '@/features/handover';
import { EvidenceScreen } from '@/features/handover/screens/EvidenceScreen';
import { QrScreen } from '@/features/handover/screens/QrScreen';
import { ScanScreen } from '@/features/handover/screens/ScanScreen';
import type { StageName } from '@/features/handover/types';
import { es } from '@/i18n/es-MX';
import { failure, installFakeApi, ok, type FakeHandler } from '@/test/fakeApi';
import { BOOKING_ID, fakeBooking } from '@/test/fakeBookings';
import { FAKE_TOKEN, fakeRecordedStage, fakeStage } from '@/test/fakeHandover';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: mockReplace }),
}));
jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
jest.mock('react-native-qrcode-svg', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ value }: { value: string }) => <Text>{`QR:${value}`}</Text>,
  };
});
let mockScan: ((event: { data: string }) => void) | undefined;
jest.mock('expo-camera', () => {
  const { View } = jest.requireActual('react-native');
  return {
    CameraView: (props: { onBarcodeScanned?: (event: { data: string }) => void }) => {
      mockScan = props.onBarcodeScanned;
      return <View testID="camera" />;
    },
    useCameraPermissions: () => [
      { granted: true, canAskAgain: true, status: 'granted' },
      jest.fn(),
    ],
  };
});
// Las fotos tienen sus propias pruebas (spec 004): el flujo se recorre solo con notas.
jest.mock('@/features/images', () => ({
  useImageUpload: () => ({
    items: [],
    refs: [{ publicId: 'vaiven/evidence/1' }],
    isUploading: false,
    hasErrors: false,
  }),
  PhotoPicker: () => null,
  RemoteImage: () => null,
}));

jest.setTimeout(60_000);
const BASE = `/bookings/${BOOKING_ID}`;
const th = es.handover;

/** El «servidor»: una reserva que cambia con cada llamada y se ve según quién la pida. */
function server() {
  const state: { booking: Booking; payload: string | null } = {
    booking: fakeBooking({ status: 'accepted', delivery: fakeStage(), return: fakeStage() }),
    payload: null,
  };
  let actor: ViewerRole = 'owner';
  const stageHandlers = (stage: StageName): Record<string, FakeHandler> => ({
    [`PUT ${BASE}/${stage}/evidence`]: () => {
      const recorded = fakeRecordedStage();
      state.booking = { ...state.booking, [stage]: recorded };
      return ok(recorded);
    },
    [`GET ${BASE}/${stage}`]: () => ok(state.booking[stage] ?? fakeStage()),
    [`POST ${BASE}/${stage}/qr`]: () => {
      state.payload = `vaiven://qr?b=${BOOKING_ID}&s=${stage}&t=${FAKE_TOKEN}`;
      return {
        status: 201,
        body: {
          token: FAKE_TOKEN,
          qrPayload: state.payload,
          expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
        },
      };
    },
    [`POST ${BASE}/${stage}/confirm`]: () => {
      const confirmedAt = new Date().toISOString();
      state.booking = {
        ...state.booking,
        status: stage === 'delivery' ? 'in_progress' : 'completed',
        [stage]: { ...fakeRecordedStage(), confirmedAt },
      };
      return ok({ ...state.booking, viewerRole: actor });
    },
  });
  const api = installFakeApi({
    [`GET ${BASE}`]: () => ok({ ...state.booking, viewerRole: actor }),
    ...stageHandlers('delivery'),
    ...stageHandlers('return'),
  });
  return {
    state,
    api,
    as(role: ViewerRole) {
      actor = role;
    },
  };
}

/** Cada persona usa su propio teléfono, así que cada pantalla tiene su propio caché. */
function open(node: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

async function scan(text: string) {
  await act(async () => {
    mockScan?.({ data: text });
  });
}

beforeEach(() => {
  jest.restoreAllMocks();
  mockReplace.mockReset();
  mockScan = undefined;
  jest.spyOn(Vibration, 'vibrate').mockImplementation(() => undefined);
});

describe('entrega y devolución de extremo a extremo', () => {
  it('evidencia → QR → escaneo → «en curso»; devolución → «concluida» (CA-01, CA-04)', async () => {
    const backend = server();

    // 1. El propietario registra el estado del objeto y genera el QR.
    backend.as('owner');
    const evidence = await open(<EvidenceScreen bookingId={BOOKING_ID} stage="delivery" />);
    await fireEvent.changeText(await screen.findByLabelText(th.evidence.notes), 'Taladro limpio');
    await fireEvent.press(screen.getByText(th.evidence.continue));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
    expect(String(mockReplace.mock.calls[0]?.[0])).toContain('/qr?stage=delivery');
    await evidence.unmount();

    const qr = await open(<QrScreen bookingId={BOOKING_ID} stage="delivery" />);
    expect(
      await screen.findByText(`QR:vaiven://qr?b=${BOOKING_ID}&s=delivery&t=${FAKE_TOKEN}`),
    ).toBeTruthy();
    await qr.unmount();

    // 2. El solicitante lo escanea y la reserva pasa a «en curso».
    backend.as('requester');
    const scanner = await open(<ScanScreen bookingId={BOOKING_ID} stage="delivery" />);
    await screen.findByTestId('camera');
    await scan(backend.state.payload ?? '');
    expect(await screen.findByText(th.scan.doneTitleDelivery)).toBeTruthy();
    expect(backend.state.booking.status).toBe('in_progress');
    await scanner.unmount();

    const detail = await open(<BookingDetailScreen id={BOOKING_ID} />);
    expect(
      await screen.findByLabelText(new RegExp(`^${th.section.delivery}, ${th.section.stepDone}`)),
    ).toBeTruthy();
    expect(screen.getByLabelText(`${th.section.return}, ${th.section.stepNow}`)).toBeTruthy();
    expect(screen.getByText(th.action.record)).toBeTruthy();
    await detail.unmount();

    // 3. La devolución es al revés: la registra y muestra el solicitante; escanea el propietario.
    const returnEvidence = await open(<EvidenceScreen bookingId={BOOKING_ID} stage="return" />);
    await fireEvent.changeText(await screen.findByLabelText(th.evidence.notes), 'Sin daños');
    await fireEvent.press(screen.getByText(th.evidence.continue));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(2));
    await returnEvidence.unmount();

    const returnQr = await open(<QrScreen bookingId={BOOKING_ID} stage="return" />);
    await screen.findByText(`QR:vaiven://qr?b=${BOOKING_ID}&s=return&t=${FAKE_TOKEN}`);
    await returnQr.unmount();

    backend.as('owner');
    const returnScan = await open(<ScanScreen bookingId={BOOKING_ID} stage="return" />);
    await screen.findByTestId('camera');
    await scan(backend.state.payload ?? '');
    expect(await screen.findByText(th.scan.doneTitleReturn)).toBeTruthy();
    expect(backend.state.booking.status).toBe('completed');
    await returnScan.unmount();

    const finished = await open(<BookingDetailScreen id={BOOKING_ID} />);
    expect(await screen.findByText(th.chip.confirmed)).toBeTruthy();
    await finished.unmount();
  });

  it('rechaza el QR de otra reserva sin tocar la reserva (CA-02)', async () => {
    const backend = server();
    backend.as('requester');
    backend.state.booking = { ...backend.state.booking, delivery: fakeRecordedStage() };
    await open(<ScanScreen bookingId={BOOKING_ID} stage="delivery" />);
    await screen.findByTestId('camera');
    await scan(`vaiven://qr?b=6731b1b2c3d4e5f6a7b8c9ff&s=delivery&t=${FAKE_TOKEN}`);
    expect(await screen.findByText(th.scan.errors.wrong_booking)).toBeTruthy();
    expect(backend.api.calls.some((c) => c.method === 'POST')).toBe(false);
    expect(backend.state.booking.status).toBe('accepted');
  });

  it('un QR vencido o usado se explica y no cambia la reserva (CA-03)', async () => {
    const backend = server();
    backend.as('requester');
    backend.state.booking = { ...backend.state.booking, delivery: fakeRecordedStage() };
    installFakeApi({
      [`GET ${BASE}`]: () => ok({ ...backend.state.booking, viewerRole: 'requester' }),
      [`POST ${BASE}/delivery/confirm`]: () => failure(409, 'conflict'),
    });
    await open(<ScanScreen bookingId={BOOKING_ID} stage="delivery" />);
    await screen.findByTestId('camera');
    await scan(`vaiven://qr?b=${BOOKING_ID}&s=delivery&t=${FAKE_TOKEN}`);
    expect(await screen.findByText(th.scan.errors.conflict)).toBeTruthy();
  });

  it('cada rol ve solo su acción en la entrega (CA-05)', async () => {
    const backend = server();
    backend.state.booking = { ...backend.state.booking, delivery: fakeRecordedStage() };

    backend.as('requester');
    const asRequester = await open(<BookingDetailScreen id={BOOKING_ID} />);
    expect(await screen.findByText(th.action.scan)).toBeTruthy();
    expect(screen.queryByText(th.action.showQr)).toBeNull();
    await asRequester.unmount();

    backend.as('owner');
    await open(<BookingDetailScreen id={BOOKING_ID} />);
    expect(await screen.findByText(th.action.showQr)).toBeTruthy();
    expect(screen.queryByText(th.action.scan)).toBeNull();
  });
});
