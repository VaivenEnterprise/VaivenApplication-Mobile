import { z } from 'zod';

// Resultado de buscar una herramienta cerca (`GET /items`, tarjeta pública del backend 006). Se
// validan solo los campos que usa la pantalla de proyecto; el resto se ignora (Art. IV).

const publicOwnerSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  ratingAverage: z.number().nullish(),
  ratingCount: z.number().int().min(0).default(0),
});

export const toolHitSchema = z.object({
  id: z.string(),
  title: z.string(),
  modality: z.enum(['loan', 'rent']),
  pricePerDayCents: z.number().int().min(0),
  thumbUrl: z.string().nullish(),
  distanceKm: z.number().nullish(),
  zone: z.object({ municipality: z.string(), neighborhood: z.string().nullish() }),
  approxLocation: z.object({ lat: z.number(), lng: z.number() }).nullish(),
  owner: publicOwnerSchema,
});
export type ToolHit = z.infer<typeof toolHitSchema>;

export const toolPageSchema = z.object({
  items: z.array(toolHitSchema),
  nextCursor: z.string().nullish(),
});
export type ToolPage = z.infer<typeof toolPageSchema>;

/** Radio de búsqueda por herramienta: 3 km al inicio, 10 km al ampliar (RF-13). */
export type ToolRadiusKm = 3 | 10;
export const DEFAULT_RADIUS_KM: ToolRadiusKm = 3;
export const WIDE_RADIUS_KM: ToolRadiusKm = 10;
/** Resultados pedidos por herramienta; la persona a pedir es el más cercano. */
export const TOOL_LIMIT = 3;
