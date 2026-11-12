import { z } from 'zod';
import { request } from '@/lib/api/client';
import {
  categoriesSchema,
  itemPageSchema,
  itemSchema,
  priceSuggestionSchema,
  type Category,
  type Item,
  type ItemInput,
  type ItemPage,
  type ItemStatus,
  type ItemUpdate,
} from '@/features/items/types';
import { POLICY } from '@/lib/policy';

// Las nueve rutas de objetos (backend/api/paths/items.yaml). Dinero siempre en centavos enteros.

const itemPath = (id: string) => `/items/${encodeURIComponent(id)}`;

/** `POST /items`: publica un objeto activo del que la persona autenticada es dueña. */
export function createItem(body: ItemInput): Promise<Item> {
  return request('/items', itemSchema, { method: 'POST', body: JSON.stringify(body) });
}

/** `GET /items/{id}`: detalle; `declaredValueCents` solo llega al dueño. */
export function getItem(id: string): Promise<Item> {
  return request(itemPath(id), itemSchema);
}

/** `PATCH /items/{id}`: cambia los campos enviados; `version` evita pisar cambios ajenos (409). */
export function updateItem(id: string, body: ItemUpdate): Promise<Item> {
  return request(itemPath(id), itemSchema, { method: 'PATCH', body: JSON.stringify(body) });
}

/** `DELETE /items/{id}`: responde 204; con reservas aceptadas o en curso responde 409. */
export async function deleteItem(id: string): Promise<void> {
  await request(itemPath(id), z.null(), { method: 'DELETE' });
}

/** `POST /items/{id}/pause`. */
export function pauseItem(id: string): Promise<Item> {
  return request(`${itemPath(id)}/pause`, itemSchema, { method: 'POST' });
}

/** `POST /items/{id}/resume`. */
export function resumeItem(id: string): Promise<Item> {
  return request(`${itemPath(id)}/resume`, itemSchema, { method: 'POST' });
}

export type MyItemsParams = {
  status?: Exclude<ItemStatus, 'removed'> | undefined;
  cursor?: string | null | undefined;
  limit?: number | undefined;
};

/** `GET /me/items`: mis objetos, recientes primero; nunca incluye los eliminados. */
export function listMyItems({
  status,
  cursor,
  limit = POLICY.pageSize,
}: MyItemsParams = {}): Promise<ItemPage> {
  const query = new URLSearchParams({ limit: String(limit) });
  if (status !== undefined) query.set('status', status);
  if (cursor !== undefined && cursor !== null) query.set('cursor', cursor);
  return request(`/me/items?${query.toString()}`, itemPageSchema);
}

/** `GET /items/price-suggestion`: 3 % del valor por día, mínimo $10, en múltiplos de $5 (POL-04). */
export async function getPriceSuggestion(declaredValueCents: number): Promise<number> {
  const { suggestedPricePerDayCents } = await request(
    `/items/price-suggestion?declaredValueCents=${declaredValueCents}`,
    priceSuggestionSchema,
  );
  return suggestedPricePerDayCents;
}

/** `GET /categories`: las categorías de POL-14 en el orden en que se muestran. */
export function listCategories(): Promise<Category[]> {
  return request('/categories', categoriesSchema);
}
