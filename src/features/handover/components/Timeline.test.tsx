import { fireEvent, render, screen } from '@testing-library/react-native';
import { buildTimeline, Timeline } from '@/features/handover/components/Timeline';
import { es } from '@/i18n/es-MX';
import { fakeBooking } from '@/test/fakeBookings';
import { fakeRecordedStage } from '@/test/fakeHandover';

const t = es.handover.timeline;
const labels = (booking = fakeBooking()) => buildTimeline(booking).map((event) => event.label);

describe('buildTimeline', () => {
  it('una solicitud pendiente solo tiene la solicitud, con su hora', () => {
    expect(buildTimeline(fakeBooking())).toEqual([
      { key: 'requested', label: t.requested, at: '2026-11-11T18:00:00Z' },
    ]);
  });

  it('la aceptación aparece sin hora, nunca con una inventada', () => {
    const events = buildTimeline(fakeBooking({ status: 'accepted' }));
    expect(events.map((event) => event.label)).toEqual([t.requested, t.accepted]);
    expect(events[1]?.at).toBeNull();
  });

  it('ordena por hora: evidencia, entrega, devolución y pagos', () => {
    const booking = fakeBooking({
      status: 'completed',
      delivery: fakeRecordedStage({
        recordedAt: '2026-11-12T10:00:00Z',
        confirmedAt: '2026-11-12T10:30:00Z',
      }),
      return: fakeRecordedStage({
        recordedAt: '2026-11-14T10:00:00Z',
        confirmedAt: '2026-11-14T10:30:00Z',
      }),
      payments: [
        {
          stage: 'delivery',
          amountCents: 9000,
          status: 'confirmed',
          reportedAt: '2026-11-12T10:40:00Z',
          confirmedAt: '2026-11-12T10:50:00Z',
        },
      ],
    });
    expect(labels(booking)).toEqual([
      t.requested,
      t.accepted,
      t.deliveryRecorded,
      t.deliveryConfirmed,
      t.paymentReportedDelivery,
      t.paymentConfirmedDelivery,
      t.returnRecorded,
      t.returnConfirmed,
    ]);
  });

  it('omite lo que falta: sin horas de etapa no hay eventos de etapa', () => {
    const booking = fakeBooking({
      status: 'in_progress',
      delivery: fakeRecordedStage({ recordedAt: null, confirmedAt: null }),
      payments: [
        {
          stage: 'return',
          amountCents: 100,
          status: 'reported',
          reportedAt: '2026-11-14T09:00:00Z',
        },
      ],
    });
    expect(labels(booking)).toEqual([t.requested, t.accepted, t.paymentReportedReturn]);
  });

  it('una solicitud rechazada, vencida o cancelada sin aceptar no inventa la aceptación', () => {
    for (const status of ['rejected', 'expired', 'cancelled'] as const) {
      expect(labels(fakeBooking({ status }))).toEqual([t.requested]);
    }
  });

  it('una cancelación tras haber avanzado conserva la aceptación', () => {
    const booking = fakeBooking({
      status: 'cancelled',
      delivery: fakeRecordedStage({ recordedAt: '2026-11-12T10:00:00Z' }),
    });
    expect(labels(booking)).toContain(t.accepted);
  });
});

describe('Timeline', () => {
  it('está plegada y «Ver historial» despliega y oculta los eventos', async () => {
    await render(<Timeline booking={fakeBooking({ status: 'accepted' })} />);
    expect(screen.queryByText(t.requested)).toBeNull();
    await fireEvent.press(screen.getByText(t.show));
    expect(screen.getByText(t.requested)).toBeTruthy();
    expect(screen.getByText(t.accepted)).toBeTruthy();
    expect(screen.getByLabelText(t.hide).props.accessibilityState).toMatchObject({
      expanded: true,
    });
    await fireEvent.press(screen.getByText(t.hide));
    expect(screen.queryByText(t.requested)).toBeNull();
  });

  it('muestra la hora solo de los eventos que la tienen', async () => {
    await render(<Timeline booking={fakeBooking({ status: 'accepted' })} />);
    await fireEvent.press(screen.getByText(t.show));
    expect(screen.getByLabelText(t.accepted)).toBeTruthy();
    expect(screen.getByLabelText(new RegExp(`^${t.requested}, .*2026`))).toBeTruthy();
  });

  it('con una fecha ilegible muestra el evento sin hora', async () => {
    await render(<Timeline booking={fakeBooking({ createdAt: 'no-es-fecha' })} />);
    await fireEvent.press(screen.getByText(t.show));
    expect(screen.getByText(t.requested)).toBeTruthy();
  });
});
