import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { useSession } from '@/features/auth/useSession';
import { BackButton } from '@/features/incidents/components/BackButton';
import { IncidentCard } from '@/features/incidents/components/IncidentCard';
import { useMyIncidents } from '@/features/incidents/hooks';
import { counterpartName } from '@/features/incidents/rules';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { spacing } from '@/theme';

const t = es.incidents.list;

/** Mis incidencias (spec 010 §7.4, RF-07, CA-04): lista paginada, con estados de carga, vacío y error. */
export function MyIncidentsScreen() {
  const router = useRouter();
  const { user } = useSession();
  const query = useMyIncidents();
  const incidents = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <Screen>
      <View style={styles.topBar}>
        <BackButton onPress={() => router.back()} />
        <AppText variant="title" accessibilityRole="header">
          {t.title}
        </AppText>
      </View>

      {query.isPending ? (
        <LoadingState variant="card" label={es.common.loading} />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : incidents.length === 0 ? (
        <EmptyState icon="shield" title={t.emptyTitle} description={t.emptyDescription} />
      ) : (
        <View style={styles.list}>
          {incidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              counterpart={counterpartName(incident, user?.id ?? null)}
              onPress={() => router.push(routes.incident(incident.id))}
            />
          ))}
          {query.hasNextPage ? (
            <Button
              label={t.more}
              variant="outline"
              loading={query.isFetchingNextPage}
              onPress={() => void query.fetchNextPage()}
            />
          ) : null}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.smd },
  list: { gap: spacing.smd },
});
