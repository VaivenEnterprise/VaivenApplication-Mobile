import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Linking, Vibration } from 'react-native';
import { ScanScreen } from '@/features/handover/screens/ScanScreen';
import { es } from '@/i18n/es-MX';
import { failure, installFakeApi, ok } from '@/test/fakeApi';
import { BOOKING_ID, fakeBooking } from '@/test/fakeBookings';
import { FAKE_TOKEN, fakeRecordedStage } from '@/test/fakeHandover';

const mockReplace = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: mockBack, replace: mockReplace }),
}));
jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));

type Permission = { granted: boolean; canAskAgain: boolean; status: string } | null;
let mockPermission: Permission = null;
const mockRequest = jest.fn();
let mockScan: ((event: { data: string }) => void) | undefined;
jest.mock('expo-camera', () => {
  const { View } = jest.requireActual('react-native');
  return {
    CameraView: (props: { onBarcodeScanned?: (event: { data: string }) => void }) => {
      mockScan = props.onBarcodeScanned;
      return <View testID="camera" />;
    },
    useCameraPermissions: () => [mockPermission, mockRequest],
  };
});

jest.setTimeout(30_000);
const t = es.handover.scan;
const BASE = `/bookings/${BOOKING_ID}`;
const GRANTED = { granted: true, canAskAgain: true, status: 'granted' };
const DENIED = { granted: false, canAskAgain: false, status: 'denied' };
const UNDETERMINED = { granted: false, canAskAgain: true, status: 'undetermined' };
const payload = (over: { b?: string; s?: string; t?: string } = {}) =>
  `vaiven://qr?b=${over.b ?? BOOKING_ID}&s=${over.s ?? 'delivery'}&t=${over.t ?? FAKE_TOKEN}`;

const requester = (over = {}) =>
  fakeBooking({
    status: 'accepted',
    viewerRole: 'requester',
    delivery: fakeRecordedStage(),
    ...over,
  });

function routes(extra: Record<string, () => ReturnType<typeof ok>> = {}) {
  return {
    [`GET ${BASE}`]: () => ok(requester()),
    [`POST ${BASE}/delivery/confirm`]: () => ok(requester({ status: 'in_progress' })),
    ...extra,
  };
}

function show(stage: 'delivery' | 'return' | null = 'delivery') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ScanScreen bookingId={BOOKING_ID} stage={stage} />
    </QueryClientProvider>,
  );
}

async function scan(text: string) {
  await act(async () => {
    mockScan?.({ data: text });
  });
}

beforeEach(() => {
  jest.restoreAllMocks();
  mockReplace.mockReset();
  mockBack.mockReset();
  mockRequest.mockReset();
  mockScan = undefined;
  mockPermission = GRANTED;
  jest.spyOn(Vibration, 'vibrate').mockImplementation(() => undefined);
  jest.mocked(Vibration.vibrate).mockClear();
});

describe('ScanScreen', () => {
  it('lee el QR de la reserva, confirma con el token y muestra el éxito (CA-01)', async () => {
    const api = installFakeApi(routes());
    await show();
    await screen.findByTestId('camera');
    await waitFor(() => expect(mockScan).toBeDefined());
    await scan(payload());
    expect(await screen.findByText(t.doneTitleDelivery)).toBeTruthy();
    const confirm = api.calls.find((c) => c.path === `${BASE}/delivery/confirm`);
    expect(confirm?.body).toEqual({ token: FAKE_TOKEN });
    expect(Vibration.vibrate).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByText(t.done));
    expect(mockReplace).toHaveBeenCalled();
  });

  it('en la devolución muestra «Devolución confirmada» (CA-04)', async () => {
    installFakeApi({
      [`GET ${BASE}`]: () =>
        ok(
          fakeBooking({
            status: 'in_progress',
            viewerRole: 'owner',
            return: fakeRecordedStage(),
          }),
        ),
      [`POST ${BASE}/return/confirm`]: () =>
        ok(fakeBooking({ status: 'completed', viewerRole: 'owner' })),
    });
    await show('return');
    await screen.findByTestId('camera');
    await scan(payload({ s: 'return' }));
    expect(await screen.findByText(t.doneTitleReturn)).toBeTruthy();
  });

  it('rechaza un QR de otra reserva sin llamar al servidor (CA-02)', async () => {
    const api = installFakeApi(routes());
    await show();
    await screen.findByTestId('camera');
    await scan(payload({ b: '6731b1b2c3d4e5f6a7b8c9ff' }));
    expect(await screen.findByText(t.errors.wrong_booking)).toBeTruthy();
    expect(api.calls.some((c) => c.method === 'POST')).toBe(false);
  });

  it.each([
    ['otra etapa', payload({ s: 'return' }), t.errors.wrong_stage],
    ['un QR ajeno', 'https://example.com', t.errors.not_vaiven],
    ['un QR dañado', 'vaiven://qr?b=1', t.errors.malformed],
  ])('explica el rechazo de %s', async (_name, text, message) => {
    installFakeApi(routes());
    await show();
    await screen.findByTestId('camera');
    await scan(text);
    expect(await screen.findByText(message)).toBeTruthy();
  });

  it('procesa un solo código aunque la cámara lo repita, y se reactiva con «Intentar de nuevo»', async () => {
    const api = installFakeApi(
      routes({ [`POST ${BASE}/delivery/confirm`]: () => failure(409, 'conflict') }),
    );
    await show();
    await screen.findByTestId('camera');
    await act(async () => {
      mockScan?.({ data: payload() });
      mockScan?.({ data: payload() });
      mockScan?.({ data: payload() });
    });
    expect(await screen.findByText(t.errors.conflict)).toBeTruthy();
    expect(api.calls.filter((c) => c.method === 'POST')).toHaveLength(1);
    expect(Vibration.vibrate).toHaveBeenCalledTimes(1);

    // Con el resultado en pantalla la cámara deja de procesar.
    expect(mockScan).toBeUndefined();
    await fireEvent.press(screen.getByText(t.retry));
    await waitFor(() => expect(mockScan).toBeDefined());
    await scan(payload());
    await waitFor(() => expect(api.calls.filter((c) => c.method === 'POST')).toHaveLength(2));
  });

  it.each([
    [403, 'forbidden', t.errors.forbidden],
    [404, 'not_found', t.errors.notFound],
    [429, 'rate_limited', t.errors.rateLimited],
  ])('mapea el estado %s del servidor', async (status, code, message) => {
    installFakeApi(routes({ [`POST ${BASE}/delivery/confirm`]: () => failure(status, code) }));
    await show();
    await screen.findByTestId('camera');
    await scan(payload());
    expect(await screen.findByText(message)).toBeTruthy();
  });

  it('sin permiso permite escribir el código a mano y confirmar (CA-07)', async () => {
    mockPermission = DENIED;
    const api = installFakeApi(routes());
    await show();
    expect(await screen.findByText(t.cameraTitle)).toBeTruthy();
    expect(screen.queryByTestId('camera')).toBeNull();

    await fireEvent.press(screen.getByText(t.typeCode));
    const field = await screen.findByLabelText(t.manualLabel);
    await fireEvent.changeText(field, 'corto');
    await fireEvent.press(screen.getByText(t.confirm));
    expect(await screen.findByText(t.manualInvalid)).toBeTruthy();

    await fireEvent.changeText(field, FAKE_TOKEN);
    await fireEvent.press(screen.getByText(t.confirm));
    expect(await screen.findByText(t.doneTitleDelivery)).toBeTruthy();
    expect(api.calls.find((c) => c.path === `${BASE}/delivery/confirm`)?.body).toEqual({
      token: FAKE_TOKEN,
    });
  });

  it('el código escrito con otra reserva se rechaza con su mensaje', async () => {
    mockPermission = DENIED;
    installFakeApi(routes());
    await show();
    await fireEvent.press(await screen.findByText(t.typeCode));
    const field = await screen.findByLabelText(t.manualLabel);
    await fireEvent.changeText(field, payload({ b: '6731b1b2c3d4e5f6a7b8c9ff' }));
    await fireEvent.press(screen.getByText(t.confirm));
    expect(await screen.findByText(t.errors.wrong_booking)).toBeTruthy();
  });

  it('sin permiso y sin posibilidad de preguntar manda a los ajustes', async () => {
    mockPermission = DENIED;
    const open = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    installFakeApi(routes());
    await show();
    await fireEvent.press(await screen.findByText(t.openSettings));
    expect(open).toHaveBeenCalled();
    await fireEvent.press(screen.getByText(t.close));
    expect(mockBack).toHaveBeenCalled();
  });

  it('pide el permiso una sola vez al abrir y «Permitir» lo vuelve a pedir', async () => {
    mockPermission = UNDETERMINED;
    installFakeApi(routes());
    await show();
    await screen.findByText(t.cameraTitle);
    expect(mockRequest).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByText(t.allow));
    expect(mockRequest).toHaveBeenCalledTimes(2);
  });

  it('mientras se resuelve el permiso muestra la carga', async () => {
    mockPermission = null;
    installFakeApi(routes());
    await show();
    expect(await screen.findByText(es.common.loading)).toBeTruthy();
  });

  it('con la cámara activa «X» cierra y «Escribir código» abre la hoja', async () => {
    installFakeApi(routes());
    await show();
    await screen.findByTestId('camera');
    await fireEvent.press(screen.getByLabelText(t.close));
    expect(mockBack).toHaveBeenCalled();
    await fireEvent.press(screen.getByLabelText(t.typeCode));
    expect((await screen.findAllByText(t.manualTitle)).length).toBeGreaterThan(1);
    expect(screen.getByLabelText(t.manualLabel)).toBeTruthy();
  });

  it('quien muestra el código no ve el escáner (CA-05)', async () => {
    installFakeApi({
      [`GET ${BASE}`]: () => ok(requester({ viewerRole: 'owner' })),
    });
    await show();
    expect(await screen.findByText(t.notYours)).toBeTruthy();
    expect(screen.queryByTestId('camera')).toBeNull();
    await fireEvent.press(screen.getByText(es.handover.evidence.notAllowedAction));
    expect(mockReplace).toHaveBeenCalled();
  });

  it('una etapa ya confirmada ofrece volver a la reserva', async () => {
    installFakeApi({ [`GET ${BASE}`]: () => ok(requester({ status: 'in_progress' })) });
    await show();
    expect(await screen.findByText(t.doneTitleDelivery)).toBeTruthy();
    await fireEvent.press(screen.getByText(t.done));
    expect(mockReplace).toHaveBeenCalled();
  });

  it('con una etapa inválida o un error al cargar ofrece salidas', async () => {
    installFakeApi({ [`GET ${BASE}`]: () => failure(500, 'internal') });
    await show(null);
    expect(await screen.findByText(es.handover.evidence.invalidStageTitle)).toBeTruthy();
    await fireEvent.press(screen.getByText(es.handover.evidence.notAllowedAction));
    expect(mockReplace).toHaveBeenCalled();
  });

  it('si la reserva no carga muestra el error con reintento', async () => {
    installFakeApi({ [`GET ${BASE}`]: () => failure(500, 'internal') });
    await show();
    expect(await screen.findByText(es.common.retry)).toBeTruthy();
  });
});
