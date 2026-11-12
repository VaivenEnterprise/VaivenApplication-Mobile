import { MODALITIES } from '@/features/items';
import {
  EMPTY_FILTERS,
  type Coords,
  type RadiusKm,
  type SearchFilters,
} from '@/features/search/types';
import { addDaysYmd, diffDaysYmd, isYmd } from '@/lib/format/date';
import { POLICY } from '@/lib/policy';

// Conversión de filtros ↔ *search params* de la ruta ↔ query string (plan P-01). Los parámetros de
// la ruta son la fuente de verdad: así Explorar conserva el estado al volver del detalle (CA-05).

const { qMin, qMax, radiiKm, maxRangeDays, coordDecimals } = POLICY.search;

export const PARAM_KEYS = [
  'q',
  'category',
  'modality',
  'municipality',
  'from',
  'to',
  'radiusKm',
] as const;
export type ParamKey = (typeof PARAM_KEYS)[number];
/** Valor `undefined` = quitar el parámetro de la ruta. */
export type FilterParams = Record<ParamKey, string | undefined>;
type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined): string =>
  (Array.isArray(value) ? value[0] : value) ?? '';

const clean = (value: string): string | undefined => (value === '' ? undefined : value);

/** Filtros → parámetros de ruta; los vacíos quedan `undefined` para que `setParams` los quite. */
export function filtersToParams(filters: SearchFilters): FilterParams {
  return {
    q: clean(filters.q),
    category: filters.category ?? undefined,
    modality: filters.modality ?? undefined,
    municipality: clean(filters.municipality),
    from: clean(filters.from),
    to: clean(filters.to),
    radiusKm: filters.radiusKm === null ? undefined : String(filters.radiusKm),
  };
}

/** Parámetros de ruta → filtros. Lo inválido (URL manipulada o vieja) se descarta, no rompe. */
export function paramsToFilters(params: RawParams): SearchFilters {
  const modality = first(params.modality);
  const radius = Number(first(params.radiusKm));
  const from = first(params.from);
  const to = first(params.to);
  return {
    q: first(params.q).slice(0, qMax),
    category: first(params.category) || null,
    modality: (MODALITIES as readonly string[]).includes(modality)
      ? (modality as SearchFilters['modality'])
      : null,
    municipality: first(params.municipality),
    from: isYmd(from) ? from : '',
    to: isYmd(to) ? to : '',
    radiusKm: (radiiKm as readonly number[]).includes(radius) ? (radius as RadiusKm) : null,
  };
}

/** Texto que realmente se envía: sin espacios sobrantes y de 2 a 80 caracteres; si no, `''`. */
export function effectiveText(q: string): string {
  const text = q.trim().replace(/\s+/g, ' ').slice(0, qMax);
  return text.length >= qMin ? text : '';
}

/** Número de filtros activos (sin contar el texto). Las dos fechas cuentan como uno. */
export function activeFilterCount(filters: SearchFilters): number {
  return [
    filters.category !== null,
    filters.modality !== null,
    filters.municipality.trim() !== '',
    filters.from !== '' || filters.to !== '',
    filters.radiusKm !== null,
  ].filter(Boolean).length;
}

/** `true` si hay texto o algún filtro: se muestran resultados en lugar del inicio de Explorar. */
export function isSearching(filters: SearchFilters): boolean {
  return filters.q.trim() !== '' || activeFilterCount(filters) > 0;
}

/** Quita todos los filtros y también el texto (el botón «Limpiar filtros» del vacío). */
export function clearAll(): SearchFilters {
  return { ...EMPTY_FILTERS };
}

/** Quita los filtros y conserva el texto (el botón «Limpiar» de la hoja). */
export function clearFilters(filters: SearchFilters): SearchFilters {
  return { ...EMPTY_FILTERS, q: filters.q };
}

export type RangeProblem = 'inverted' | 'tooLong' | null;

/** Valida el periodo: `from ≤ to` y a lo más 7 días (P-04). Con una sola fecha no hay problema. */
export function rangeProblem(from: string, to: string): RangeProblem {
  if (!isYmd(from) || !isYmd(to)) return null;
  const days = diffDaysYmd(from, to);
  if (days < 0) return 'inverted';
  return days > maxRangeDays ? 'tooLong' : null;
}

/** Última fecha elegible para «Hasta» dado «Desde» (periodo máximo de 7 días). */
export function maxTo(from: string): string | null {
  return isYmd(from) ? addDaysYmd(from, maxRangeDays) : null;
}

const round = (n: number): string => n.toFixed(coordDecimals);

/**
 * Query string de `GET /items`. Omite lo vacío; envía `lat/lng/radiusKm` solo si hay radio y
 * posición (P-05, P-06) y descarta un periodo inválido en vez de provocar un 400.
 * El cursor no forma parte de la clave de consulta: se agrega aparte con `withCursor`.
 */
export function toQueryString(filters: SearchFilters, coords: Coords | null = null): string {
  const parts: [string, string][] = [['limit', String(POLICY.search.pageSize)]];
  const text = effectiveText(filters.q);
  if (text !== '') parts.push(['q', text]);
  if (filters.category !== null) parts.push(['category', filters.category]);
  if (filters.modality !== null) parts.push(['modality', filters.modality]);
  const municipality = filters.municipality.trim();
  if (municipality !== '') parts.push(['municipality', municipality]);
  if (rangeProblem(filters.from, filters.to) === null) {
    if (isYmd(filters.from)) parts.push(['from', filters.from]);
    if (isYmd(filters.to)) parts.push(['to', filters.to]);
  }
  if (filters.radiusKm !== null && coords !== null) {
    parts.push(['lat', round(coords.lat)], ['lng', round(coords.lng)]);
    parts.push(['radiusKm', String(filters.radiusKm)]);
  }
  return parts.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');
}

/** Agrega el cursor de la página siguiente a un query string ya armado. */
export function withCursor(query: string, cursor: string | null): string {
  return cursor === null ? query : `${query}&cursor=${encodeURIComponent(cursor)}`;
}
