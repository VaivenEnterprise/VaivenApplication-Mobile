import { z } from 'zod';
import { MODALITIES } from '@/features/items';

// Contrato de recomendaciones (backend/api/paths/recommendations.yaml, spec 015). Se validan solo
// los campos que usa la tarjeta; el resto del `ItemCard` del servidor se ignora para no romper
// con campos nuevos (misma decisión que 006).

export const REASON_CODES = [
  'similar_to',
  'popular_in_category',
  'popular_nearby',
  'popular',
] as const;
export type ReasonCode = (typeof REASON_CODES)[number];

export const recommendationSchema = z.object({
  item: z.object({
    id: z.string(),
    title: z.string(),
    modality: z.enum(MODALITIES),
    pricePerDayCents: z.number().int().min(0),
    thumbUrl: z.string().nullish(),
  }),
  reason: z.object({
    // Un código nuevo del servidor no debe invalidar la lista: se trata como «popular».
    code: z.enum(REASON_CODES).catch('popular'),
    itemId: z.string().optional(),
    itemTitle: z.string().optional(),
  }),
});

export const recommendationListSchema = z.object({
  items: z.array(recommendationSchema),
  nextCursor: z.null().optional(),
});

/** Una recomendación: el objeto y el motivo por el que se muestra (`Recommendation { item, reason }`). */
export type Recommendation = z.infer<typeof recommendationSchema>;

/** Solo la parte de `GET /meta` que esta función necesita; si falta `features`, está apagada. */
export const recommendationFeaturesSchema = z.object({
  features: z.object({ recommendations: z.boolean().optional() }).optional(),
});

/** Cuántas recomendaciones se piden (el servidor admite de 1 a 20; por defecto 10). */
export const RECOMMENDATIONS_LIMIT = 10;

/** Caché breve de la lista y del interruptor (RNF-01): 5 minutos. */
export const RECOMMENDATIONS_STALE_MS = 5 * 60 * 1000;
