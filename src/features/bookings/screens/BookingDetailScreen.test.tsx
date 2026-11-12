import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { Text } from 'react-native';
import { BookingDetailScreen } from '@/features/bookings/screens/BookingDetailScreen';
import { slots } from '@/features/bookings/slots';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { failure, installFakeApi, ok } from '@/test/fakeApi';
import { BOOKING_ID, fakeBooking } from '@/test/fakeBookings';

const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));
jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));

const t = es.bookings.detail;
const a = es.bookings.actions;
const route = `GET /bookings/${BOOKING_ID}`;

beforeEach(() => {
  mockPush.mockReset();
  mockBack.mockReset();
});
afterEach(() => {
  jest.restoreAllMocks();
  slots.clear();
});

function renderScreen() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <BookingDetailScreen id={BOOKING_ID} />
    </QueryClientProvider>,
  );
}

describe('BookingDetailScreen', () => {
  it('muestra la reserva: título, estado, la otra persona, fechas y total', async () => {
    installFakeApi({ [route]: () => ok(fakeBooking()) });
    await renderScreen();
    expect(await screen.findByText('Taladro percutor')).toBeTruthy();
    expect(screen.getByText('Pendiente')).toBeTruthy();
    expect(screen.getByText(t.owner)).toBeTruthy();
    expect(screen.getByText('Ana López')).toBeTruthy();
    expect(screen.getByText(`${t.dates}: 12–14 nov`)).toBeTruthy();
    expect(screen.getByText(`${t.payment}: Todo al entregar`)).toBeTruthy();
    expect(screen.getByLabelText('Total: $90.00')).toBeTruthy();
    expect(screen.getByText(/^Vence en/)).toBeTruthy();
    expect(screen.getByLabelText(`${es.bookings.timeline.label}: Solicitada`)).toBeTruthy();
  });

  it('como propietario muestra al solicitante y abre su perfil', async () => {
    installFakeApi({ [route]: () => ok(fakeBooking({ viewerRole: 'owner' })) });
    await renderScreen();
    expect(await screen.findByText(t.requester)).toBeTruthy();
    await fireEvent.press(screen.getByText('Luis Pérez'));
    expect(mockPush).toHaveBeenCalledWith(routes.user('6730f1c2a9b3e4d5f6a7b8aa'));
  });

  it('CA-05: el solicitante solo puede cancelar su pendiente', async () => {
    installFakeApi({ [route]: () => ok(fakeBooking()) });
    await renderScreen();
    await screen.findByText('Taladro percutor');
    expect(screen.getByLabelText(a.cancel)).toBeTruthy();
    expect(screen.queryByLabelText(a.accept)).toBeNull();
    expect(screen.queryByLabelText(a.reject)).toBeNull();
  });

  it('CA-06: al aceptar, el estado cambia sin volver a pedir el detalle', async () => {
    const api = installFakeApi({
      [route]: () => ok(fakeBooking({ viewerRole: 'owner' })),
      [`POST /bookings/${BOOKING_ID}/accept`]: () =>
        ok(fakeBooking({ viewerRole: 'owner', status: 'accepted' })),
    });
    await renderScreen();
    await fireEvent.press(await screen.findByLabelText(a.accept));
    await fireEvent.press(
      within(screen.getByTestId('bottom-sheet')).getByLabelText(es.bookings.acceptSheet.confirm),
    );
    // «Aceptada» aparece en la píldora y en la línea de avance.
    expect((await screen.findAllByText('Aceptada')).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByLabelText(a.reject)).toBeNull();
    expect(screen.getByLabelText(`${es.bookings.timeline.label}: Aceptada`)).toBeTruthy();
    expect(api.calls.filter((c) => c.method === 'GET')).toHaveLength(1);
  });

  it('CA-07: cancelar una aceptada con motivo deja la reserva cancelada', async () => {
    installFakeApi({
      [route]: () => ok(fakeBooking({ status: 'accepted' })),
      [`POST /bookings/${BOOKING_ID}/cancel`]: () =>
        ok(
          fakeBooking({
            status: 'cancelled',
            cancelledBy: 'requester',
            cancelReason: 'Ya no lo necesito',
          }),
        ),
    });
    await renderScreen();
    await fireEvent.press(await screen.findByLabelText(a.cancel));
    const sheet = () => within(screen.getByTestId('bottom-sheet'));
    await fireEvent.press(sheet().getByLabelText('Ya no lo necesito'));
    await fireEvent.press(sheet().getByLabelText(es.bookings.cancelSheet.confirm));
    expect(await screen.findByText(es.bookings.statusBanner.cancelled)).toBeTruthy();
    expect(screen.getByText(`${t.cancelledBy} ${t.byRequester}`)).toBeTruthy();
    expect(screen.getByText(`${t.reason}: Ya no lo necesito`)).toBeTruthy();
    expect(screen.queryByLabelText(a.cancel)).toBeNull();
  });

  it('rechazada: avisa y muestra el motivo, o que no se indicó', async () => {
    installFakeApi({
      [route]: () => ok(fakeBooking({ status: 'rejected', rejectReason: 'No disponible' })),
    });
    const view = await renderScreen();
    expect(await screen.findByText(es.bookings.statusBanner.rejected)).toBeTruthy();
    expect(screen.getByText(`${t.reason}: No disponible`)).toBeTruthy();
    expect(screen.queryByLabelText(`${es.bookings.timeline.label}: Solicitada`)).toBeNull();
    await view.unmount();
    installFakeApi({ [route]: () => ok(fakeBooking({ status: 'rejected' })) });
    await renderScreen();
    expect(await screen.findByText(`${t.reason}: ${t.noReason}`)).toBeTruthy();
  });

  it('vencida: avisa sin pedir motivo', async () => {
    installFakeApi({ [route]: () => ok(fakeBooking({ status: 'expired' })) });
    await renderScreen();
    expect(await screen.findByText(es.bookings.statusBanner.expired)).toBeTruthy();
    expect(screen.queryByText(new RegExp(`^${t.reason}`))).toBeNull();
  });

  it('punto de encuentro: el propietario lo propone y lo guarda', async () => {
    const api = installFakeApi({
      [route]: () => ok(fakeBooking({ viewerRole: 'owner', status: 'accepted' })),
      [`POST /bookings/${BOOKING_ID}/meeting-point`]: () =>
        ok(
          fakeBooking({
            viewerRole: 'owner',
            status: 'accepted',
            meetingPoint: { description: 'Metro Coyoacán' },
          }),
        ),
    });
    await renderScreen();
    expect(await screen.findByText(t.meetingPointNone)).toBeTruthy();
    await fireEvent.press(screen.getByText(t.propose));
    const sheet = () => within(screen.getByTestId('bottom-sheet'));
    await fireEvent.changeText(
      sheet().getByPlaceholderText(es.bookings.meetingSheet.placeholder),
      'Metro Coyoacán',
    );
    await fireEvent.press(sheet().getByLabelText(es.bookings.meetingSheet.save));
    expect(await screen.findByText('Metro Coyoacán')).toBeTruthy();
    expect(screen.getByText(t.change)).toBeTruthy();
    expect(api.calls.some((c) => c.path.endsWith('/meeting-point'))).toBe(true);
  });

  it('punto de encuentro: quien solicitó lo ve pero no lo edita', async () => {
    installFakeApi({
      [route]: () =>
        ok(fakeBooking({ status: 'accepted', meetingPoint: { description: 'Metro Coyoacán' } })),
    });
    await renderScreen();
    expect(await screen.findByText('Metro Coyoacán')).toBeTruthy();
    expect(screen.queryByText(t.change)).toBeNull();
    expect(screen.queryByText(t.propose)).toBeNull();
  });

  it('pinta las secciones registradas por otras specs, en orden', async () => {
    slots.register('ratingsAndIncidents', ({ booking }) => <Text>{`calif ${booking.id}`}</Text>);
    slots.register('chat', () => <Text>chat</Text>);
    installFakeApi({ [route]: () => ok(fakeBooking()) });
    await renderScreen();
    expect(await screen.findByText('chat')).toBeTruthy();
    expect(screen.getByText(`calif ${BOOKING_ID}`)).toBeTruthy();
  });

  it('muestra las reglas de uso guardadas en la solicitud', async () => {
    installFakeApi({ [route]: () => ok(fakeBooking({ usageRules: 'Devolver limpio.' })) });
    await renderScreen();
    expect(await screen.findByText('Devolver limpio.')).toBeTruthy();
  });

  it('404: dice que no encontró la reserva', async () => {
    installFakeApi({ [route]: () => failure(404, 'not_found') });
    await renderScreen();
    expect(await screen.findByText(t.notFoundTitle)).toBeTruthy();
    await fireEvent.press(screen.getByText(t.notFoundAction));
    expect(mockBack).toHaveBeenCalled();
  });

  it('otro error ofrece reintentar', async () => {
    let calls = 0;
    installFakeApi({
      [route]: () => (++calls === 1 ? failure(500, 'internal_error') : ok(fakeBooking())),
    });
    await renderScreen();
    expect(await screen.findByText(es.errors.internal_error)).toBeTruthy();
    await fireEvent.press(screen.getByText(es.common.retry));
    await waitFor(() => expect(screen.getByText('Taladro percutor')).toBeTruthy());
  });

  it('«Volver» regresa a la pantalla anterior', async () => {
    installFakeApi({ [route]: () => ok(fakeBooking()) });
    await renderScreen();
    await fireEvent.press(await screen.findByLabelText(t.back));
    expect(mockBack).toHaveBeenCalled();
  });
});
