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
