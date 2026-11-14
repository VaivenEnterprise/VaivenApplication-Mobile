import { ApiError } from '@/lib/api/errors';

// Rechazo del filtro de contenido (backend 011, RF-07). El contrato no tiene un código propio:
// llega como `400 validation_failed` con el motivo en `details[].issue` del campo rechazado
// («Contiene contenido no permitido: armas.»). Es la única lectura de ese formato en la app.

export type ModerationRejection = {
  /** Categoría legible («Armas»), o `null` si el motivo no la trae. */
  category: string | null;
  /** Motivo completo tal como lo manda el servidor, o `null` si no vino. */
  reason: string | null;
  /** Id de la petición rechazada; sirve de referencia al reportar la decisión. */
  requestId: string | null;
};

const MODERATION_PREFIX = 'Contiene contenido no permitido';

/**
 * Reconoce un rechazo de moderación en `error` para alguno de los `fields`. Devuelve `null` si el
 * fallo es otro (red, 5xx, validación común), que no se arregla con un aviso de moderación.
 */
export function moderationFromError(
  error: unknown,
  fields: readonly string[],
): ModerationRejection | null {
  if (!(error instanceof ApiError)) return null;
  if (error.status !== 400 || error.code !== 'validation_failed') return null;
  const detail = error.details.find(
    (d) => fields.includes(d.field) && d.issue.startsWith(MODERATION_PREFIX),
  );
  if (detail === undefined) return null;
  return parseModerationReason(detail.issue, error.requestId);
}

/** Separa la categoría del motivo que manda el servidor («…no permitido: armas.» → «Armas»). */
export function parseModerationReason(
  reason: string | null,
  requestId: string | null = null,
): ModerationRejection {
  const match = reason === null ? null : /:\s*(.+?)\.?\s*$/.exec(reason);
  const raw = match?.[1] ?? null;
  const category = raw === null ? null : raw.charAt(0).toUpperCase() + raw.slice(1);
  return { category, reason, requestId };
}
