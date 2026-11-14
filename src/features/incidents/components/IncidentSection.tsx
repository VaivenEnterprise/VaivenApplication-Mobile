import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { ListRow } from '@/components/ui/ListRow';
import type { Booking } from '@/features/bookings';
import { useSession } from '@/features/auth/useSession';
import { IncidentCard } from '@/features/incidents/components/IncidentCard';
import { useMyIncidents } from '@/features/incidents/hooks';
import { canReport, counterpartName } from '@/features/incidents/rules';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { spacing } from '@/theme';

const t = es.incidents.section;

/**
 * Parte «incidencias» del detalle de la reserva (spec 010 RF-05, RF-07): las incidencias de esta
 * reserva y, si procede (`canReport`), la fila «Reportar incidencia». Sin nada que mostrar no
 * ocupa lugar. La lista se pide en segundo plano; mientras llega o si falla, solo se omite.
 */
export function IncidentSection({ booking }: { booking: Booking }) {
  const router = useRouter();
  const { user } = useSession();
  const mine = useMyIncidents();
  const offered = canReport(booking);
  const incidents = (mine.data?.pages.flatMap((page) => page.items) ?? []).filter(
    (incident) => incident.bookingId === booking.id,
  );

  if (!offered && incidents.length === 0) return null;

  return (
    <View style={styles.root}>
      {incidents.length === 0 ? null : (
        <View style={styles.list}>
          <AppText variant="label" color="muted">
            {t.mine}
          </AppText>
          {incidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              counterpart={counterpartName(incident, user?.id ?? null)}
              onPress={() => router.push(routes.incident(incident.id))}
            />
          ))}
        </View>
      )}
      {offered ? (
        <Card variant="muted">
          <ListRow
            title={t.action}
            subtitle={t.hint}
            leading={<IconBadge icon="danger" tone="warning" />}
            onPress={() => router.push(routes.reportIncident(booking.id))}
          />
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  list: { gap: spacing.sm },
});
