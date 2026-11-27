import { ApiError, messageForCode } from '@/lib/api/errors';

// Causa de un fallo al confirmar con el QR, para mostrar el mensaje justo (spec 009 RF-06). El
// servidor responde 409 igual si el QR venció, ya se usó o fue reemplazado, así que esos tres se
// muestran juntos («Venció o ya se usó»).

export type ScanFailure =
  'conflict' | 'forbidden' | 'notFound' | 'rateLimited' | 'network' | 'unknown';

export function scanFailureOf(error: unknown): ScanFailure {
  if (!(error instanceof ApiError)) return 'unknown';
  switch (error.code) {
    case 'conflict':
      return 'conflict';
    case 'forbidden':
      return 'forbidden';
    case 'not_found':
      return 'notFound';
    case 'rate_limited':
      return 'rateLimited';
    case 'network_error':
    case 'timeout':
      return 'network';
    default:
      return 'unknown';
  }
}

/**
 * Motivo de un 409 tal como lo explica el servidor (spec 021, defecto del QR). El 409 llega por
 * causas muy distintas —QR vencido o usado, fuera de las fechas de entrega, reserva en otro estado,
 * etapa ya confirmada o sin evidencia— y el contrato no trae otro dato para distinguirlas; un texto
 * fijo («Venció o ya se usó») hacía que la persona generara códigos nuevos que nunca servían.
 * Devuelve `null` si no es un 409 o si el servidor no mandó su propio mensaje.
 */
export function conflictReason(error: unknown): string | null {
  if (!(error instanceof ApiError) || error.code !== 'conflict') return null;
  const message = error.message.trim();
  return message === '' || message === messageForCode('conflict') ? null : message;
}

/** `true` si el servidor rechazó el cambio por el estado de la reserva o de la etapa (409). */
export function isStageConflict(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'conflict';
}
