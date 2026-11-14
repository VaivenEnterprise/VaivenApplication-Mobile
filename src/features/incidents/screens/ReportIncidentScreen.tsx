import { useRouter } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { useBooking } from '@/features/bookings';
import { IncidentForm } from '@/features/incidents/components/IncidentForm';
import { canReport } from '@/features/incidents/rules';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';

const t = es.incidents.report;

/**
 * Reportar una incidencia desde el detalle de la reserva (spec 010 §7.3, RF-05). Si la reserva no
 * admite reporte (CA-06) se explica y se regresa a ella; al enviar, lleva al detalle de la incidencia.
 */
export function ReportIncidentScreen({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const query = useBooking(bookingId);
  const booking = query.data;

  if (booking === undefined) {
    return (
      <Screen>
        {query.isError ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : (
          <LoadingState label={es.common.loading} />
        )}
      </Screen>
    );
  }

  if (!canReport(booking)) {
    return (
      <Screen scroll={false}>
        <EmptyState
          icon="lock"
          title={t.notAllowedTitle}
          description={t.notAllowedDescription}
          actionLabel={t.notAllowedAction}
          onAction={() => router.replace(routes.booking(bookingId))}
        />
      </Screen>
    );
  }

  return (
    <IncidentForm
      bookingId={bookingId}
      onBack={() => router.back()}
      onCreated={(incident) => router.replace(routes.incident(incident.id))}
    />
  );
}
