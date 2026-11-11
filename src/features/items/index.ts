// API pública del módulo de objetos (spec 005). Otras features (006 Explorar, 007 solicitudes,
// 010 incidencias) importan solo desde aquí.

export { ItemCard } from '@/features/items/components/ItemCard';
export type { ItemCardVariant } from '@/features/items/components/ItemCard';
export { ItemStatusBadge } from '@/features/items/components/ItemStatusBadge';
export { OwnerCard } from '@/features/items/components/OwnerCard';
export { PhotoGallery } from '@/features/items/components/PhotoGallery';
export { priceSpoken, priceText, toCardData } from '@/features/items/format';
export type { ItemCardData } from '@/features/items/format';
export { useItem } from '@/features/items/hooks';
export { itemsKeys } from '@/features/items/keys';
export type { Item, ItemStatus, Modality, Condition } from '@/features/items/types';
