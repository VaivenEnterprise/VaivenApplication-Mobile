import { addDays, diffDaysInclusive, isPast } from '@/features/bookings/dates';
import type { BookingStatus, ViewerRole } from '@/features/bookings/types';
import { isYmd } from '@/lib/format/date';

// Reglas de la interfaz (plan P-02): qué acciones se ofrecen por rol y estado. Solo decide qué
// mostrar; el servidor sigue siendo la autoridad y responde 403/409 si algo no procede.

/** Periodo máximo de una reserva, contando ambos extremos (POL-02). */
export const MAX_DAYS = 7;

/** Largo permitido del punto de encuentro y del motivo de cancelación (backend 007). */
export const MEETING_POINT_MIN = 3;
export const MEETING_POINT_MAX = 200;
export const CANCEL_REASON_MIN = 3;
export const CANCEL_REASON_MAX = 200;

export type BookingAction = 'accept' | 'reject' | 'cancel' | 'meetingPoint';

/**
 * Acciones permitidas. Siguen al backend: una `pending` solo la cancela quien la envió (el
 * propietario la rechaza), una `accepted` la cancela cualquiera de las dos partes con motivo, y el
 * punto de encuentro lo fija el propietario mientras la reserva está `accepted` o `in_progress`.
 */
export function allowedActions(role: ViewerRole, status: BookingStatus): BookingAction[] {
  if (role === 'owner') {
    if (status === 'pending') return ['accept', 'reject'];
    if (status === 'accepted') return ['cancel', 'meetingPoint'];
    if (status === 'in_progress') return ['meetingPoint'];
  }
  if (role === 'requester' && (status === 'pending' || status === 'accepted')) return ['cancel'];
  return [];
}

/** El motivo es obligatorio al cancelar una reserva ya aceptada. */
export function cancelNeedsReason(status: BookingStatus): boolean {
  return status === 'accepted';
}

/** Última fecha elegible como fin para un inicio dado. */
export function maxEnd(start: string): string {
  return addDays(start, MAX_DAYS - 1);
}

export type RangeProblem = 'invalid' | 'past' | 'inverted' | 'tooLong';

/** Valida un periodo: fechas reales, sin pasadas, `start ≤ end` y de 1 a 7 días. */
export function rangeProblem(start: string, end: string, today?: string): RangeProblem | null {
  if (!isYmd(start) || !isYmd(end)) return 'invalid';
  if (isPast(start, today)) return 'past';
  const days = diffDaysInclusive(start, end);
  if (days < 1) return 'inverted';
  return days > MAX_DAYS ? 'tooLong' : null;
}

export type StatusGroup = 'pending' | 'inProgress' | 'done';

/** Grupo del filtro de Actividad: pendientes, en curso (aceptada o en curso) y concluidas. */
export function statusGroup(status: BookingStatus): StatusGroup {
  if (status === 'pending') return 'pending';
  if (status === 'accepted' || status === 'in_progress') return 'inProgress';
  return 'done';
}

/** Punto de la línea de avance (0 a 3), o `null` si la reserva terminó sin completarse. */
export function timelineStep(status: BookingStatus): number | null {
  switch (status) {
    case 'pending':
      return 0;
    case 'accepted':
      return 1;
    case 'in_progress':
      return 2;
    case 'completed':
      return 3;
    default:
      return null;
  }
}
