// Claves de consulta de objetos (Art. XIII.4). `mine()` sin estado es el prefijo de todas las listas
// propias: invalidarlo refresca cualquier filtro (plan P-03).
import type { ItemStatus } from '@/features/items/types';

export const itemsKeys = {
  all: ['items'] as const,
  mine: (status?: ItemStatus) =>
    status === undefined ? (['items', 'mine'] as const) : (['items', 'mine', status] as const),
  detail: (id: string) => ['items', 'detail', id] as const,
  categories: ['items', 'categories'] as const,
  priceSuggestion: (declaredValueCents: number) =>
    ['items', 'price-suggestion', declaredValueCents] as const,
};
