import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { timelineStep } from '@/features/bookings/rules';
import type { BookingStatus } from '@/features/bookings/types';
import { es } from '@/i18n/es-MX';
import { colors, radius, spacing } from '@/theme';

const t = es.bookings.timeline;
const STEPS = [t.requested, t.accepted, t.inProgress, t.completed] as const;
const DOT = spacing.smd;

type TimelineProps = { status: BookingStatus };

/**
 * Línea de avance: Solicitada → Aceptada → En curso → Concluida. Cada paso lleva su texto y el
 * actual se anuncia completo; el color solo acompaña. No se dibuja si la reserva terminó sin
 * completarse (rechazada, vencida o cancelada).
 */
export function Timeline({ status }: TimelineProps) {
  const current = timelineStep(status);
  if (current === null) return null;
  return (
    <View accessible accessibilityLabel={`${t.label}: ${STEPS[current]}`} style={styles.row}>
      {STEPS.map((label, index) => {
        const reached = index <= current;
        return (
          <View key={label} style={styles.step}>
            <View style={[styles.dot, reached ? styles.reached : styles.pending]} />
            <AppText
              variant="caption"
              color={index === current ? 'ink' : 'muted'}
              style={index === current ? styles.now : undefined}
              numberOfLines={1}
            >
              {label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  step: { flex: 1, gap: spacing.xs },
  dot: { height: DOT / 2, borderRadius: radius.pill },
  reached: { backgroundColor: colors.secondary },
  pending: { backgroundColor: colors.border },
  now: { textDecorationLine: 'underline' },
});
