import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { MyIncidentsScreen } from '@/features/incidents/screens/MyIncidentsScreen';
import { IncidentDetailScreen } from '@/features/incidents/screens/IncidentDetailScreen';
import { ReportIncidentScreen } from '@/features/incidents/screens/ReportIncidentScreen';
import { es } from '@/i18n/es-MX';
import { failure, installFakeApi, ok } from '@/test/fakeApi';
import { BOOKING_ID, fakeBooking } from '@/test/fakeBookings';
import { INCIDENT_ID, fakeEvidence, fakeIncident } from '@/test/fakeTrust';

// Spec 021-T009: suite de seguridad propia de las incidencias (S-01, S-05, S-09): la evidencia es
// privada, el reporte solo lleva campos del contrato y una incidencia ajena no se muestra.
jest.mock('expo-router', () => ({
  useIsFocused: () => true,
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
}));
jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({ user: { id: '6730f1c2a9b3e4d5f6a7b8aa' } }),
}));
jest.mock('@/features/images', () => ({
  useImageUpload: () => ({
    items: [],
    refs: [{ publicId: 'vaiven/evidence/1' }],
    isUploading: false,
    hasErrors: false,
  }),
  PhotoPicker: () => null,
  RemoteImage: ({ evidence }: { evidence?: boolean }) => {
    const { Text } = jest.requireActual('react-native');
    return <Text>{`foto|evidence=${String(evidence)}`}</Text>;
  },
}));

jest.setTimeout(30_000);
const t = es.incidents;
const POST = `POST /bookings/${BOOKING_ID}/incidents`;
const ONE = `GET /incidents/${INCIDENT_ID}`;

function withClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

afterEach(() => jest.restoreAllMocks());

describe('Incidencias (seguridad)', () => {
  it('el reporte envía solo motivo, descripción y evidencia: nunca ids ni estado', async () => {
    const api = installFakeApi({
      [`GET /bookings/${BOOKING_ID}`]: () =>
        ok(fakeBooking({ status: 'accepted', viewerRole: 'requester' })),
      [POST]: () => ({ status: 201, body: fakeIncident() }),
    });
    await withClient(<ReportIncidentScreen bookingId={BOOKING_ID} />);
    await waitFor(() => expect(screen.getByText(t.report.title)).toBeTruthy());
    await fireEvent.press(screen.getByLabelText(t.reasons.damaged.name));
    await fireEvent.changeText(screen.getByLabelText(t.report.description), 'La tapa llegó rota.');
    await fireEvent.press(screen.getByText(t.report.send));
    await waitFor(() => expect(api.calls.some((c) => c.method === 'POST')).toBe(true));
    const cuerpo = api.calls.find((c) => c.method === 'POST')?.body as Record<string, unknown>;
    expect(Object.keys(cuerpo).sort()).toEqual(['description', 'evidence', 'reason']);
    expect(cuerpo.evidence).toEqual([{ publicId: 'vaiven/evidence/1' }]);
  });

  it('una reserva rechazada no permite reportar ni envía nada', async () => {
    const api = installFakeApi({
      [`GET /bookings/${BOOKING_ID}`]: () => ok(fakeBooking({ status: 'rejected' })),
    });
    await withClient(<ReportIncidentScreen bookingId={BOOKING_ID} />);
    expect(await screen.findByText(t.report.notAllowedTitle)).toBeTruthy();
    expect(screen.queryByText(t.report.send)).toBeNull();
    expect(api.calls.some((c) => c.method === 'POST')).toBe(false);
  });

  it('la evidencia del detalle se pide siempre como privada', async () => {
    installFakeApi({
      [ONE]: () => ok(fakeIncident({ evidence: [fakeEvidence(1), fakeEvidence(2)] })),
    });
    await withClient(<IncidentDetailScreen id={INCIDENT_ID} />);
    await waitFor(() => expect(screen.getByText(t.detail.evidence)).toBeTruthy());
    expect(screen.queryByText(/evidence=false|evidence=undefined/)).toBeNull();
    expect(screen.getAllByText('foto|evidence=true')).toHaveLength(2);
  });

  it('una incidencia ajena (404) no muestra datos del reporte', async () => {
    installFakeApi({ [ONE]: () => failure(404, 'not_found') });
    await withClient(<IncidentDetailScreen id={INCIDENT_ID} />);
    expect(await screen.findByText(t.detail.notFoundTitle)).toBeTruthy();
    expect(screen.queryByText(t.detail.evidence)).toBeNull();
  });

  it('«Mis incidencias» solo consulta las propias (/me/incidents) y nada más', async () => {
    const api = installFakeApi({
      'GET /me/incidents': () => ok({ items: [fakeIncident()], nextCursor: null }),
    });
    await withClient(<MyIncidentsScreen />);
    await waitFor(() => expect(api.calls.length).toBeGreaterThan(0));
    expect(api.calls.every((c) => c.method === 'GET' && c.path === '/me/incidents')).toBe(true);
  });

  it('un 403 del servidor al reportar no se presenta como enviado', async () => {
    installFakeApi({
      [`GET /bookings/${BOOKING_ID}`]: () =>
        ok(fakeBooking({ status: 'accepted', viewerRole: 'requester' })),
      [POST]: () => failure(403, 'forbidden'),
    });
    await withClient(<ReportIncidentScreen bookingId={BOOKING_ID} />);
    await waitFor(() => expect(screen.getByText(t.report.title)).toBeTruthy());
    await fireEvent.press(screen.getByLabelText(t.reasons.damaged.name));
    await fireEvent.changeText(screen.getByLabelText(t.report.description), 'La tapa llegó rota.');
    await fireEvent.press(screen.getByText(t.report.send));
    await screen.findByRole('alert');
    expect(screen.queryByText(t.detail.title)).toBeNull();
  });
});
