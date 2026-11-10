import { es } from '@/i18n/es-MX';
import { ApiError, messageForCode } from '@/lib/api/errors';

export type AuthAction = 'login' | 'register';

/** Mensaje del formulario para un fallo de la API (nunca texto crudo del servidor). */
export function authErrorMessage(error: unknown, action: AuthAction): string {
  if (!(error instanceof ApiError)) return es.errors.unexpected;
  if (error.code === 'unauthorized' && action === 'login')
    return es.auth.formErrors.invalidCredentials;
  if (error.code === 'conflict' && action === 'register') return es.auth.formErrors.emailTaken;
  if (error.code === 'rate_limited') return es.auth.formErrors.rateLimited;
  return messageForCode(error.code);
}
