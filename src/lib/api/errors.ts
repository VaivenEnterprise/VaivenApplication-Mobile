import { z } from 'zod';
import { es } from '@/i18n/es-MX';

// Error único de la app para todo lo que sale de la red (Art. IV.2): el cliente de
// API normaliza aquí cualquier fallo y la UI solo conoce `ApiError`.

export const SERVER_ERROR_CODES = [
  'validation_failed',
  'unauthorized',
  'forbidden',
  'not_found',
  'conflict',
  'rate_limited',
  'internal_error',
  'service_unavailable',
] as const;

export const CLIENT_ERROR_CODES = ['network_error', 'timeout', 'invalid_response'] as const;

export const API_ERROR_CODES = [...SERVER_ERROR_CODES, ...CLIENT_ERROR_CODES] as const;

export type ServerErrorCode = (typeof SERVER_ERROR_CODES)[number];
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];
export type ApiErrorDetail = { readonly field: string; readonly issue: string };

/** Mensaje en español para la persona usuaria. Si falta una clave en `i18n`, no compila. */
export function messageForCode(code: ApiErrorCode): string {
  return es.errors[code];
}

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number | null;
  readonly requestId: string | null;
  readonly details: readonly ApiErrorDetail[];

  constructor(
    code: ApiErrorCode,
    message: string,
    status: number | null,
    requestId: string | null,
    details: readonly ApiErrorDetail[] = [],
  ) {
    super(message);
    // Mantiene `instanceof ApiError` aunque el compilador transforme las clases.
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.requestId = requestId;
    this.details = details;
  }
}

const serverEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().nullish(),
    details: z.array(z.object({ field: z.string(), issue: z.string() })).catch([]),
  }),
});

function isServerCode(code: string): code is ServerErrorCode {
  return (SERVER_ERROR_CODES as readonly string[]).includes(code);
}

/** Código equivalente cuando el cuerpo no trae el envoltorio del backend. */
function codeFromStatus(status: number): ServerErrorCode {
  switch (status) {
    case 400:
    case 422:
      return 'validation_failed';
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'not_found';
    case 409:
      return 'conflict';
    case 429:
      return 'rate_limited';
    case 503:
      return 'service_unavailable';
    default:
      // 5xx y cualquier otro estado no previsto en el contrato.
      return 'internal_error';
  }
}

/**
 * Convierte una respuesta de error en `ApiError`. Usa el envoltorio del backend
 * cuando lo cumple; si no (proxy, HTML, cuerpo vacío o código desconocido) deriva
 * el `code` del estado HTTP y usa el mensaje de `i18n`.
 */
export function fromServerError(status: number, body: unknown, requestId: string | null): ApiError {
  const parsed = serverEnvelopeSchema.safeParse(body);
  if (parsed.success && isServerCode(parsed.data.error.code)) {
    const { code, message, details, requestId: serverRequestId } = parsed.data.error;
    return new ApiError(
      code,
      message.trim() === '' ? messageForCode(code) : message,
      status,
      serverRequestId ?? requestId,
      details,
    );
  }
  const code = codeFromStatus(status);
  return new ApiError(code, messageForCode(code), status, requestId);
}
