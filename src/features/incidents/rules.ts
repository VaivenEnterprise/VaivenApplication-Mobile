import type { Booking } from '@/features/bookings';
import type { Incident } from '@/features/incidents/types';

// Reglas de la interfaz (plan P-02): solo deciden qué mostrar; el servidor decide y responde 409
// o 403 si algo no procede (RF-08).

/** Ventana, en horas, para reportar una reserva ya concluida (POL-08). */
export const REPORT_WINDOW_HOURS = 72;
const HOUR_MS = 3_600_000;

type Reportable = Pick<Booking, 'status' | 'viewerRole' | 'updatedAt'> & {
  return?: { confirmedAt?: string | null } | null | undefined;
};

/**
 * ¿Se ofrece «Reportar incidencia»? Sí con la reserva aceptada o en curso, y concluida solo dentro
 * de las 72 h siguientes (CA-06: una rechazada, cancelada, vencida o pendiente no lo ofrece). El
 * administrador no reporta. La hora de conclusión sale de la confirmación de la devolución y, si
 * falta, de la última actualización de la reserva.
 */
export function canReport(booking: Reportable, now: Date = new Date()): boolean {
  if (booking.viewerRole === 'admin') return false;
  if (booking.status === 'accepted' || booking.status === 'in_progress') return true;
  if (booking.status !== 'completed') return false;
  const closedAt = Date.parse(booking.return?.confirmedAt ?? booking.updatedAt);
  // Sin una fecha válida se ofrece: el servidor aplica la ventana real.
  if (Number.isNaN(closedAt)) return true;
  return now.getTime() - closedAt <= REPORT_WINDOW_HOURS * HOUR_MS;
}

/** El nombre de la otra persona de la incidencia, visto desde quien mira. */
export function counterpartName(incident: Incident, viewerId: string | null): string {
  return incident.reporter.id === viewerId
    ? incident.reported.displayName
    : incident.reporter.displayName;
}

/** Pasos del avance de una incidencia: enviada, en revisión y cerrada. */
export type IncidentStep = 'sent' | 'review' | 'closed';
export type StepState = 'done' | 'now' | 'next';

/** Estado de cada paso: «Enviado» siempre listo; «En revisión» en curso mientras está abierta. */
export function stepStates(status: Incident['status']): Record<IncidentStep, StepState> {
  return status === 'closed'
    ? { sent: 'done', review: 'done', closed: 'done' }
    : { sent: 'done', review: 'now', closed: 'next' };
}
