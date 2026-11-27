import { request } from '@/lib/api/client';
import { listingSuggestionSchema, type ListingSuggestion } from '@/features/ai-suggestions/types';

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
