import { z } from 'zod';
import { request } from '@/lib/api/client';
import {
  RECOMMENDATIONS_LIMIT,
  recommendationFeaturesSchema,
  recommendationListSchema,
  type Recommendation,
} from '@/features/recommendations/types';

// Rutas de recomendaciones (backend/api/paths/recommendations.yaml). Apagadas (`RECO_ENABLED=false`)
// responden 503; por eso la app consulta `GET /meta` antes de pedir nada (RF-02).

/** `GET /meta`: `true` solo si el servidor trae `features.recommendations = true` (RF-02). */
export async function getRecommendationsEnabled(signal?: AbortSignal): Promise<boolean> {
  const meta = await request('/meta', recommendationFeaturesSchema, { signal });
  return meta.features?.recommendations === true;
}

/** `GET /recommendations`: la lista en orden, sin más páginas (`nextCursor` siempre es null). */
export async function fetchRecommendations(signal?: AbortSignal): Promise<Recommendation[]> {
  const page = await request(
    `/recommendations?limit=${RECOMMENDATIONS_LIMIT}`,
    recommendationListSchema,
    { signal },
  );
  return page.items;
}

/** `POST /recommendations/events` (204): la persona abrió el detalle. El servidor ignora los casos raros. */
export async function sendViewEvent(itemId: string): Promise<void> {
  await request('/recommendations/events', z.null(), {
    method: 'POST',
    body: JSON.stringify({ itemId, type: 'view' }),
  });
}

/** `DELETE /recommendations/history` (204; sin historial también responde 204). */
export async function clearRecommendationHistory(): Promise<void> {
  await request('/recommendations/history', z.null(), { method: 'DELETE' });
}
