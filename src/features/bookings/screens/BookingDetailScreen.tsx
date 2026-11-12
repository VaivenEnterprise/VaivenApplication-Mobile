import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Banner } from '@/components/ui/Banner';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { BookingActions } from '@/features/bookings/components/BookingActions';
import { ExpiryCountdown } from '@/features/bookings/components/ExpiryCountdown';
import { MeetingPointCard } from '@/features/bookings/components/MeetingPointCard';
import { MeetingPointSheet } from '@/features/bookings/components/MeetingPointSheet';
import { QuoteSummary } from '@/features/bookings/components/QuoteSummary';
import { StatusBadge } from '@/features/bookings/components/StatusBadge';
import { Timeline } from '@/features/bookings/components/Timeline';
import { formatRange } from '@/features/bookings/dates';
import { useBooking } from '@/features/bookings/hooks';
import { allowedActions } from '@/features/bookings/rules';
import { slots } from '@/features/bookings/slots';
import { OwnerCard } from '@/features/items';
import { es } from '@/i18n/es-MX';
import { ApiError } from '@/lib/api/errors';
import { routes } from '@/lib/routes';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.bookings.detail;

type BookingDetailScreenProps = { id: string };

/**
 * Detalle de una solicitud o reserva (spec 007 §7.5, CA-05 a CA-07): estado, línea de avance,
 * la otra persona, fechas, pago, punto de encuentro, acciones y las secciones que registren
 * 008, 009 y 010 en `slots`. Lee del caché de detalle, así que aceptar o cancelar lo actualiza
 * sin recargar (P-06).
 */
export function BookingDetailScreen({ id }: BookingDetailScreenProps) {
  const router = useRouter();
  const query = useBooking(id);
  const [editingMeeting, setEditingMeeting] = useState(false);
  const booking = query.data;

  const back = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.back}
      onPress={() => router.back()}
      style={styles.round}
    >
      <AppIcon name="arrowBack" />
    </Pressable>
  );

  if (booking === undefined) {
    const notFound = query.isError && query.error instanceof ApiError && query.error.status === 404;
    return (
      <Screen>
        {back}
        {query.isPending ? (
          <LoadingState variant="card" />
        ) : notFound ? (
          <EmptyState
            icon="swap"
            title={t.notFoundTitle}
            description={t.notFoundDescription}
            actionLabel={t.notFoundAction}
            onAction={() => router.back()}
          />
        ) : (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        )}
      </Screen>
    );
  }

  const isOwner = booking.viewerRole === 'owner';
  const counterpart = isOwner ? booking.requester : booking.owner;
  const actions = allowedActions(booking.viewerRole, booking.status);
  const showMeeting =
    booking.status === 'accepted' ||
    booking.status === 'in_progress' ||
    booking.meetingPoint != null;
  const notice =
    booking.status === 'rejected' || booking.status === 'cancelled' || booking.status === 'expired'
      ? es.bookings.statusBanner[booking.status]
      : null;
  const reason = booking.status === 'rejected' ? booking.rejectReason : booking.cancelReason;

  return (
    <Screen>
      {back}
      <View style={styles.head}>
        <AppText variant="title" accessibilityRole="header">
          {booking.item.title}
        </AppText>
        <StatusBadge status={booking.status} />
        {booking.status === 'pending' && booking.expiresAt ? (
          <ExpiryCountdown expiresAt={booking.expiresAt} />
        ) : null}
      </View>

      {notice === null ? null : <Banner variant="warning" message={notice} />}
      {notice !== null && booking.status === 'cancelled' && booking.cancelledBy ? (
        <AppText variant="caption" color="muted">
          {`${t.cancelledBy} ${booking.cancelledBy === 'owner' ? t.byOwner : t.byRequester}`}
        </AppText>
      ) : null}
      {notice !== null && booking.status !== 'expired' ? (
        <AppText variant="caption" color="muted">
          {`${t.reason}: ${reason ? reason : t.noReason}`}
        </AppText>
      ) : null}

      <Timeline status={booking.status} />

      <View style={styles.section}>
        <AppText variant="label" color="muted">
          {isOwner ? t.requester : t.owner}
        </AppText>
        <OwnerCard owner={counterpart} onPress={() => router.push(routes.user(counterpart.id))} />
      </View>

      <Card variant="muted" style={styles.summary}>
        <View style={styles.line}>
          <AppIcon name="calendar" size="sm" color="primaryInk" />
          <AppText variant="bodyStrong">
            {`${t.dates}: ${formatRange(booking.startDate, booking.endDate)}`}
          </AppText>
        </View>
        <AppText variant="label" color="muted">
          {`${t.payment}: ${es.bookings.paymentMode[booking.paymentMode]}`}
        </AppText>
        <QuoteSummary
          days={booking.days}
          pricePerDayCents={booking.priceSnapshot.pricePerDayCents}
          totalCents={booking.priceSnapshot.totalCents}
          paymentMode={booking.paymentMode}
          payments={booking.payments}
        />
      </Card>

      {showMeeting ? (
        <MeetingPointCard
          description={booking.meetingPoint?.description ?? null}
          {...(actions.includes('meetingPoint') ? { onEdit: () => setEditingMeeting(true) } : {})}
        />
      ) : null}

      {booking.usageRules ? (
        <View style={styles.section}>
          <AppText variant="label" color="muted">
            {es.items.detail.rules}
          </AppText>
          <AppText>{booking.usageRules}</AppText>
        </View>
      ) : null}

      <BookingActions booking={booking} />

      {slots.registered().map(({ name, Component }) => (
        <Component key={name} booking={booking} />
      ))}

      {actions.includes('meetingPoint') ? (
        <MeetingPointSheet
          key={booking.meetingPoint?.description ?? 'none'}
          bookingId={booking.id}
          initial={booking.meetingPoint?.description ?? null}
          visible={editingMeeting}
          onClose={() => setEditingMeeting(false)}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  round: {
    width: sizes.touch.minSize,
    height: sizes.touch.minSize,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  head: { gap: spacing.sm },
  section: { gap: spacing.sm },
  summary: { gap: spacing.sm },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
