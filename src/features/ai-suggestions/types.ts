import { z } from 'zod';
// Directo a los tipos (no al índice) para no arrastrar la pantalla de proyecto a los esquemas.
import { toolHitSchema } from '@/features/project-guide/types';

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

// Asistente de proyectos (spec 021-T032, RF-30; `POST /ai/assistant/messages`). Las coincidencias
// son la tarjeta pública de la búsqueda (spec 006), nunca datos del modelo: se reutiliza el esquema
// de la guía de proyectos, que valida solo lo que la pantalla usa (Art. IV).

/** Largo del mensaje según `AssistantMessageRequest`. */
export const ASSISTANT_MESSAGE_MIN = 2;
export const ASSISTANT_MESSAGE_MAX = 500;

export const assistantNeedSchema = z.object({
  name: z.string(),
  category: z.string(),
  optional: z.boolean(),
  matches: z.array(toolHitSchema),
});
export type AssistantNeed = z.infer<typeof assistantNeedSchema>;

export const assistantReplySchema = z.object({
  summary: z.string(),
  needs: z.array(assistantNeedSchema),
  steps: z.array(z.string()),
  safetyNotes: z.array(z.string()),
});
export type AssistantReply = z.infer<typeof assistantReplySchema>;

export const assistantMessageResponseSchema = z.object({
  conversationId: z.string(),
  reply: assistantReplySchema,
});
export type AssistantMessageResponse = z.infer<typeof assistantMessageResponseSchema>;

/** Cuerpo de `POST /ai/assistant/messages`. La ubicación es solo para buscar cerca (RF-18). */
export type AssistantMessageRequest = {
  message: string;
  conversationId?: string;
  location?: { lat: number; lng: number };
};
