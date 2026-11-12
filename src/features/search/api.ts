import { request } from '@/lib/api/client';
import { withCursor } from '@/features/search/filters';
import { searchPageSchema, type SearchPage } from '@/features/search/types';

/**
 * `GET /items?…`: modo reciente, texto o cercanía según los parámetros (backend 006). `query` ya
 * viene armado por `toQueryString`; `signal` cancela la petición cuando cambia la búsqueda (RF-08).
 */
export function searchItems(
  query: string,
  cursor: string | null,
  signal?: AbortSignal,
): Promise<SearchPage> {
  return request(`/items?${withCursor(query, cursor)}`, searchPageSchema, { signal });
}
