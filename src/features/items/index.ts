// API pública del módulo de objetos (spec 005). Otras features (006 Explorar, 007 solicitudes,
// 010 incidencias) importan solo desde aquí.

export { ItemCard } from '@/features/items/components/ItemCard';
export type { ItemCardVariant } from '@/features/items/components/ItemCard';
export { ItemStatusBadge } from '@/features/items/components/ItemStatusBadge';
export { ChoiceChip } from '@/features/items/components/ChoiceChip';
export { OwnerCard } from '@/features/items/components/OwnerCard';
export { PhotoGallery } from '@/features/items/components/PhotoGallery';
export { metaSpoken, metaText, priceSpoken, priceText, toCardData } from '@/features/items/format';
export type { ItemCardData } from '@/features/items/format';
export { useCategories, useItem } from '@/features/items/hooks';
export { itemsKeys } from '@/features/items/keys';
export { MODALITIES } from '@/features/items/types';
export type { Category, Item, ItemStatus, Modality, Condition } from '@/features/items/types';
