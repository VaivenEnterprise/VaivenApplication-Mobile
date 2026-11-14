import {
  incidentPageSchema,
  incidentSchema,
  type Incident,
  type IncidentPage,
  type IncidentRequest,
  type IncidentStatus,
} from '@/features/incidents/types';
import { request } from '@/lib/api/client';

// Las 3 rutas de incidencias de las partes (backend 010). Las rutas `/admin/*` no se usan en la
// app. Todo pasa por `request` (Art. II, IV). La evidencia llega con URL firmadas de 10 minutos.

/** Tamaño de página de «Mis incidencias». */
export const INCIDENTS_PAGE_SIZE = 20;

/** `POST /bookings/{id}/incidents`: abre una incidencia; la reserva no cambia de estado. */
export function createIncident(bookingId: string, body: IncidentRequest): Promise<Incident> {
  return request(`/bookings/${encodeURIComponent(bookingId)}/incidents`, incidentSchema, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** `GET /incidents/{id}`: solo las dos partes; notas visibles y respuesta final. */
export function fetchIncident(id: string, signal?: AbortSignal): Promise<Incident> {
  return request(`/incidents/${encodeURIComponent(id)}`, incidentSchema, { signal });
}

/** `GET /me/incidents`: las que reporté o me reportaron, las más recientes primero. */
export function fetchMyIncidents(
  cursor: string | null,
  status?: IncidentStatus,
  signal?: AbortSignal,
): Promise<IncidentPage> {
  const params = new URLSearchParams({ limit: String(INCIDENTS_PAGE_SIZE) });
  if (status !== undefined) params.set('status', status);
  if (cursor !== null) params.set('cursor', cursor);
  return request(`/me/incidents?${params.toString()}`, incidentPageSchema, { signal });
}
