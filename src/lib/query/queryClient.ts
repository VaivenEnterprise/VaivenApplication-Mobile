import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/errors';

// Convenciones de datos del lado cliente (constitución §6): consultas frescas
// 30 s y un único reintento solo para fallos transitorios.

export const QUERY_STALE_TIME_MS = 30_000;
export const MAX_QUERY_RETRIES = 1;

/**
 * Reintenta una sola vez los fallos de red, los timeouts y los 5xx. Nunca reintenta
 * los 4xx (la petición ya es inválida), las respuestas inválidas ni errores ajenos a `ApiError`.
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_QUERY_RETRIES) return false;
  if (!(error instanceof ApiError)) return false;
  if (error.code === 'network_error' || error.code === 'timeout') return true;
  return error.status !== null && error.status >= 500;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: QUERY_STALE_TIME_MS, retry: shouldRetry },
      mutations: { retry: false },
    },
  });
}
