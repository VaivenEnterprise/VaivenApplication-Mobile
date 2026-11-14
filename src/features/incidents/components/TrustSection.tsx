import { StyleSheet, View } from 'react-native';
import type { Booking } from '@/features/bookings';
import { IncidentSection } from '@/features/incidents/components/IncidentSection';
import { RateBookingCard } from '@/features/ratings';
import { spacing } from '@/theme';

/**
 * Contenido completo del *slot* `ratingsAndIncidents`: la tarjeta «Calificar» (ratings) y la
 * sección de incidencias. El *slot* admite un solo componente, así que esta es la composición.
 */
export function TrustSection({ booking }: { booking: Booking }) {
  return (
    <View style={styles.root}>
      <RateBookingCard booking={booking} />
      <IncidentSection booking={booking} />
    </View>
  );
}

const styles = StyleSheet.create({ root: { gap: spacing.md } });
