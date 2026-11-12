import type { ItemCardData } from '@/features/items';
import type { SearchItem, SearchPage } from '@/features/search/types';

/** Resultado del servidor → datos de la tarjeta `grid` de 005 (con distancia y calificación). */
export function toResultCard(item: SearchItem): ItemCardData {
  return {
    id: item.id,
    title: item.title,
    modality: item.modality,
    pricePerDayCents: item.pricePerDayCents,
    thumbUrl: item.thumbUrl ?? null,
    distanceKm: item.distanceKm ?? null,
    ratingAverage: item.owner?.ratingAverage ?? null,
  };
}

/** Aplana las páginas y descarta repetidos (un objeto nuevo puede correr el cursor entre páginas). */
export function flattenPages(pages: readonly SearchPage[] | undefined): ItemCardData[] {
  const seen = new Set<string>();
  const cards: ItemCardData[] = [];
  for (const page of pages ?? []) {
    for (const item of page.items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      cards.push(toResultCard(item));
    }
  }
  return cards;
}
