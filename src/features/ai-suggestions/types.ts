import { z } from 'zod';

// Contrato de sugerencias con IA (backend/api/paths/ai.yaml, spec 014). La categoría es opcional:
// el servidor la omite cuando el modelo propone una clave que no existe en POL-14 (RF-04).

/** Respuesta de `POST /ai/listing-suggestions`: una propuesta para revisar, nunca un dato final. */
export const listingSuggestionSchema = z.object({
  title: z.string(),
  category: z.string().optional(),
  description: z.string().optional(),
});

export type ListingSuggestion = z.infer<typeof listingSuggestionSchema>;

/** Estado de la sugerencia en pantalla: `limit` es el tope diario (429), `error` cualquier otro fallo. */
export type SuggestionStatus = 'idle' | 'loading' | 'success' | 'error' | 'limit';
