import { z } from 'zod';

// Tarjeta pública de un objeto (`ItemCard` en `backend/api/openapi.yaml`). Se validan solo los
// campos que usa Inicio; el resto del contrato se ignora para no romper con campos nuevos.

export const homeItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  modality: z.enum(['loan', 'rent']),
  pricePerDayCents: z.number().int().min(0),
  thumbUrl: z.string().nullable(),
});

export const recentItemsSchema = z.object({
  items: z.array(homeItemSchema),
  nextCursor: z.string().nullable(),
});

export type HomeItem = z.infer<typeof homeItemSchema>;
export type RecentItems = z.infer<typeof recentItemsSchema>;
