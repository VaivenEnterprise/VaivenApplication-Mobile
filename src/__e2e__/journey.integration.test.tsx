import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { Vibration } from 'react-native';
import { z } from 'zod';
import { request } from '@/lib/api/client';
import { createJourneyBackend, type Phone } from '@/__e2e__/fakeApi';
import { BookingDetailScreen } from '@/features/bookings/screens/BookingDetailScreen';
import { RequestScreen } from '@/features/bookings/screens/RequestScreen';
import '@/features/handover';
import { EvidenceScreen } from '@/features/handover/screens/EvidenceScreen';
import { QrScreen } from '@/features/handover/screens/QrScreen';
import { ScanScreen } from '@/features/handover/screens/ScanScreen';
import '@/features/incidents';
import { es } from '@/i18n/es-MX';
import { BOOKING_ID, ITEM_ID } from '@/test/fakeBookings';
import { FAKE_TOKEN } from '@/test/fakeHandover';
import { fakeUser } from '@/test/fakeApi';

// Prueba de punta a punta de Jest (spec 012 T002, RF-10, plan P-05): una persona solicita, la otra
// acepta, se entrega con QR, se devuelve con QR y se califica, contra un «servidor» con estado que
// valida cada cuerpo contra el contrato. Cada teléfono tiene su propio caché y su propia sesión.

const mockReplace = jest.fn();
const mockDismissTo = jest.fn();
let mockUserId = fakeUser.id;
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: mockReplace,
    dismissTo: mockDismissTo,
  }),
  useIsFocused: () => true,
}));
jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({
    status: 'signedIn',
    user: { ...jest.requireActual('@/test/fakeApi').fakeUser, id: mockUserId },
  }),
}));
jest.mock('@/lib/format/date', () => ({
  ...jest.requireActual<typeof import('@/lib/format/date')>('@/lib/format/date'),
  todayYmd: () => '2026-11-11',
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
// Las fotos tienen sus propias pruebas (spec 004): el recorrido se hace con notas y una foto ya subida.
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
jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: () => null,
  DateTimePickerAndroid: { open: jest.fn() },
}));

jest.setTimeout(120_000);
const tb = es.bookings;
const th = es.handover;
const tr = es.ratings;

/** Una persona = un teléfono = un caché propio. */
function openOn(phone: Phone, node: React.ReactElement) {
  mockUserId = phone === 'owner' ? '6730f1c2a9b3e4d5f6a7b8c9' : '6730f1c2a9b3e4d5f6a7b8aa';
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
  mockDismissTo.mockReset();
  mockScan = undefined;
  jest.spyOn(Vibration, 'vibrate').mockImplementation(() => undefined);
});

describe('recorrido principal de punta a punta (CA-01)', () => {
  it('solicitud → aceptación → entrega con QR → devolución con QR → calificación', async () => {
    const backend = createJourneyBackend();

    // 1. La persona solicitante pide el objeto para mañana.
    backend.as('requester');
    const request = await openOn('requester', <RequestScreen itemId={ITEM_ID} />);
    await fireEvent.press(await screen.findByLabelText(tb.request.tomorrow));
    expect(await screen.findByLabelText('Total: $30.00')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(tb.request.understandA11y));
    await waitFor(() =>
      expect(screen.getByLabelText(tb.request.send).props.accessibilityState.disabled).toBeFalsy(),
    );
    await fireEvent.press(screen.getByLabelText(tb.request.send));
    expect(await screen.findByText(tb.request.seeActivity)).toBeTruthy();
    expect(backend.state.booking?.status).toBe('pending');
    await request.unmount();

    // 2. La persona propietaria la acepta desde su teléfono.
    backend.as('owner');
    const accept = await openOn('owner', <BookingDetailScreen id={BOOKING_ID} />);
    await fireEvent.press(await screen.findByLabelText(tb.actions.accept));
    await fireEvent.press(
      within(screen.getByTestId('bottom-sheet')).getByLabelText(tb.acceptSheet.confirm),
    );
    await waitFor(() => expect(backend.state.booking?.status).toBe('accepted'));
    await waitFor(() => expect(screen.queryByLabelText(tb.actions.accept)).toBeNull());
    await accept.unmount();

    // 3. Entrega: la propietaria registra el estado y muestra el QR; la solicitante lo escanea.
    const evidence = await openOn(
      'owner',
      <EvidenceScreen bookingId={BOOKING_ID} stage="delivery" />,
    );
    await fireEvent.changeText(await screen.findByLabelText(th.evidence.notes), 'Taladro limpio');
    await fireEvent.press(screen.getByText(th.evidence.continue));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
    await evidence.unmount();

    const qr = await openOn('owner', <QrScreen bookingId={BOOKING_ID} stage="delivery" />);
    expect(
      await screen.findByText(`QR:vaiven://qr?b=${BOOKING_ID}&s=delivery&t=${FAKE_TOKEN}`),
    ).toBeTruthy();
    await qr.unmount();

    backend.as('requester');
    const scanner = await openOn(
      'requester',
      <ScanScreen bookingId={BOOKING_ID} stage="delivery" />,
    );
    await screen.findByTestId('camera');
    await scan(backend.state.qrPayload ?? '');
    expect(await screen.findByText(th.scan.doneTitleDelivery)).toBeTruthy();
    expect(backend.state.booking?.status).toBe('in_progress');
    await scanner.unmount();

    // 4. Devolución: al revés; registra y muestra la solicitante, escanea la propietaria.
    const returnEvidence = await openOn(
      'requester',
      <EvidenceScreen bookingId={BOOKING_ID} stage="return" />,
    );
    await fireEvent.changeText(await screen.findByLabelText(th.evidence.notes), 'Sin daños');
    await fireEvent.press(screen.getByText(th.evidence.continue));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(2));
    await returnEvidence.unmount();

    const returnQr = await openOn('requester', <QrScreen bookingId={BOOKING_ID} stage="return" />);
    await screen.findByText(`QR:vaiven://qr?b=${BOOKING_ID}&s=return&t=${FAKE_TOKEN}`);
    await returnQr.unmount();

    backend.as('owner');
    const returnScan = await openOn('owner', <ScanScreen bookingId={BOOKING_ID} stage="return" />);
    await screen.findByTestId('camera');
    await scan(backend.state.qrPayload ?? '');
    expect(await screen.findByText(th.scan.doneTitleReturn)).toBeTruthy();
    expect(backend.state.booking?.status).toBe('completed');
    await returnScan.unmount();

    // 5. La solicitante califica a la propietaria.
    backend.as('requester');
    await openOn('requester', <BookingDetailScreen id={BOOKING_ID} />);
    expect(await screen.findByText(`${tr.card.prompt} Ana López`)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(`4 ${es.ui.outOfFive}`));
    await fireEvent.press(await screen.findByText('Puntual'));
    await fireEvent.press(screen.getByText(tr.sheet.send));
    expect(await screen.findByText(tr.sheet.thanks)).toBeTruthy();
    expect(backend.state.rating).toMatchObject({ score: 4, comment: 'Puntual' });

    // Ningún cuerpo enviado por la app se salió del contrato.
    expect(backend.violations).toEqual([]);
  });

  it('un contrato roto falla la prueba: el servidor rechaza un cuerpo con un campo de más', async () => {
    const backend = createJourneyBackend();
    backend.as('requester');
    await expect(
      request('/bookings', z.unknown(), {
        method: 'POST',
        body: JSON.stringify({
          itemId: ITEM_ID,
          startDate: '2026-11-12',
          endDate: '2026-11-12',
          paymentMode: 'full_on_delivery',
          acceptedTotalCents: 3000,
          extra: true,
        }),
      }),
    ).rejects.toMatchObject({ code: 'validation_failed' });
    expect(backend.violations).toHaveLength(1);
  });
});
