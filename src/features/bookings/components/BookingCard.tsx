import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { ExpiryCountdown } from '@/features/bookings/components/ExpiryCountdown';
import { StatusBadge } from '@/features/bookings/components/StatusBadge';
import { formatRange } from '@/features/bookings/dates';
import type { Booking } from '@/features/bookings/types';
import { es } from '@/i18n/es-MX';
import { colors, motion, radius, sizes, spacing } from '@/theme';

type BookingCardProps = { booking: Booking; onPress: (booking: Booking) => void };

/**
 * Tarjeta de Actividad (spec 007 §7.4): miniatura, título, con quién, fechas y estado. Si el
 * propietario tiene una solicitud pendiente, muestra cuánto falta para que venza.
 */
export function BookingCard({ booking, onPress }: BookingCardProps) {
  const counterpart = booking.viewerRole === 'owner' ? booking.requester : booking.owner;
  const dates = formatRange(booking.startDate, booking.endDate);
  const status = es.bookings.status[booking.status];
  const label = `${booking.item.title}, ${es.bookings.activity.with} ${counterpart.displayName}, ${dates}, ${status}`;
  const awaiting =
    booking.viewerRole === 'owner' && booking.status === 'pending' && booking.expiresAt;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => onPress(booking)}
      style={({ pressed }) => [
        styles.row,
        pressed ? { transform: [{ scale: motion.pressScale }] } : null,
      ]}
    >
      <View style={styles.thumb}>
        {booking.item.thumbUrl ? (
          <Image
            source={{ uri: booking.item.thumbUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <AppIcon name="cube" size="lg" color="muted" />
        )}
      </View>
      <View style={styles.texts}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {booking.item.title}
        </AppText>
        <AppText variant="caption" color="muted" numberOfLines={1}>
          {`${es.bookings.activity.with} ${counterpart.displayName} · ${dates}`}
        </AppText>
        <StatusBadge status={booking.status} />
        {awaiting ? (
          <ExpiryCountdown
            expiresAt={booking.expiresAt!}
            prefix={es.bookings.activity.respondBefore}
          />
        ) : null}
      </View>
      <AppIcon name="chevronForward" color="muted" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smd,
    padding: spacing.smd,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    minHeight: sizes.thumbLg + spacing.lg,
  },
  thumb: {
    width: sizes.thumbLg,
    height: sizes.thumbLg,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: spacing.xs },
});
