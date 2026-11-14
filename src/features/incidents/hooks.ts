import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingsKeys } from '@/features/bookings';
import { createIncident, fetchIncident, fetchMyIncidents } from '@/features/incidents/api';
import { incidentsKeys } from '@/features/incidents/keys';
import type { IncidentRequest, IncidentStatus } from '@/features/incidents/types';

/** Mis incidencias, paginadas por cursor (RF-07). */
export function useMyIncidents(status?: IncidentStatus) {
  return useInfiniteQuery({
    queryKey: incidentsKeys.mine(status),
    queryFn: ({ pageParam, signal }) => fetchMyIncidents(pageParam, status, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

/** Una incidencia con su evidencia firmada (URL de 10 minutos). */
export function useIncident(id: string) {
  return useQuery({
    queryKey: incidentsKeys.detail(id),
    queryFn: ({ signal }) => fetchIncident(id, signal),
  });
}

/**
 * Abre la incidencia. Deja el detalle listo para mostrarlo al instante y marca para recargar la
 * lista y la reserva (RF-05, CA-04). Los errores 409 los traduce `incidentErrorMessage`.
 */
export function useCreateIncident(bookingId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: IncidentRequest) => createIncident(bookingId, body),
    onSuccess: (incident) => {
      client.setQueryData(incidentsKeys.detail(incident.id), incident);
      void client.invalidateQueries({ queryKey: incidentsKeys.mine() });
      void client.invalidateQueries({ queryKey: bookingsKeys.detail(bookingId) });
    },
  });
}
