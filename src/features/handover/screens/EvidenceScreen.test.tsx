import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { EvidenceScreen } from '@/features/handover/screens/EvidenceScreen';
import { es } from '@/i18n/es-MX';
import { failure, installFakeApi, ok } from '@/test/fakeApi';
import { BOOKING_ID, fakeBooking } from '@/test/fakeBookings';
import { fakePhoto, fakeRecordedStage, fakeStage } from '@/test/fakeHandover';

const mockReplace = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: mockBack, replace: mockReplace }),
}));
jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));

// La subida de fotos tiene sus propias pruebas (spec 004): aquí se simula su estado.
type MockUploader = {
  items: unknown[];
  refs: { publicId: string }[];
  isUploading: boolean;
  hasErrors: boolean;
};
let mockUploader: MockUploader;
let mockPurpose: string | null = null;
let mockMax: number | null = null;
jest.mock('@/features/images', () => ({
  useImageUpload: (purpose: string) => {
    mockPurpose = purpose;
    return mockUploader;
  },
  PhotoPicker: ({ max }: { max: number }) => {
    mockMax = max;
    return null;
  },
  RemoteImage: ({
    evidence,
    accessibilityLabel,
  }: {
    evidence?: boolean;
    accessibilityLabel?: string;
  }) => {
    const { Text } = jest.requireActual('react-native');
    return <Text>{`${accessibilityLabel ?? 'foto'}|evidence=${String(evidence)}`}</Text>;
  },
}));

jest.setTimeout(30_000);
const t = es.handover.evidence;
const PUT = `PUT /bookings/${BOOKING_ID}/delivery/evidence`;

const uploader = (over: Partial<MockUploader> = {}): MockUploader => ({
  items: [],
  refs: [],
  isUploading: false,
  hasErrors: false,
  ...over,
});

function show(stage: 'delivery' | 'return' | null = 'delivery') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <EvidenceScreen bookingId={BOOKING_ID} stage={stage} />
    </QueryClientProvider>,
  );
}

const owner = (over = {}) =>
  fakeBooking({ status: 'accepted', viewerRole: 'owner', delivery: fakeStage(), ...over });
const bookingApi = (booking = owner()) => ({ [`GET /bookings/${BOOKING_ID}`]: () => ok(booking) });

beforeEach(() => {
  jest.restoreAllMocks();
  mockReplace.mockReset();
  mockBack.mockReset();
  mockUploader = uploader();
  mockPurpose = null;
  mockMax = null;
});

describe('EvidenceScreen', () => {
  it('sube las fotos con la finalidad evidence y muestra el paso 1 de 2', async () => {
    installFakeApi(bookingApi());
    await show();
    expect(await screen.findByText(t.title)).toBeTruthy();
    expect(screen.getByText(t.step)).toBeTruthy();
    expect(mockPurpose).toBe('evidence');
    expect(mockMax).toBe(5);
  });

  it('no continúa sin fotos ni notas y muestra qué falta', async () => {
    const api = installFakeApi(bookingApi());
    await show();
    await fireEvent.press(await screen.findByText(t.continue));
    expect(await screen.findByText(t.photoHint, { exact: false })).toBeTruthy();
    expect(api.calls.some((c) => c.method === 'PUT')).toBe(false);
  });

  it('pide notas de al menos 3 caracteres aunque haya foto', async () => {
    mockUploader = uploader({ refs: [{ publicId: 'p1' }] });
    const api = installFakeApi(bookingApi());
    await show();
    await fireEvent.changeText(await screen.findByLabelText(t.notes), ' ab ');
    await fireEvent.press(screen.getByText(t.continue));
    expect(await screen.findByText(t.notesHint)).toBeTruthy();
    expect(api.calls.some((c) => c.method === 'PUT')).toBe(false);
  });

  it('guarda notas y fotos y pasa al QR de la misma etapa', async () => {
    mockUploader = uploader({ refs: [{ publicId: 'p1' }, { publicId: 'p2' }] });
    const saved = fakeRecordedStage({ photos: [fakePhoto(1), fakePhoto(2)] });
    const api = installFakeApi({
      ...bookingApi(),
      [PUT]: () => ok(saved),
    });
    await show();
    await fireEvent.changeText(await screen.findByLabelText(t.notes), '  Taladro limpio  ');
    await fireEvent.press(screen.getByText(t.continue));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
    const put = api.calls.find((c) => c.method === 'PUT');
    expect(put?.body).toEqual({
      conditionNotes: 'Taladro limpio',
      photos: [{ publicId: 'p1' }, { publicId: 'p2' }],
    });
    expect(String(mockReplace.mock.calls[0]?.[0])).toContain(
      `/entrega/${BOOKING_ID}/qr?stage=delivery`,
    );
  });

  it('bloquea el botón mientras suben fotos', async () => {
    mockUploader = uploader({ isUploading: true });
    const api = installFakeApi(bookingApi());
    await show();
    const button = await screen.findByText(t.uploading, { exact: false });
    await fireEvent.press(button);
    expect(api.calls.some((c) => c.method === 'PUT')).toBe(false);
  });

  it('al editar muestra lo guardado, deja quitar fotos y reenvía lo que queda', async () => {
    const recorded = fakeRecordedStage({
      photos: [fakePhoto(1), fakePhoto(2)],
      qr: { state: 'active', expiresAt: '2026-11-12T18:15:00Z' },
    });
    const api = installFakeApi({
      ...bookingApi(owner({ delivery: recorded })),
      [PUT]: () => ok(recorded),
    });
    await show();
    expect(await screen.findByText(t.qrWillChange)).toBeTruthy();
    expect(screen.getAllByText(/evidence=true/)).toHaveLength(2);
    expect(mockMax).toBe(5 - 2);
    await fireEvent.press(screen.getByLabelText(`${t.removePhoto} 1`));
    expect(screen.getAllByText(/evidence=true/)).toHaveLength(1);
    expect(mockMax).toBe(4);
    await fireEvent.press(screen.getByText(t.continue));
    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    const put = api.calls.find((c) => c.method === 'PUT');
    expect(put?.body).toEqual({
      conditionNotes: recorded.conditionNotes,
      photos: [{ publicId: fakePhoto(2).publicId }],
    });
  });

  it('muestra el conflicto si la etapa ya se confirmó mientras se editaba', async () => {
    mockUploader = uploader({ refs: [{ publicId: 'p1' }] });
    installFakeApi({ ...bookingApi(), [PUT]: () => failure(409, 'conflict') });
    await show();
    await fireEvent.changeText(await screen.findByLabelText(t.notes), 'Todo en orden');
    await fireEvent.press(screen.getByText(t.continue));
    expect(await screen.findByText(t.saveConflict)).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('muestra un error genérico si el guardado falla y conserva lo escrito', async () => {
    mockUploader = uploader({ refs: [{ publicId: 'p1' }] });
    installFakeApi({ ...bookingApi(), [PUT]: () => failure(500, 'internal') });
    await show();
    const notes = await screen.findByLabelText(t.notes);
    await fireEvent.changeText(notes, 'Todo en orden');
    await fireEvent.press(screen.getByText(t.continue));
    expect(await screen.findByText(t.saveFailed)).toBeTruthy();
    expect(screen.getByLabelText(t.notes).props.value).toBe('Todo en orden');
  });

  it('no deja registrar a quien no le toca (la persona que solicita en la entrega)', async () => {
    installFakeApi(bookingApi(owner({ viewerRole: 'requester' })));
    await show();
    expect(await screen.findByText(t.notAllowedTitle)).toBeTruthy();
    expect(screen.queryByText(t.continue)).toBeNull();
  });

  it('no deja editar una etapa ya confirmada', async () => {
    installFakeApi(
      bookingApi(
        owner({
          status: 'in_progress',
          delivery: fakeRecordedStage({ confirmedAt: '2026-11-12T17:00:00Z' }),
        }),
      ),
    );
    await show();
    expect(await screen.findByText(t.notAllowedTitle)).toBeTruthy();
  });

  it('en la devolución registra quien solicitó', async () => {
    installFakeApi({
      [`GET /bookings/${BOOKING_ID}`]: () =>
        ok(owner({ status: 'in_progress', viewerRole: 'requester', return: fakeStage() })),
    });
    await show('return');
    expect(await screen.findByText(t.continue)).toBeTruthy();
  });

  it('con una etapa inválida ofrece volver a la reserva', async () => {
    installFakeApi(bookingApi());
    await show(null);
    await fireEvent.press(await screen.findByText(t.notAllowedAction));
    expect(String(mockReplace.mock.calls[0]?.[0])).toContain(`/reserva/${BOOKING_ID}`);
  });

  it('ofrece reintentar si la reserva no carga', async () => {
    installFakeApi({ [`GET /bookings/${BOOKING_ID}`]: () => failure(500, 'internal') });
    await show();
    expect(await screen.findByText(es.common.retry)).toBeTruthy();
  });

  it('el botón Volver regresa a la pantalla anterior', async () => {
    installFakeApi(bookingApi());
    await show();
    await fireEvent.press(await screen.findByLabelText(es.handover.back));
    expect(mockBack).toHaveBeenCalled();
  });
});
