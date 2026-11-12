import { render, screen } from '@testing-library/react-native';
import { Timeline } from '@/features/bookings/components/Timeline';
import { BOOKING_STATUSES } from '@/features/bookings/types';
import { es } from '@/i18n/es-MX';

const t = es.bookings.timeline;

describe('Timeline', () => {
  it.each([
    ['pending', t.requested],
    ['accepted', t.accepted],
    ['in_progress', t.inProgress],
    ['completed', t.completed],
  ] as const)('«%s» anuncia el paso actual con texto', async (status, label) => {
    await render(<Timeline status={status} />);
    expect(screen.getByLabelText(`${t.label}: ${label}`)).toBeTruthy();
    expect(screen.getByText(t.requested)).toBeTruthy();
    expect(screen.getByText(t.completed)).toBeTruthy();
  });

  it.each(BOOKING_STATUSES.filter((s) => ['rejected', 'expired', 'cancelled'].includes(s)))(
    'no se dibuja si la reserva está %s',
    async (status) => {
      await render(<Timeline status={status} />);
      expect(screen.queryByText(t.requested)).toBeNull();
    },
  );
});
