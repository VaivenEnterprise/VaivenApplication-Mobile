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

// Respuesta de `GET /healthz`: el proceso está vivo (fuera de `/api/v1`).
export const healthSchema = z.object({ status: z.string() });
export type Health = z.infer<typeof healthSchema>;

// Respuesta de `GET /readyz`: MongoDB responde; `redis` puede venir como «degradado» en local.
export const readinessSchema = z.object({
  status: z.string(),
  redis: z.string().optional(),
});

/** Estado de disponibilidad ya normalizado: `ready` es falso si el servidor contestó 503. */
export type Readiness = { readonly ready: boolean; readonly redis: string | null };
