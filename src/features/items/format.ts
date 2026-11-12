import { es } from '@/i18n/es-MX';
import { formatMXN } from '@/lib/format/money';
import type { Item, ItemStatus, Modality } from '@/features/items/types';

/** Datos mínimos que necesita una tarjeta de objeto: sirven para `Item` y para el `ItemCard` de 006. */
export type ItemCardData = {
  id: string;
  title: string;
  modality: Modality;
  pricePerDayCents: number;
  thumbUrl: string | null;
  status?: ItemStatus;
  /** Solo en resultados de búsqueda (006): distancia aproximada y calificación del dueño. */
  distanceKm?: number | null;
  ratingAverage?: number | null;
};

/** Tarjeta a partir del detalle/listado propio: la portada es la primera foto. */
export function toCardData(item: Item): ItemCardData {
  return {
    id: item.id,
    title: item.title,
    modality: item.modality,
    pricePerDayCents: item.pricePerDayCents,
    thumbUrl: item.photos[0]?.thumbUrl ?? null,
    status: item.status,
  };
}

/**
 * Línea pequeña de la tarjeta de Explorar: «~1 km · ★ 4.9» (spec 006 §7.1). La distancia se
 * redondea a 1 km y nunca baja de 1; sin datos devuelve `null` y la línea no se muestra.
 */
export function metaText(item: Pick<ItemCardData, 'distanceKm' | 'ratingAverage'>): string | null {
  const parts: string[] = [];
  if (typeof item.distanceKm === 'number') {
    const km = Math.max(1, Math.round(item.distanceKm));
    parts.push(`${es.search.card.distancePrefix}${km} ${es.search.card.distanceUnit}`);
  }
  if (typeof item.ratingAverage === 'number') {
    parts.push(`${es.search.card.rating} ${item.ratingAverage.toFixed(1)}`);
  }
  return parts.length === 0 ? null : parts.join(' · ');
}

/** Lo mismo para lectores de pantalla: «a unos 2 km, calificación 4.9». */
export function metaSpoken(
  item: Pick<ItemCardData, 'distanceKm' | 'ratingAverage'>,
): string | null {
  const parts: string[] = [];
  if (typeof item.distanceKm === 'number') {
    const km = Math.max(1, Math.round(item.distanceKm));
    parts.push(`${es.search.card.distanceA11y} ${km} ${es.search.card.distanceUnit}`);
  }
  if (typeof item.ratingAverage === 'number') {
    parts.push(`${es.search.card.ratingA11y} ${item.ratingAverage.toFixed(1)}`);
  }
  return parts.length === 0 ? null : parts.join(', ');
}

/** «$90» en vez de «$90.00» cuando el precio es redondo; `null` cuando es gratis. */
export function priceText(
  item: Pick<ItemCardData, 'modality' | 'pricePerDayCents'>,
): string | null {
  if (item.modality === 'loan' || item.pricePerDayCents === 0) return null;
  return formatMXN(item.pricePerDayCents).replace(/\.00$/, '');
}

/** Texto que leen los lectores de pantalla: «$90 por día» o «Gratis». */
export function priceSpoken(item: Pick<ItemCardData, 'modality' | 'pricePerDayCents'>): string {
  const price = priceText(item);
  return price === null ? es.items.money.free : `${price} ${es.items.money.perDayA11y}`;
}
