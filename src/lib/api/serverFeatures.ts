import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { request } from '@/lib/api/client';

// Spec 021-T014 (RF-13, B-6): los interruptores de funciones del servidor (`GET /meta` →
// `features`) se piden en UNA consulta compartida. Antes la IA y las recomendaciones pedían `/meta`
// cada una con su clave y la app hacía dos peticiones iguales. Cada funcionalidad lee su
// interruptor con `select`; si falta `features` o un campo, esa función está apagada.

/** Solo la parte de `GET /meta` que usan las funciones opcionales. */
export const serverFeaturesSchema = z.object({
  features: z
    .object({
      aiSuggestions: z.boolean().optional(),
      recommendations: z.boolean().optional(),
    })
    .optional(),
});

export type ServerFeatures = { aiSuggestions: boolean; recommendations: boolean };

/** Los interruptores casi no cambian: se reutilizan 5 minutos. */
export const SERVER_FEATURES_STALE_MS = 5 * 60 * 1000;

/** Clave compartida (Art. XIII.4): la usan `ai-suggestions` y `recommendations`. */
export const serverFeaturesKeys = { all: ['meta', 'features'] as const };

/** `GET /meta`: cada interruptor es `true` solo si el servidor lo trae en `true`. */
export async function fetchServerFeatures(signal?: AbortSignal): Promise<ServerFeatures> {
  const meta = await request('/meta', serverFeaturesSchema, { signal });
  return {
    aiSuggestions: meta.features?.aiSuggestions === true,
    recommendations: meta.features?.recommendations === true,
  };
}

/** Opciones de la consulta compartida; cada hook agrega su `select` y su `enabled`. */
export const serverFeaturesQuery = queryOptions({
  queryKey: serverFeaturesKeys.all,
  queryFn: ({ signal }) => fetchServerFeatures(signal),
  staleTime: SERVER_FEATURES_STALE_MS,
});
