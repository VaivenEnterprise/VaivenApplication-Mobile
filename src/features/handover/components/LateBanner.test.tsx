import { render, screen } from '@testing-library/react-native';
import { LateBanner } from '@/features/handover/components/LateBanner';
import { es } from '@/i18n/es-MX';
import { fakeBooking } from '@/test/fakeBookings';

const t = es.handover.late;
const adjustment = {
  type: 'late_return' as const,
  lateDays: 2,
  amountCents: 6000,
  status: 'recorded' as const,
};

describe('LateBanner', () => {
  it('con retraso muestra los días y el ajuste registrado como informativo', async () => {
    await render(
      <LateBanner
        booking={fakeBooking({ status: 'in_progress', isLate: true, adjustments: [adjustment] })}
      />,
    );
    expect(screen.getByText(`${t.prefix} 2 ${t.days} ${t.suffix}`)).toBeTruthy();
    expect(screen.getByText(`${t.adjustment} $60.00. ${t.adjustmentNote}`)).toBeTruthy();
  });

  it('un solo día va en singular', async () => {
    await render(
      <LateBanner
        booking={fakeBooking({ isLate: true, adjustments: [{ ...adjustment, lateDays: 1 }] })}
      />,
    );
    expect(screen.getByText(`${t.prefix} 1 ${t.day} ${t.suffix}`)).toBeTruthy();
  });

  it('sin ajuste calcula los días desde el fin de la reserva y no muestra importe', async () => {
    await render(<LateBanner booking={fakeBooking({ isLate: true, endDate: '2020-01-01' })} />);
    expect(screen.getByText(new RegExp(`^${t.prefix} \\d+ ${t.days} ${t.suffix}$`))).toBeTruthy();
    expect(screen.queryByText(new RegExp(t.adjustment))).toBeNull();
  });

  it('una reserva afectada por otra explica el motivo', async () => {
    await render(<LateBanner booking={fakeBooking({ affectedBy: '6731b1b2c3d4e5f6a7b8c9aa' })} />);
    expect(screen.getByText(t.affected)).toBeTruthy();
    expect(screen.getByText(t.affectedNote)).toBeTruthy();
    expect(screen.queryByText(new RegExp(t.prefix))).toBeNull();
  });

  it('puede mostrar ambos avisos a la vez', async () => {
    await render(
      <LateBanner
        booking={fakeBooking({ isLate: true, adjustments: [adjustment], affectedBy: 'x' })}
      />,
    );
    expect(screen.getByText(t.affected)).toBeTruthy();
    expect(screen.getByText(`${t.prefix} 2 ${t.days} ${t.suffix}`)).toBeTruthy();
  });

  it('sin retraso ni afectación no pinta nada', async () => {
    await render(<LateBanner booking={fakeBooking({ isLate: false, affectedBy: null })} />);
    expect(screen.queryByText(t.affected)).toBeNull();
    expect(screen.queryByText(new RegExp(t.prefix))).toBeNull();
  });
});
