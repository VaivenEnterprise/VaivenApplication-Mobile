import { request } from '@/lib/api/client';
import { recentItemsSchema, type RecentItems } from './schemas';

export const RECENT_LIMIT = 6;

/** `GET /items?limit=6`: objetos recién publicados de otras personas (búsqueda sin filtros). */
export function getRecentItems(limit: number = RECENT_LIMIT): Promise<RecentItems> {
  return request(`/items?limit=${limit}`, recentItemsSchema);
}
