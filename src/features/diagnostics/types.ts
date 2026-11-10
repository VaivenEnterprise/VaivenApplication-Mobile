import { z } from 'zod';

// Respuesta de `GET /api/v1/meta` (backend spec 002, RF-06).
export const metaSchema = z.object({
  name: z.string(),
  version: z.string(),
  environment: z.string(),
  /** Hora del servidor en ISO-8601 UTC; se muestra con `formatDateTime`. */
  serverTime: z.string(),
});

export type Meta = z.infer<typeof metaSchema>;
