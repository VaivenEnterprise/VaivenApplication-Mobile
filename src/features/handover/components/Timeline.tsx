import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import type { Booking } from '@/features/bookings';
import { es } from '@/i18n/es-MX';
import { formatDateTime } from '@/lib/format/date';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.handover.timeline;

export type TimelineEvent = { key: string; label: string; at: string | null };

/**
 * Eventos de la reserva a partir de sus campos (plan P-08, RF-09). Un evento sin hora conocida
 * (la aceptación, que el servidor no fecha) aparece sin hora, nunca con una inventada. Los fechados
 * van por orden de hora; la aceptación va justo tras la solicitud.
 */
export function buildTimeline(booking: Booking): TimelineEvent[] {
  const dated: (TimelineEvent & { at: string; order: number })[] = [];
  const push = (key: string, label: string, at: string | null | undefined) => {
    if (at != null && at !== '') dated.push({ key, label, at, order: dated.length });
  };
  push('requested', t.requested, booking.createdAt);
  push('delivery-recorded', t.deliveryRecorded, booking.delivery?.recordedAt);
  push('delivery-confirmed', t.deliveryConfirmed, booking.delivery?.confirmedAt);
  push('return-recorded', t.returnRecorded, booking.return?.recordedAt);
  push('return-confirmed', t.returnConfirmed, booking.return?.confirmedAt);
  for (const payment of booking.payments) {
    const name = payment.stage === 'delivery' ? 'Delivery' : 'Return';
    push(`${payment.stage}-reported`, t[`paymentReported${name}`], payment.reportedAt);
    push(`${payment.stage}-confirmed-pay`, t[`paymentConfirmed${name}`], payment.confirmedAt);
  }
  dated.sort((a, b) => Date.parse(a.at) - Date.parse(b.at) || a.order - b.order);

  const events: TimelineEvent[] = dated.map(({ key, label, at }) => ({ key, label, at }));
  const accepted = !['pending', 'rejected', 'expired'].includes(booking.status);
  const cancelledAfterAccept = booking.status === 'cancelled' && events.length > 1;
  if (accepted && (booking.status !== 'cancelled' || cancelledAfterAccept)) {
    const requestedAt = events.findIndex((event) => event.key === 'requested');
    events.splice(requestedAt + 1, 0, { key: 'accepted', label: t.accepted, at: null });
  }
  return events;
}

/** «Ver historial ›»: fila plegada que despliega la lista vertical de puntos con hora (spec 009 §7.1). */
export function Timeline({ booking }: { booking: Booking }) {
  const [open, setOpen] = useState(false);
  const events = buildTimeline(booking);
  return (
    <Card variant="muted" style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={open ? t.hide : t.show}
        onPress={() => setOpen((current) => !current)}
        style={styles.toggle}
      >
        <AppText variant="bodyStrong">{open ? t.hide : t.show}</AppText>
        <AppIcon name={open ? 'chevronDown' : 'chevronForward'} size="sm" />
      </Pressable>
      {open ? (
        events.length === 0 ? (
          <AppText variant="caption" color="muted">
            {t.empty}
          </AppText>
        ) : (
          <View style={styles.list}>
            {events.map((event) => (
              <View
                key={event.key}
                accessible
                accessibilityLabel={
                  event.at ? `${event.label}, ${formatDateTime(event.at)}` : event.label
                }
                style={styles.event}
              >
                <View style={styles.bullet} />
                <View style={styles.eventBody}>
                  <AppText variant="body">{event.label}</AppText>
                  {event.at ? (
                    <AppText variant="caption" color="muted">
                      {formatDateTime(event.at)}
                    </AppText>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  toggle: {
    minHeight: sizes.touch.minSize,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  list: { gap: spacing.md },
  event: { flexDirection: 'row', gap: spacing.md },
  bullet: {
    width: sizes.stepDot / 3,
    height: sizes.stepDot / 3,
    marginTop: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  eventBody: { flex: 1 },
});
