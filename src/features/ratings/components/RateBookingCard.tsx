import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { RatingStars } from '@/components/ui/RatingStars';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Booking } from '@/features/bookings';
import { RatingForm } from '@/features/ratings/components/RatingForm';
import { useRatingStatus } from '@/features/ratings/hooks';
import { es } from '@/i18n/es-MX';
import { formatDate } from '@/lib/format/date';
import { colors, spacing } from '@/theme';

const t = es.ratings.card;

/** La contraparte de quien mira la reserva; el administrador no califica. */
export function counterpartOf(booking: Booking): { id: string; displayName: string } | null {
  if (booking.viewerRole === 'owner') return booking.requester;
  if (booking.viewerRole === 'requester') return booking.owner;
  return null;
}

/**
 * Tarjeta «Calificar» del detalle de la reserva (spec 010 §7.1, RF-01). Cuatro estados: puede
 * calificar (estrellas vacías tocables que abren la hoja), ya calificó (su puntuación), venció la
 * ventana y no aplica (la reserva no ha concluido: no se dibuja nada ni se consulta nada).
 */
export function RateBookingCard({ booking }: { booking: Booking }) {
  const counterpart = counterpartOf(booking);
  const applies = booking.status === 'completed' && counterpart !== null;
  const [score, setScore] = useState<number | null>(null);

  if (!applies || counterpart === null) return null;
  // La hoja vive fuera del estado de la tarjeta: al enviar, la tarjeta pasa a «Tu calificación»
  // y la hoja debe seguir abierta para mostrar «Gracias».
  return (
    <>
      <StatusCard booking={booking} counterpart={counterpart} onPick={setScore} />
      {score === null ? null : (
        <RatingForm
          bookingId={booking.id}
          counterpartName={counterpart.displayName}
          initialScore={score}
          onClose={() => setScore(null)}
        />
      )}
    </>
  );
}

type StatusCardProps = {
  booking: Booking;
  counterpart: { id: string; displayName: string };
  onPick: (score: number) => void;
};

function StatusCard({ booking, counterpart, onPick }: StatusCardProps) {
  const status = useRatingStatus(booking.id, true);

  if (status.isPending) {
    return (
      <Card variant="muted" style={styles.card}>
        <View accessible accessibilityLabel={es.common.loading}>
          <Skeleton width="60%" />
        </View>
      </Card>
    );
  }

  if (status.isError) {
    return (
      <Card variant="muted" style={styles.card}>
        <AppText color="muted">{t.loadFailed}</AppText>
        <Button label={es.common.retry} variant="link" onPress={() => void status.refetch()} />
      </Card>
    );
  }

  const { canRate, myRating, expiresAt } = status.data;

  if (myRating !== null) {
    return (
      <Card variant="muted" style={styles.card}>
        <AppText variant="subheading" accessibilityRole="header">
          {t.yourRating}
        </AppText>
        <RatingStars value={myRating.score} />
        {myRating.comment ? <AppText color="muted">{myRating.comment}</AppText> : null}
      </Card>
    );
  }

  if (!canRate) {
    return (
      <Card variant="muted" style={styles.card}>
        <AppText variant="subheading" accessibilityRole="header" color="muted">
          {t.expired}
        </AppText>
        <AppText variant="caption" color="muted">
          {t.expiredHint}
        </AppText>
      </Card>
    );
  }

  return (
    <Card style={[styles.card, styles.soft]}>
      <View style={styles.head}>
        <Avatar name={counterpart.displayName} size="md" />
        <AppText variant="subheading" accessibilityRole="header" style={styles.title}>
          {`${t.prompt} ${counterpart.displayName}`}
        </AppText>
      </View>
      <RatingStars value={0} onChange={onPick} />
      {expiresAt === null ? null : (
        <AppText variant="caption" color="muted">
          {`${t.deadline} ${formatDate(expiresAt)}`}
        </AppText>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.smd },
  soft: { backgroundColor: colors.primarySoft },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.smd },
  title: { flex: 1 },
});
