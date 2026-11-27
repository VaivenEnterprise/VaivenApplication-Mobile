import { request } from '@/lib/api/client';
import { z } from 'zod';
import {
  assistantMessageResponseSchema,
  listingSuggestionSchema,
  type AssistantMessageRequest,
  type AssistantMessageResponse,
  type ListingSuggestion,
} from '@/features/ai-suggestions/types';

// Rutas de la IA al publicar (backend/api/paths/ai.yaml). El servidor no acepta URL: recibe el
// `publicId` de una foto propia ya subida y construye él mismo la miniatura.

// El interruptor (`GET /meta` → `features.aiSuggestions`, RF-02) sale de la consulta compartida
// `serverFeaturesQuery` de `@/lib/api/serverFeatures` (spec 021-T014, B-6).

/** `POST /ai/listing-suggestions`: propone título y categoría; `429` es el límite diario (RF-05). */
export function createListingSuggestion(
  imagePublicId: string,
  signal?: AbortSignal,
): Promise<ListingSuggestion> {
  return request('/ai/listing-suggestions', listingSuggestionSchema, {
    method: 'POST',
    body: JSON.stringify({ imagePublicId }),
    signal,
  });
}

/**
 * `POST /ai/assistant/messages` (spec 021-T032): sin `conversationId` abre una conversación; con
 * él la continúa. Solo se envía lo que la persona escribió y, si la hay, su ubicación aproximada;
 * nunca datos del chat entre personas (RF-30).
 */
export function sendAssistantMessage(
  body: AssistantMessageRequest,
  signal?: AbortSignal,
): Promise<AssistantMessageResponse> {
  return request('/ai/assistant/messages', assistantMessageResponseSchema, {
    method: 'POST',
    body: JSON.stringify(body),
    signal,
  });
}

/** `DELETE /ai/assistant/conversations/{id}`: borra la conversación propia y sus turnos. */
export async function deleteAssistantConversation(id: string): Promise<void> {
  await request(`/ai/assistant/conversations/${encodeURIComponent(id)}`, z.null(), {
    method: 'DELETE',
  });
}
