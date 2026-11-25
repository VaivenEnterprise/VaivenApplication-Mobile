import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useSession } from '@/features/auth/useSession';
import {
  clearRecommendationHistory,
  fetchRecommendations,
  getRecommendationsEnabled,
  sendViewEvent,
} from '@/features/recommendations/api';
import { recommendationsKeys } from '@/features/recommendations/keys';
import { RECOMMENDATIONS_STALE_MS, type Recommendation } from '@/features/recommendations/types';

/** `true` si `GET /meta` trae `features.recommendations = true`; mientras carga o si falla, `false`. */
export function useRecommendationsEnabled(): boolean {
  const { status } = useSession();
  const query = useQuery({
    queryKey: recommendationsKeys.enabled,
    queryFn: ({ signal }) => getRecommendationsEnabled(signal),
    staleTime: RECOMMENDATIONS_STALE_MS,
    enabled: status === 'signedIn',
  });
  return query.data === true;
}

export type RecommendationsState =
  /** Función apagada, error o sin resultados: la fila no se muestra (RF-02, RF-05, CA-04). */
  | { status: 'hidden'; items: [] }
  | { status: 'loading'; items: [] }
  | { status: 'ready'; items: Recommendation[] };

/**
 * «Recomendado para ti» (RF-01, RF-02, RF-05, P-01): caché de 5 minutos y errores silenciosos.
 * Nunca lanza ni muestra errores; Explorar sigue funcionando igual si algo falla. Los reintentos son
 * los del cliente (§6.3: uno ante red o 5xx, ninguno ante 4xx).
 */
export function useRecommendations(): RecommendationsState {
  const enabled = useRecommendationsEnabled();
  const query = useQuery({
    queryKey: recommendationsKeys.list,
    queryFn: ({ signal }) => fetchRecommendations(signal),
    staleTime: RECOMMENDATIONS_STALE_MS,
    enabled,
  });
  if (!enabled || query.isError) return { status: 'hidden', items: [] };
  if (query.isPending) return { status: 'loading', items: [] };
  return query.data.length === 0
    ? { status: 'hidden', items: [] }
    : { status: 'ready', items: query.data };
}

/**
 * Envía un evento `view` al abrir el detalle de un objeto ajeno (RF-03, P-02): una sola vez por
 * apertura, en segundo plano, y sin mostrar nunca un error. Sin la función encendida no envía nada.
 */
export function useTrackView(item: { id: string; ownerId: string }): void {
  const { user } = useSession();
  const enabled = useRecommendationsEnabled();
  const sent = useRef<string | null>(null);
  const { mutate } = useMutation({ mutationFn: sendViewEvent, retry: false, onError: () => {} });
  const isOwn = user !== null && user.id === item.ownerId;

  useEffect(() => {
    if (!enabled || isOwn || sent.current === item.id) return;
    sent.current = item.id;
    mutate(item.id);
  }, [enabled, isOwn, item.id, mutate]);
}

/** Borra mi historial y vuelve a pedir la lista: regresa al arranque en frío (RF-04, CA-03). */
export function useClearHistory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: clearRecommendationHistory,
    retry: false,
    onSuccess: () => client.invalidateQueries({ queryKey: recommendationsKeys.list }),
  });
}
