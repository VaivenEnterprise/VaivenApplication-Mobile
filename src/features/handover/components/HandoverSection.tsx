import { StyleSheet, View } from 'react-native';
import type { Booking } from '@/features/bookings';
import { LateBanner } from '@/features/handover/components/LateBanner';
import { PaymentsSection } from '@/features/handover/components/PaymentsSection';
import { HANDOVER_STATUSES, StageSection } from '@/features/handover/components/StageSection';
import { Timeline } from '@/features/handover/components/Timeline';
import { spacing } from '@/theme';

/**
 * Contenido del *slot* `deliveryAndPayments` (RF-01): avisos, entrega y devolución, pagos y
 * línea de tiempo, en ese orden. Cada parte decide por sí sola si le toca mostrarse.
 */
export function HandoverSection({ booking }: { booking: Booking }) {
  if (!HANDOVER_STATUSES.includes(booking.status)) return null;
  return (
    <View style={styles.root}>
      <LateBanner booking={booking} />
      <StageSection booking={booking} />
      <PaymentsSection booking={booking} />
      <Timeline booking={booking} />
    </View>
  );
}

const styles = StyleSheet.create({ root: { gap: spacing.md } });
