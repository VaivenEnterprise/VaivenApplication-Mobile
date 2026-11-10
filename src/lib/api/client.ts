import type { z } from 'zod';
import { ApiError, fromServerError, messageForCode } from '@/lib/api/errors';
import { newRequestId } from '@/lib/api/request-id';
import { getConfig } from '@/lib/config';

// Único punto de salida a la red (Art. II, IV): todo `fetch` de la app pasa por
// `request`, que valida la respuesta con `zod` y normaliza cualquier fallo a
// `ApiError`. Nunca se registran cuerpos, cabeceras ni tokens.

export const REQUEST_TIMEOUT_MS = 10_000;
export const API_PREFIX = '/api/v1';

/** Opciones de `fetch` sin `signal` (el cliente controla el tiempo máximo). */
export type RequestOptions = Omit<RequestInit, 'signal' | 'headers'> & {
  headers?: Record<string, string>;
};

/**
 * Llama a `${EXPO_PUBLIC_API_URL}/api/v1${path}` y devuelve el cuerpo validado.
 * Errores: `ApiError` con `code` del servidor, `invalid_response` (el cuerpo no
 * cumple `schema`), `network_error` (sin conexión) o `timeout` (más de 10 s).
 * Una configuración inválida lanza `ConfigError`: la app no debería llegar aquí.
 */
export async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  init: RequestOptions = {},
): Promise<T> {
  const { apiBaseUrl } = getConfig();
  const requestId = newRequestId();
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  const hasBody = init.body !== undefined && init.body !== null;
  const url = `${apiBaseUrl}${API_PREFIX}${path.startsWith('/') ? path : `/${path}`}`;

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
        // Va al final para que nadie lo sobrescriba: correlaciona con los logs del servidor.
        'X-Request-Id': requestId,
      },
      signal: controller.signal,
    });
    const body: unknown = await response.json().catch(() => null);
    // Si el tiempo venció mientras se leía el cuerpo, `json()` falla: es un timeout.
    if (timedOut) throw new ApiError('timeout', messageForCode('timeout'), null, requestId);
    if (!response.ok) throw fromServerError(response.status, body, requestId);

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(
        'invalid_response',
        messageForCode('invalid_response'),
        response.status,
        requestId,
      );
    }
    return parsed.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (timedOut) throw new ApiError('timeout', messageForCode('timeout'), null, requestId);
    throw new ApiError('network_error', messageForCode('network_error'), null, requestId);
  } finally {
    clearTimeout(timer);
  }
}
