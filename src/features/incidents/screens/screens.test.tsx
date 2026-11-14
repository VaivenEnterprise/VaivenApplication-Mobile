import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { IncidentSection } from '@/features/incidents/components/IncidentSection';
import { IncidentsRow } from '@/features/incidents/components/IncidentsRow';
import { IncidentDetailScreen } from '@/features/incidents/screens/IncidentDetailScreen';
import { MyIncidentsScreen } from '@/features/incidents/screens/MyIncidentsScreen';
import { ReportIncidentScreen } from '@/features/incidents/screens/ReportIncidentScreen';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { failure, fakeUser, installFakeApi, ok } from '@/test/fakeApi';
import { BOOKING_ID, fakeBooking } from '@/test/fakeBookings';
import { INCIDENT_ID, fakeEvidence, fakeIncident } from '@/test/fakeTrust';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: mockReplace }),
}));
jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({ user: { id: '6730f1c2a9b3e4d5f6a7b8aa' } }),
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
    variant,
    accessibilityLabel,
  }: {
    evidence?: boolean;
    variant?: string;
    accessibilityLabel?: string;
  }) => {
    const { Text } = jest.requireActual('react-native');
    return (
      <Text>{`foto|${variant ?? 'thumb'}|evidence=${String(evidence)}|${accessibilityLabel ?? ''}`}</Text>
    );
  },
}));

jest.setTimeout(30_000);
const t = es.incidents;
const POST = `POST /bookings/${BOOKING_ID}/incidents`;
const BOOKING = `GET /bookings/${BOOKING_ID}`;
void fakeUser;

const uploader = (over: Partial<MockUploader> = {}): MockUploader => ({
  items: [],
  refs: [],
  isUploading: false,
  hasErrors: false,
  ...over,
});

function withClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  jest.restoreAllMocks();
  mockPush.mockReset();
  mockReplace.mockReset();
  mockBack.mockReset();
  mockUploader = uploader();
  mockPurpose = null;
  mockMax = null;
});

describe('ReportIncidentScreen (RF-05, RF-06, CA-06)', () => {
  const accepted = () => fakeBooking({ status: 'accepted', viewerRole: 'requester' });
  const bookingApi = (booking = accepted()) => ({ [BOOKING]: () => ok(booking) });

  it('una reserva rechazada no se puede reportar (CA-06)', async () => {
    installFakeApi(bookingApi(fakeBooking({ status: 'rejected' })));
    await withClient(<ReportIncidentScreen bookingId={BOOKING_ID} />);
    await waitFor(() => expect(screen.getByText(t.report.notAllowedTitle)).toBeTruthy());
    await fireEvent.press(screen.getByText(t.report.notAllowedAction));
    expect(mockReplace).toHaveBeenCalledWith(routes.booking(BOOKING_ID));
  });

  it('muestra «¿Qué pasó?», los 6 motivos y el aviso de qué hará la plataforma', async () => {
    installFakeApi(bookingApi());
    await withClient(<ReportIncidentScreen bookingId={BOOKING_ID} />);
    await waitFor(() => expect(screen.getByText(t.report.title)).toBeTruthy());
    for (const reason of Object.values(t.reasons)) {
      expect(screen.getByLabelText(reason.name)).toBeTruthy();
    }
    expect(screen.getByText(t.report.notice)).toBeTruthy();
    expect(screen.queryByLabelText(t.report.description)).toBeNull();
  });

  it('el botón está deshabilitado sin motivo y sin descripción válida', async () => {
    const api = installFakeApi(bookingApi());
    await withClient(<ReportIncidentScreen bookingId={BOOKING_ID} />);
    await waitFor(() => expect(screen.getByText(t.report.send)).toBeTruthy());
    await fireEvent.press(screen.getByText(t.report.send));
    await fireEvent.press(screen.getByLabelText(t.reasons.damaged.name));
    await fireEvent.changeText(screen.getByLabelText(t.report.description), 'corto');
    expect(screen.getByText(t.validation.descriptionTooShort)).toBeTruthy();
    await fireEvent.press(screen.getByText(t.report.send));
    expect(api.calls.some((call) => call.method === 'POST')).toBe(false);
  });

  it('al elegir motivo aparece la descripción y las fotos de evidencia (hasta 5)', async () => {
    installFakeApi(bookingApi());
    await withClient(<ReportIncidentScreen bookingId={BOOKING_ID} />);
    await waitFor(() => expect(screen.getByText(t.report.title)).toBeTruthy());
    await fireEvent.press(screen.getByLabelText(t.reasons.late_return.name));
    expect(screen.getByLabelText(t.report.description)).toBeTruthy();
    expect(mockPurpose).toBe('evidence');
    expect(mockMax).toBe(5);
    await fireEvent.changeText(screen.getByLabelText(t.report.description), 'a'.repeat(15));
    expect(screen.getByText(`15/1000 ${t.report.counter}`)).toBeTruthy();
  });

  it('envía el reporte con la evidencia subida y lleva al detalle (CA-04)', async () => {
    mockUploader = uploader({ refs: [{ publicId: 'vaiven/evidence/1' }] });
    const api = installFakeApi({
      ...bookingApi(),
      [POST]: () => ({ status: 201, body: fakeIncident() }),
    });
    await withClient(<ReportIncidentScreen bookingId={BOOKING_ID} />);
    await waitFor(() => expect(screen.getByText(t.report.title)).toBeTruthy());
    await fireEvent.press(screen.getByLabelText(t.reasons.damaged.name));
    await fireEvent.changeText(
      screen.getByLabelText(t.report.description),
      '  La tapa llegó rota y no estaba así.  ',
    );
    await fireEvent.press(screen.getByText(t.report.send));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(routes.incident(INCIDENT_ID)));
    const post = api.calls.find((call) => call.method === 'POST');
    expect(post?.body).toEqual({
      reason: 'damaged',
      description: 'La tapa llegó rota y no estaba así.',
      evidence: [{ publicId: 'vaiven/evidence/1' }],
    });
  });

  it('sin fotos no envía el campo evidence', async () => {
    const api = installFakeApi({
      ...bookingApi(),
      [POST]: () => ({ status: 201, body: fakeIncident() }),
    });
    await withClient(<ReportIncidentScreen bookingId={BOOKING_ID} />);
    await waitFor(() => expect(screen.getByText(t.report.title)).toBeTruthy());
    await fireEvent.press(screen.getByLabelText(t.reasons.no_show.name));
    await fireEvent.changeText(screen.getByLabelText(t.report.description), 'a'.repeat(12));
    await fireEvent.press(screen.getByText(t.report.send));
    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    expect(api.calls.find((call) => call.method === 'POST')?.body).toEqual({
      reason: 'no_show',
      description: 'a'.repeat(12),
    });
  });

  it('mientras suben las fotos no envía y lo dice', async () => {
    mockUploader = uploader({ isUploading: true });
    const api = installFakeApi(bookingApi());
    await withClient(<ReportIncidentScreen bookingId={BOOKING_ID} />);
    await waitFor(() => expect(screen.getByText(t.report.title)).toBeTruthy());
    await fireEvent.press(screen.getByLabelText(t.reasons.other.name));
    await fireEvent.changeText(screen.getByLabelText(t.report.description), 'a'.repeat(12));
    expect(screen.getByText(t.report.uploading)).toBeTruthy();
    await fireEvent.press(screen.getByText(t.report.uploading));
    expect(api.calls.some((call) => call.method === 'POST')).toBe(false);
  });

  it('con fotos fallidas pide revisarlas antes de enviar', async () => {
    mockUploader = uploader({ hasErrors: true });
    const api = installFakeApi(bookingApi());
    await withClient(<ReportIncidentScreen bookingId={BOOKING_ID} />);
    await waitFor(() => expect(screen.getByText(t.report.title)).toBeTruthy());
    await fireEvent.press(screen.getByLabelText(t.reasons.other.name));
    await fireEvent.changeText(screen.getByLabelText(t.report.description), 'a'.repeat(12));
    await fireEvent.press(screen.getByText(t.report.send));
    expect(screen.getByText(t.report.photosFailed)).toBeTruthy();
    expect(api.calls.some((call) => call.method === 'POST')).toBe(false);
  });

  it('un 409 (3 abiertas, ventana vencida) se explica y se conserva lo escrito (RF-08)', async () => {
    installFakeApi({ ...bookingApi(), [POST]: () => failure(409, 'conflict') });
    await withClient(<ReportIncidentScreen bookingId={BOOKING_ID} />);
    await waitFor(() => expect(screen.getByText(t.report.title)).toBeTruthy());
    await fireEvent.press(screen.getByLabelText(t.reasons.damaged.name));
    await fireEvent.changeText(screen.getByLabelText(t.report.description), 'a'.repeat(12));
    await fireEvent.press(screen.getByText(t.report.send));
    await waitFor(() => expect(screen.getByText(t.errors.conflict)).toBeTruthy());
    expect(screen.getByLabelText(t.report.description).props.value).toBe('a'.repeat(12));
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('un 403 tiene su mensaje', async () => {
    installFakeApi({ ...bookingApi(), [POST]: () => failure(403, 'forbidden') });
    await withClient(<ReportIncidentScreen bookingId={BOOKING_ID} />);
    await waitFor(() => expect(screen.getByText(t.report.title)).toBeTruthy());
    await fireEvent.press(screen.getByLabelText(t.reasons.damaged.name));
    await fireEvent.changeText(screen.getByLabelText(t.report.description), 'a'.repeat(12));
    await fireEvent.press(screen.getByText(t.report.send));
    await waitFor(() => expect(screen.getByText(t.errors.forbidden)).toBeTruthy());
  });

  it('si la reserva no carga ofrece reintentar', async () => {
    installFakeApi({ [BOOKING]: () => failure(500, 'internal_error') });
    await withClient(<ReportIncidentScreen bookingId={BOOKING_ID} />);
    await waitFor(() => expect(screen.getByText(es.common.retry)).toBeTruthy());
  });

  it('«Volver» regresa a la pantalla anterior', async () => {
    installFakeApi(bookingApi());
    await withClient(<ReportIncidentScreen bookingId={BOOKING_ID} />);
    await waitFor(() => expect(screen.getByText(t.report.title)).toBeTruthy());
    await fireEvent.press(screen.getByLabelText(t.back));
    expect(mockBack).toHaveBeenCalled();
  });
});

describe('MyIncidentsScreen (RF-07, CA-04)', () => {
  const MINE = 'GET /me/incidents';

  it('una incidencia enviada aparece como abierta', async () => {
    installFakeApi({ [MINE]: () => ok({ items: [fakeIncident()], nextCursor: null }) });
    await withClient(<MyIncidentsScreen />);
    await waitFor(() => expect(screen.getByText(t.reasons.damaged.name)).toBeTruthy());
    expect(screen.getByText(t.status.open)).toBeTruthy();
    expect(screen.getByText(/Ana López · /)).toBeTruthy();
  });

  it('abre el detalle al tocar una incidencia', async () => {
    installFakeApi({ [MINE]: () => ok({ items: [fakeIncident()], nextCursor: null }) });
    await withClient(<MyIncidentsScreen />);
    await waitFor(() => expect(screen.getByText(t.reasons.damaged.name)).toBeTruthy());
    await fireEvent.press(screen.getByText(t.reasons.damaged.name));
    expect(mockPush).toHaveBeenCalledWith(routes.incident(INCIDENT_ID));
  });

  it('muestra «Cerrado» en una incidencia cerrada', async () => {
    installFakeApi({
      [MINE]: () =>
        ok({
          items: [fakeIncident({ status: 'closed', closedAt: '2026-11-15T10:00:00Z' })],
          nextCursor: null,
        }),
    });
    await withClient(<MyIncidentsScreen />);
    await waitFor(() => expect(screen.getByText(t.status.closed)).toBeTruthy());
  });

  it('sin incidencias dice «Sin incidencias»', async () => {
    installFakeApi({ [MINE]: () => ok({ items: [], nextCursor: null }) });
    await withClient(<MyIncidentsScreen />);
    await waitFor(() => expect(screen.getByText(t.list.emptyTitle)).toBeTruthy());
  });

  it('con error ofrece reintentar', async () => {
    installFakeApi({ [MINE]: () => failure(500, 'internal_error') });
    await withClient(<MyIncidentsScreen />);
    await waitFor(() => expect(screen.getByText(es.common.retry)).toBeTruthy());
  });

  it('pagina con «Ver más incidencias»', async () => {
    installFakeApi({
      [MINE]: (req) =>
        req.query.includes('cursor=c2')
          ? ok({ items: [fakeIncident({ id: 'b', reason: 'no_show' })], nextCursor: null })
          : ok({ items: [fakeIncident({ id: 'a' })], nextCursor: 'c2' }),
    });
    await withClient(<MyIncidentsScreen />);
    await waitFor(() => expect(screen.getByText(t.list.more)).toBeTruthy());
    await fireEvent.press(screen.getByText(t.list.more));
    await waitFor(() => expect(screen.getByText(t.reasons.no_show.name)).toBeTruthy());
    expect(screen.queryByText(t.list.more)).toBeNull();
  });
});

describe('IncidentDetailScreen (RF-07, CA-05)', () => {
  const ONE = `GET /incidents/${INCIDENT_ID}`;

  it('abierta: estado «Abierto», motivo, descripción y sin respuesta final', async () => {
    installFakeApi({ [ONE]: () => ok(fakeIncident()) });
    await withClient(<IncidentDetailScreen id={INCIDENT_ID} />);
    await waitFor(() => expect(screen.getByText(t.reasons.damaged.name)).toBeTruthy());
    expect(screen.getByText(t.status.open)).toBeTruthy();
    expect(screen.getByText(fakeIncident().description)).toBeTruthy();
    expect(screen.queryByText(t.detail.finalResponse)).toBeNull();
    expect(screen.getByLabelText(`${t.detail.steps.review}, ${t.detail.stepNow}`)).toBeTruthy();
    expect(screen.getByLabelText(`${t.detail.steps.closed}, ${t.detail.stepNext}`)).toBeTruthy();
  });

  it('cerrada: muestra la respuesta final y el resultado (CA-05)', async () => {
    installFakeApi({
      [ONE]: () =>
        ok(
          fakeIncident({
            status: 'closed',
            closedAt: '2026-11-15T10:00:00Z',
            finalResponse: {
              text: 'Revisamos el caso y registramos un ajuste.',
              outcome: 'monetary_adjustment',
              at: '2026-11-15T10:00:00Z',
            },
          }),
        ),
    });
    await withClient(<IncidentDetailScreen id={INCIDENT_ID} />);
    await waitFor(() => expect(screen.getByText(t.detail.finalResponse)).toBeTruthy());
    expect(screen.getByText('Revisamos el caso y registramos un ajuste.')).toBeTruthy();
    expect(screen.getByText(t.detail.outcome.monetary_adjustment)).toBeTruthy();
    expect(screen.getAllByText(t.status.closed).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(`${t.detail.steps.closed}, ${t.detail.stepDone}`)).toBeTruthy();
  });

  it('muestra las notas visibles del equipo', async () => {
    installFakeApi({
      [ONE]: () =>
        ok(fakeIncident({ notes: [{ text: 'Ya vimos las fotos.', at: '2026-11-14T10:00:00Z' }] })),
    });
    await withClient(<IncidentDetailScreen id={INCIDENT_ID} />);
    await waitFor(() => expect(screen.getByText(t.detail.notes)).toBeTruthy());
    expect(screen.getByText('Ya vimos las fotos.')).toBeTruthy();
  });

  it('sin notas no muestra la sección', async () => {
    installFakeApi({ [ONE]: () => ok(fakeIncident()) });
    await withClient(<IncidentDetailScreen id={INCIDENT_ID} />);
    await waitFor(() => expect(screen.getByText(t.reasons.damaged.name)).toBeTruthy());
    expect(screen.queryByText(t.detail.notes)).toBeNull();
    expect(screen.queryByText(t.detail.evidence)).toBeNull();
  });

  it('la evidencia se muestra como privada y se amplía al tocar', async () => {
    installFakeApi({
      [ONE]: () => ok(fakeIncident({ evidence: [fakeEvidence(1), fakeEvidence(2)] })),
    });
    await withClient(<IncidentDetailScreen id={INCIDENT_ID} />);
    await waitFor(() => expect(screen.getByText(t.detail.evidence)).toBeTruthy());
    expect(screen.getAllByText(/foto\|thumb\|evidence=true/)).toHaveLength(2);
    await fireEvent.press(screen.getByLabelText(`${t.detail.evidenceItem} 2`));
    expect(screen.getByText(/foto\|full\|evidence=true/)).toBeTruthy();
  });

  it('«Ver la reserva» abre la reserva', async () => {
    installFakeApi({ [ONE]: () => ok(fakeIncident()) });
    await withClient(<IncidentDetailScreen id={INCIDENT_ID} />);
    await waitFor(() => expect(screen.getByText(t.detail.openBooking)).toBeTruthy());
    await fireEvent.press(screen.getByText(t.detail.openBooking));
    expect(mockPush).toHaveBeenCalledWith(routes.booking(BOOKING_ID));
  });

  it('un 404 muestra «No encontramos esta incidencia»', async () => {
    installFakeApi({ [ONE]: () => failure(404, 'not_found') });
    await withClient(<IncidentDetailScreen id={INCIDENT_ID} />);
    await waitFor(() => expect(screen.getByText(t.detail.notFoundTitle)).toBeTruthy());
    await fireEvent.press(screen.getByText(t.detail.notFoundAction));
    expect(mockBack).toHaveBeenCalled();
  });

  it('otro error ofrece reintentar', async () => {
    installFakeApi({ [ONE]: () => failure(500, 'internal_error') });
    await withClient(<IncidentDetailScreen id={INCIDENT_ID} />);
    await waitFor(() => expect(screen.getByText(es.common.retry)).toBeTruthy());
  });
});

describe('IncidentSection e IncidentsRow', () => {
  const MINE = 'GET /me/incidents';

  it('ofrece «Reportar incidencia» en una reserva aceptada', async () => {
    installFakeApi({ [MINE]: () => ok({ items: [], nextCursor: null }) });
    await withClient(<IncidentSection booking={fakeBooking({ status: 'accepted' })} />);
    await fireEvent.press(screen.getByText(t.section.action));
    expect(mockPush).toHaveBeenCalledWith(routes.reportIncident(BOOKING_ID));
  });

  it('no ofrece «Reportar» en una reserva rechazada ni dibuja nada (CA-06)', async () => {
    installFakeApi({ [MINE]: () => ok({ items: [], nextCursor: null }) });
    await withClient(<IncidentSection booking={fakeBooking({ status: 'rejected' })} />);
    expect(screen.queryByText(t.section.action)).toBeNull();
    expect(screen.queryByText(t.section.mine)).toBeNull();
  });

  it('muestra solo las incidencias de esta reserva', async () => {
    installFakeApi({
      [MINE]: () =>
        ok({
          items: [
            fakeIncident(),
            fakeIncident({ id: 'otra', bookingId: 'otra-reserva', reason: 'no_show' }),
          ],
          nextCursor: null,
        }),
    });
    await withClient(<IncidentSection booking={fakeBooking({ status: 'rejected' })} />);
    await waitFor(() => expect(screen.getByText(t.section.mine)).toBeTruthy());
    expect(screen.getByText(t.reasons.damaged.name)).toBeTruthy();
    expect(screen.queryByText(t.reasons.no_show.name)).toBeNull();
    await fireEvent.press(screen.getByText(t.reasons.damaged.name));
    expect(mockPush).toHaveBeenCalledWith(routes.incident(INCIDENT_ID));
  });

  it('IncidentsRow lleva a «Mis incidencias»', async () => {
    await render(<IncidentsRow />);
    await fireEvent.press(screen.getByText(t.profileRow));
    expect(mockPush).toHaveBeenCalledWith(routes.incidents);
  });
});
