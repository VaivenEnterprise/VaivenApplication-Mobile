// API pública de la feature de recomendaciones (spec 015). Todo entra a otras pantallas por *slots*
// (P-03): Explorar (`renderTopSections`, 006), el detalle (`renderEffects`, 005) y el Perfil
// (`renderExtraRows`, 003, con `ClearHistoryRow`).
import { createElement, type ReactNode } from 'react';
import type { Item } from '@/features/items';
import { RecommendedRow } from '@/features/recommendations/components/RecommendedRow';
import { TrackViewEffect } from '@/features/recommendations/components/TrackViewEffect';

/** Para `ExploreScreen.renderTopSections`: la fila «Recomendado para ti». */
export function renderTopSections(): ReactNode {
  return createElement(RecommendedRow);
}

/** Para `ItemDetailScreen.renderEffects`: registra la vista del objeto abierto. */
export function renderEffects(item: Item): ReactNode {
  return createElement(TrackViewEffect, { item });
}

export { ClearHistoryRow } from '@/features/recommendations/components/ClearHistoryRow';
export { RecommendedRow } from '@/features/recommendations/components/RecommendedRow';
export { RecommendedCard, reasonText } from '@/features/recommendations/components/RecommendedCard';
export {
  useClearHistory,
  useRecommendations,
  useRecommendationsEnabled,
  useTrackView,
} from '@/features/recommendations/hooks';
export type { Recommendation } from '@/features/recommendations/types';
