import { StyleSheet, View } from 'react-native';
import { AppText, type ColorToken } from '@/components/ui/AppText';
import type { BookingStatus } from '@/features/bookings/types';
import { es } from '@/i18n/es-MX';
import { colors, radius, spacing } from '@/theme';

const PALETTE: Record<BookingStatus, { background: ColorToken; ink: ColorToken }> = {
  pending: { background: 'warningSoft', ink: 'warning' },
  accepted: { background: 'secondarySoft', ink: 'secondaryPressed' },
  in_progress: { background: 'primarySoft', ink: 'primaryInk' },
  completed: { background: 'secondarySoft', ink: 'secondaryPressed' },
  rejected: { background: 'dangerSoft', ink: 'danger' },
  expired: { background: 'surfaceMuted', ink: 'muted' },
  cancelled: { background: 'surfaceMuted', ink: 'muted' },
};

type StatusBadgeProps = { status: BookingStatus };

/** Píldora del estado de una reserva: el texto, no solo el color, dice el estado (spec 007 §7.4). */
export function StatusBadge({ status }: StatusBadgeProps) {
  const palette = PALETTE[status];
  return (
    <View style={[styles.pill, { backgroundColor: colors[palette.background] }]}>
      <AppText variant="eyebrow" color={palette.ink}>
        {es.bookings.status[status]}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.smd,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
});
