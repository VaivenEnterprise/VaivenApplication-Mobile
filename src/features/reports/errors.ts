import { es } from '@/i18n/es-MX';
import { ApiError, messageForCode } from '@/lib/api/errors';

const t = es.reports.errors;

/** Mensaje claro para un fallo al reportar: 409 (lo propio), 404 y 400 tienen texto propio. */
export function reportErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return t.generic;
  switch (error.code) {
    case 'conflict':
      return t.self;
    case 'not_found':
      return t.notFound;
    case 'validation_failed':
      return t.detailsTooLong;
    case 'network_error':
    case 'timeout':
    case 'rate_limited':
    case 'service_unavailable':
      return messageForCode(error.code);
    default:
      return t.generic;
  }
}
