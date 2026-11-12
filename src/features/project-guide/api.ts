import { request } from '@/lib/api/client';
import {
  TOOL_LIMIT,
  toolPageSchema,
  type ToolHit,
  type ToolRadiusKm,
} from '@/features/project-guide/types';

export type ToolCoords = { lat: number; lng: number };

/** Decimales de la posición enviada: coarse, como en la búsqueda de 006 (Art. VI). */
const COORD_DECIMALS = 2;
export const coordKey = (coords: ToolCoords | null): string =>
  coords === null
    ? 'none'
    : `${coords.lat.toFixed(COORD_DECIMALS)},${coords.lng.toFixed(COORD_DECIMALS)}`;

/**
 * `GET /items?q&lat&lng&radiusKm&limit=3` para una herramienta (RF-13). Con posición pide por
 * cercanía y devuelve distancias; sin ella (permiso negado) busca por texto y solo hay zona.
 * Se devuelve el resultado más cercano, o `null` si nadie la tiene.
 */
export async function searchTool(
  query: string,
  coords: ToolCoords | null,
  radiusKm: ToolRadiusKm,
  signal?: AbortSignal,
): Promise<ToolHit | null> {
  const params = new URLSearchParams({ q: query, limit: String(TOOL_LIMIT) });
  if (coords !== null) {
    params.set('lat', coords.lat.toFixed(COORD_DECIMALS));
    params.set('lng', coords.lng.toFixed(COORD_DECIMALS));
    params.set('radiusKm', String(radiusKm));
  }
  const page = await request(`/items?${params.toString()}`, toolPageSchema, { signal });
  return page.items[0] ?? null;
}
