import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Banner } from '@/components/ui/Banner';
import type { Booking } from '@/features/bookings';
import { es } from '@/i18n/es-MX';
import { diffDaysYmd, todayYmd } from '@/lib/format/date';
import { formatMXN } from '@/lib/format/money';
import { spacing } from '@/theme';

const t = es.handover.late;

/** Días de retraso: los del ajuste registrado o, sin él, los que van desde el fin de la reserva. */
function lateDays(booking: Booking): number {
  const adjustment = booking.adjustments?.find((item) => item.type === 'late_return');
  if (adjustment) return adjustment.lateDays;
  const elapsed = diffDaysYmd(booking.endDate, todayYmd());
  return Number.isFinite(elapsed) ? Math.max(1, elapsed) : 1;
}

/**
 * Avisos de la reserva (spec 009 §7.1, RF-08): retraso en la devolución, con el ajuste registrado
 * solo como información, y reserva afectada por otra. No hay acciones: Vaivén no cobra el ajuste.
 */
export function LateBanner({ booking }: { booking: Booking }) {
  const adjustment = booking.adjustments?.find((item) => item.type === 'late_return');
  const late = booking.isLate === true;
  const affected = booking.affectedBy != null && booking.affectedBy !== '';
  if (!late && !affected) return null;

  const days = late ? lateDays(booking) : 0;
  return (
    <View style={styles.root}>
      {late ? (
        <View style={styles.group}>
          <Banner
            variant="warning"
            message={`${t.prefix} ${days} ${days === 1 ? t.day : t.days} ${t.suffix}`}
          />
          {adjustment ? (
            <AppText variant="caption" color="muted">
              {`${t.adjustment} ${formatMXN(adjustment.amountCents)}. ${t.adjustmentNote}`}
            </AppText>
          ) : null}
        </View>
      ) : null}
      {affected ? (
        <View style={styles.group}>
          <Banner variant="info" message={t.affected} />
          <AppText variant="caption" color="muted">
            {t.affectedNote}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  group: { gap: spacing.xs },
});
