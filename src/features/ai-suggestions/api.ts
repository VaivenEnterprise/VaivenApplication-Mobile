import { request } from '@/lib/api/client';
import {
  aiFeaturesSchema,
  listingSuggestionSchema,
  type ListingSuggestion,
} from '@/features/ai-suggestions/types';

// Rutas de la IA al publicar (backend/api/paths/ai.yaml). El servidor no acepta URL: recibe el
// `publicId` de una foto propia ya subida y construye él mismo la miniatura.

/** `GET /meta`: `true` solo si el servidor trae `features.aiSuggestions = true` (RF-02). */
export async function getAiSuggestionsEnabled(signal?: AbortSignal): Promise<boolean> {
  const meta = await request('/meta', aiFeaturesSchema, { signal });
  return meta.features?.aiSuggestions === true;
}

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
