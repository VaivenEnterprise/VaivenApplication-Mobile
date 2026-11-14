import { es } from '@/i18n/es-MX';
import { ApiError, messageForCode } from '@/lib/api/errors';

const t = es.ratings.errors;

/** Mensaje claro para un fallo al calificar (RF-08, CA-02): 409, 403 y 404 tienen texto propio. */
export function ratingErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return t.generic;
  switch (error.code) {
    case 'conflict':
      return t.conflict;
    case 'forbidden':
      return t.forbidden;
    case 'not_found':
      return t.notFound;
    case 'network_error':
    case 'timeout':
    case 'rate_limited':
    case 'service_unavailable':
      return messageForCode(error.code);
    default:
      return t.generic;
  }
}
