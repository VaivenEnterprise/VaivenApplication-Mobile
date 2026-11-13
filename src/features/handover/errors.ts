import { ApiError } from '@/lib/api/errors';

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

/** `true` si el servidor rechazó el cambio por el estado de la reserva o de la etapa (409). */
export function isStageConflict(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'conflict';
}
