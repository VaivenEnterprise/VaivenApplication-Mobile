import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { BookingCard } from '@/features/bookings/components/BookingCard';
import { ExpiryCountdown, remainingText } from '@/features/bookings/components/ExpiryCountdown';
import { MeetingPointCard } from '@/features/bookings/components/MeetingPointCard';
import { QuoteSummary } from '@/features/bookings/components/QuoteSummary';
import { StatusBadge } from '@/features/bookings/components/StatusBadge';
import { BOOKING_STATUSES } from '@/features/bookings/types';
import { es } from '@/i18n/es-MX';
import { fakeBooking } from '@/test/fakeBookings';

const NOW = Date.parse('2026-11-11T12:00:00Z');

afterEach(() => jest.useRealTimers());

describe('StatusBadge', () => {
  it.each(BOOKING_STATUSES)('dice el estado «%s» con texto, no solo con color', async (status) => {
    await render(<StatusBadge status={status} />);
    expect(screen.getByText(es.bookings.status[status])).toBeTruthy();
  });
});

describe('QuoteSummary', () => {
  it('desglosa días × tarifa y total de una renta', async () => {
    await render(
      <QuoteSummary
        days={3}
        pricePerDayCents={3000}
        totalCents={9000}
        paymentMode="full_on_delivery"
        payments={[{ stage: 'delivery', amountCents: 9000 }]}
      />,
    );
    expect(screen.getByLabelText(/^3 días × \$30\.00/)).toBeTruthy();
    expect(screen.getByLabelText('Total: $90.00')).toBeTruthy();
    expect(screen.getByText(es.bookings.request.payInPerson)).toBeTruthy();
    expect(screen.queryByLabelText(/^Al entregar/)).toBeNull();
  });

  it('muestra los dos pagos en 50 % + 50 %', async () => {
    await render(
      <QuoteSummary
        days={1}
        pricePerDayCents={3001}
        totalCents={3001}
        paymentMode="split_50_50"
        payments={[
          { stage: 'delivery', amountCents: 1501 },
          { stage: 'return', amountCents: 1500 },
        ]}
      />,
    );
    expect(screen.getByLabelText('Al entregar: $15.01')).toBeTruthy();
    expect(screen.getByLabelText('Al devolver: $15.00')).toBeTruthy();
  });

  it('un préstamo dice «Gratis» y no pide pago', async () => {
    await render(
      <QuoteSummary
        days={2}
        pricePerDayCents={0}
        totalCents={0}
        paymentMode="none"
        payments={[]}
      />,
    );
    expect(screen.getByLabelText('Total: Gratis')).toBeTruthy();
    expect(screen.queryByText(es.bookings.request.payInPerson)).toBeNull();
  });
});

describe('ExpiryCountdown', () => {
  it('remainingText calcula horas y minutos desde el expiresAt del servidor', () => {
    expect(remainingText('2026-11-11T17:12:00Z', NOW)).toBe('5 h 12 min');
    expect(remainingText('2026-11-11T12:12:00Z', NOW)).toBe('12 min');
    expect(remainingText('2026-11-11T12:00:10Z', NOW)).toBe('1 min');
    expect(remainingText('2026-11-11T13:00:00Z', NOW)).toBe('1 h');
    expect(remainingText('2026-11-11T11:59:00Z', NOW)).toBeNull();
    expect(remainingText('basura', NOW)).toBeNull();
  });

  it('cuenta regresiva con reloj falso: avanza y termina en «Vencida»', async () => {
    jest.useFakeTimers({ now: NOW });
    await render(<ExpiryCountdown expiresAt="2026-11-11T12:40:00Z" />);
    expect(screen.getByText('Vence en 40 min')).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(30 * 60_000);
    });
    expect(screen.getByText('Vence en 10 min')).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(11 * 60_000);
    });
    expect(screen.getByText(es.bookings.detail.expired)).toBeTruthy();
  });

  it('admite un prefijo propio', async () => {
    jest.useFakeTimers({ now: NOW });
    await render(<ExpiryCountdown expiresAt="2026-11-11T13:30:00Z" prefix="Responde antes de" />);
    expect(screen.getByText('Responde antes de 1 h 30 min')).toBeTruthy();
  });
});

describe('MeetingPointCard', () => {
  it('muestra la descripción y el botón solo si se puede editar', async () => {
    const onEdit = jest.fn();
    const view = await render(<MeetingPointCard description="Metro Coyoacán" onEdit={onEdit} />);
    expect(screen.getByText('Metro Coyoacán')).toBeTruthy();
    await fireEvent.press(screen.getByText(es.bookings.detail.change));
    expect(onEdit).toHaveBeenCalledTimes(1);
    await view.rerender(<MeetingPointCard description={null} onEdit={onEdit} />);
    expect(screen.getByText(es.bookings.detail.meetingPointNone)).toBeTruthy();
    expect(screen.getByText(es.bookings.detail.propose)).toBeTruthy();
    await view.rerender(<MeetingPointCard description={null} />);
    expect(screen.queryByText(es.bookings.detail.propose)).toBeNull();
  });
});

describe('BookingCard', () => {
  it('como solicitante muestra al propietario, fechas y estado, y abre el detalle', async () => {
    const onPress = jest.fn();
    const booking = fakeBooking();
    await render(<BookingCard booking={booking} onPress={onPress} />);
    expect(screen.getByText('Taladro percutor')).toBeTruthy();
    expect(screen.getByText('Con Ana López · 12–14 nov')).toBeTruthy();
    expect(screen.getByText('Pendiente')).toBeTruthy();
    expect(screen.queryByText(/Responde antes de/)).toBeNull();
    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledWith(booking);
  });

  it('como propietario muestra al solicitante y cuánto falta para responder', async () => {
    jest.useFakeTimers({ now: NOW });
    await render(
      <BookingCard
        booking={fakeBooking({ viewerRole: 'owner', expiresAt: '2026-11-11T14:00:00Z' })}
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByText('Con Luis Pérez · 12–14 nov')).toBeTruthy();
    expect(screen.getByText('Responde antes de 2 h')).toBeTruthy();
  });

  it('el nombre accesible incluye título, persona, fechas y estado', async () => {
    await render(<BookingCard booking={fakeBooking({ status: 'accepted' })} onPress={jest.fn()} />);
    expect(
      screen.getByLabelText('Taladro percutor, Con Ana López, 12–14 nov, Aceptada'),
    ).toBeTruthy();
  });
});
