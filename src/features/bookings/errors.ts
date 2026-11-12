import { es } from '@/i18n/es-MX';
import { ApiError } from '@/lib/api/errors';

/** Texto de un fallo al actuar sobre una reserva (aceptar, rechazar, cancelar, punto de encuentro). */
export function actionErrorMessage(error: unknown): string {
  const t = es.bookings.errors;
  if (!(error instanceof ApiError)) return t.generic;
  if (error.status === 409) return t.invalidTransition;
  if (error.status === 403) return t.forbidden;
  if (error.status === 404) return t.notFound;
  if (error.code === 'network_error' || error.code === 'timeout') return es.errors[error.code];
  return t.generic;
}
