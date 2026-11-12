import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { BookingActions } from '@/features/bookings/components/BookingActions';
import { MeetingPointSheet } from '@/features/bookings/components/MeetingPointSheet';
import { es } from '@/i18n/es-MX';
import { failure, installFakeApi, ok } from '@/test/fakeApi';
import { BOOKING_ID, fakeBooking } from '@/test/fakeBookings';

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));

const a = es.bookings.actions;
const cancelT = es.bookings.cancelSheet;
const base = `/bookings/${BOOKING_ID}`;

afterEach(() => jest.restoreAllMocks());

function renderWith(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

/** El botón de confirmar comparte texto con el que abre la hoja: se busca dentro de la hoja. */
const inSheet = () => within(screen.getByTestId('bottom-sheet'));

const isDisabled = (label: string) =>
  Boolean(screen.getByLabelText(label).props.accessibilityState?.disabled);

describe('BookingActions · qué se ofrece', () => {
  it('CA-05: el propietario con una pendiente ve Aceptar y Rechazar; el solicitante no', async () => {
    const view = await renderWith(
      <BookingActions booking={fakeBooking({ viewerRole: 'owner' })} />,
    );
    expect(screen.getByLabelText(a.accept)).toBeTruthy();
    expect(screen.getByLabelText(a.reject)).toBeTruthy();
    expect(screen.queryByLabelText(a.cancel)).toBeNull();
    await view.unmount();
    await renderWith(<BookingActions booking={fakeBooking({ viewerRole: 'requester' })} />);
    expect(screen.queryByLabelText(a.accept)).toBeNull();
    expect(screen.queryByLabelText(a.reject)).toBeNull();
    expect(screen.getByLabelText(a.cancel)).toBeTruthy();
  });

  it('en estados terminales no ofrece nada', async () => {
    await renderWith(<BookingActions booking={fakeBooking({ status: 'completed' })} />);
    expect(screen.queryByLabelText(a.cancel)).toBeNull();
  });

  it('el propietario de una aceptada puede cancelar', async () => {
    await renderWith(
      <BookingActions booking={fakeBooking({ viewerRole: 'owner', status: 'accepted' })} />,
    );
    expect(screen.getByLabelText(a.cancel)).toBeTruthy();
    expect(screen.queryByLabelText(a.accept)).toBeNull();
  });
});

describe('aceptar', () => {
  const owner = () => <BookingActions booking={fakeBooking({ viewerRole: 'owner' })} />;

  it('acepta sin punto de encuentro y cierra la hoja', async () => {
    const api = installFakeApi({
      [`POST ${base}/accept`]: () => ok(fakeBooking({ status: 'accepted' })),
    });
    await renderWith(owner());
    await fireEvent.press(screen.getByLabelText(a.accept));
    expect(screen.getByText(es.bookings.acceptSheet.title)).toBeTruthy();
    await fireEvent.press(inSheet().getByLabelText(es.bookings.acceptSheet.confirm));
    await waitFor(() => expect(screen.queryByText(es.bookings.acceptSheet.title)).toBeNull());
    expect(api.calls[0]?.body).toEqual({});
  });

  it('acepta con punto de encuentro', async () => {
    const api = installFakeApi({
      [`POST ${base}/accept`]: () => ok(fakeBooking({ status: 'accepted' })),
    });
    await renderWith(owner());
    await fireEvent.press(screen.getByLabelText(a.accept));
    await fireEvent.changeText(
      screen.getByPlaceholderText(es.bookings.acceptSheet.placeholder),
      '  Metro Coyoacán ',
    );
    await fireEvent.press(inSheet().getByLabelText(es.bookings.acceptSheet.confirm));
    await waitFor(() => expect(api.calls).toHaveLength(1));
    expect(api.calls[0]?.body).toEqual({ meetingPoint: { description: 'Metro Coyoacán' } });
  });

  it('un punto de encuentro demasiado corto bloquea la aceptación', async () => {
    await renderWith(owner());
    await fireEvent.press(screen.getByLabelText(a.accept));
    await fireEvent.changeText(
      screen.getByPlaceholderText(es.bookings.acceptSheet.placeholder),
      'ab',
    );
    expect(screen.getByText(es.bookings.meetingSheet.tooShort)).toBeTruthy();
    expect(
      inSheet().getByLabelText(es.bookings.acceptSheet.confirm).props.accessibilityState.disabled,
    ).toBe(true);
  });

  it('un 409 explica que la reserva ya cambió y deja la hoja abierta', async () => {
    installFakeApi({ [`POST ${base}/accept`]: () => failure(409, 'conflict') });
    await renderWith(owner());
    await fireEvent.press(screen.getByLabelText(a.accept));
    await fireEvent.press(inSheet().getByLabelText(es.bookings.acceptSheet.confirm));
    expect(await screen.findByText(es.bookings.errors.invalidTransition)).toBeTruthy();
    expect(screen.getByText(es.bookings.acceptSheet.title)).toBeTruthy();
  });
});

describe('rechazar', () => {
  it('confirma y rechaza', async () => {
    const api = installFakeApi({
      [`POST ${base}/reject`]: () => ok(fakeBooking({ status: 'rejected' })),
    });
    await renderWith(<BookingActions booking={fakeBooking({ viewerRole: 'owner' })} />);
    await fireEvent.press(screen.getByLabelText(a.reject));
    expect(screen.getByText(es.bookings.rejectSheet.body)).toBeTruthy();
    await fireEvent.press(inSheet().getByLabelText(es.bookings.rejectSheet.confirm));
    await waitFor(() => expect(screen.queryByText(es.bookings.rejectSheet.title)).toBeNull());
    expect(api.calls[0]?.body).toEqual({});
  });

  it('muestra el error si el servidor niega', async () => {
    installFakeApi({ [`POST ${base}/reject`]: () => failure(403, 'forbidden') });
    await renderWith(<BookingActions booking={fakeBooking({ viewerRole: 'owner' })} />);
    await fireEvent.press(screen.getByLabelText(a.reject));
    await fireEvent.press(inSheet().getByLabelText(es.bookings.rejectSheet.confirm));
    expect(await screen.findByText(es.bookings.errors.forbidden)).toBeTruthy();
  });
});

describe('cancelar', () => {
  it('CA-07: una reserva aceptada exige motivo y confirmación', async () => {
    const api = installFakeApi({
      [`POST ${base}/cancel`]: () => ok(fakeBooking({ status: 'cancelled' })),
    });
    await renderWith(<BookingActions booking={fakeBooking({ status: 'accepted' })} />);
    await fireEvent.press(screen.getByLabelText(a.cancel));
    expect(screen.getByText(cancelT.consequence)).toBeTruthy();
    expect(isDisabled(cancelT.confirm)).toBe(true);
    await fireEvent.press(screen.getByLabelText(cancelT.reasons[0]!));
    expect(isDisabled(cancelT.confirm)).toBe(false);
    await fireEvent.press(screen.getByLabelText(cancelT.confirm));
    await waitFor(() => expect(screen.queryByText(cancelT.title)).toBeNull());
    expect(api.calls[0]?.body).toEqual({ reason: cancelT.reasons[0] });
  });

  it('«Otro» pide escribir al menos 3 letras', async () => {
    const api = installFakeApi({
      [`POST ${base}/cancel`]: () => ok(fakeBooking({ status: 'cancelled' })),
    });
    await renderWith(<BookingActions booking={fakeBooking({ status: 'accepted' })} />);
    await fireEvent.press(screen.getByLabelText(a.cancel));
    await fireEvent.press(screen.getByLabelText(cancelT.other));
    expect(isDisabled(cancelT.confirm)).toBe(true);
    const field = screen.getByPlaceholderText(cancelT.otherPlaceholder);
    await fireEvent.changeText(field, 'no');
    expect(isDisabled(cancelT.confirm)).toBe(true);
    await fireEvent.changeText(field, '  Se descompuso mi coche ');
    expect(isDisabled(cancelT.confirm)).toBe(false);
    await fireEvent.press(screen.getByLabelText(cancelT.confirm));
    await waitFor(() => expect(api.calls).toHaveLength(1));
    expect(api.calls[0]?.body).toEqual({ reason: 'Se descompuso mi coche' });
  });

  it('una solicitud pendiente se cancela sin motivo', async () => {
    const api = installFakeApi({
      [`POST ${base}/cancel`]: () => ok(fakeBooking({ status: 'cancelled' })),
    });
    await renderWith(<BookingActions booking={fakeBooking()} />);
    await fireEvent.press(screen.getByLabelText(a.cancel));
    expect(isDisabled(cancelT.confirm)).toBe(false);
    await fireEvent.press(screen.getByLabelText(cancelT.confirm));
    await waitFor(() => expect(api.calls).toHaveLength(1));
    expect(api.calls[0]?.body).toEqual({});
  });

  it('«Volver» cierra la hoja sin cancelar', async () => {
    const api = installFakeApi({});
    await renderWith(<BookingActions booking={fakeBooking({ status: 'accepted' })} />);
    await fireEvent.press(screen.getByLabelText(a.cancel));
    await fireEvent.press(screen.getByLabelText(cancelT.back));
    await waitFor(() => expect(screen.queryByText(cancelT.title)).toBeNull());
    expect(api.calls).toHaveLength(0);
  });

  it('un fallo de red se informa con su texto', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('network'));
    await renderWith(<BookingActions booking={fakeBooking()} />);
    await fireEvent.press(screen.getByLabelText(a.cancel));
    await fireEvent.press(screen.getByLabelText(cancelT.confirm));
    expect(await screen.findByText(es.errors.network_error)).toBeTruthy();
  });
});

describe('MeetingPointSheet', () => {
  const t = es.bookings.meetingSheet;

  it('guarda el punto de encuentro de 3 a 200 caracteres', async () => {
    const api = installFakeApi({
      [`POST ${base}/meeting-point`]: () =>
        ok(fakeBooking({ status: 'accepted', meetingPoint: { description: 'Metro' } })),
    });
    const onClose = jest.fn();
    await renderWith(
      <MeetingPointSheet bookingId={BOOKING_ID} initial={null} visible onClose={onClose} />,
    );
    expect(isDisabled(t.save)).toBe(true);
    await fireEvent.changeText(screen.getByPlaceholderText(t.placeholder), 'ab');
    expect(screen.getByText(t.tooShort)).toBeTruthy();
    await fireEvent.changeText(screen.getByPlaceholderText(t.placeholder), 'Entrada del metro');
    await fireEvent.press(screen.getByLabelText(t.save));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(api.calls[0]?.body).toEqual({ description: 'Entrada del metro' });
  });

  it('parte del punto actual al cambiarlo y muestra errores', async () => {
    installFakeApi({ [`POST ${base}/meeting-point`]: () => failure(404, 'not_found') });
    await renderWith(
      <MeetingPointSheet
        bookingId={BOOKING_ID}
        initial="Metro Coyoacán"
        visible
        onClose={jest.fn()}
      />,
    );
    expect(screen.getByDisplayValue('Metro Coyoacán')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(t.save));
    expect(await screen.findByText(es.bookings.errors.notFound)).toBeTruthy();
  });
});
