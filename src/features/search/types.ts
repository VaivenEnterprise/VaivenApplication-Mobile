import { z } from 'zod';
import { MODALITIES, type Modality } from '@/features/items';
import { POLICY } from '@/lib/policy';

// Contrato de búsqueda (`GET /items` en backend/api/paths/search.yaml). Se validan solo los campos
// que usa la tarjeta; el resto del `ItemCard` del servidor se ignora para no romper con campos nuevos.

export type RadiusKm = (typeof POLICY.search.radiiKm)[number];

/** Estado de búsqueda y filtros. «Vacío» es `''` (texto) o `null` (selección): nunca se envía. */
export type SearchFilters = {
  q: string;
  category: string | null;
  modality: Modality | null;
  municipality: string;
  /** `YYYY-MM-DD`; `''` si no hay. */
  from: string;
  to: string;
  radiusKm: RadiusKm | null;
};

export const EMPTY_FILTERS: SearchFilters = {
  q: '',
  category: null,
  modality: null,
  municipality: '',
  from: '',
  to: '',
  radiusKm: null,
};

/** Posición del dispositivo: solo viaja en la consulta y vive en memoria (Art. VI). */
export type Coords = { lat: number; lng: number };

export const searchItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  modality: z.enum(MODALITIES),
  pricePerDayCents: z.number().int().min(0),
  thumbUrl: z.string().nullish(),
  distanceKm: z.number().nullish(),
  owner: z.object({ ratingAverage: z.number().nullish() }).nullish(),
});

export const searchPageSchema = z.object({
  items: z.array(searchItemSchema),
  nextCursor: z.string().nullable(),
});

export type SearchItem = z.infer<typeof searchItemSchema>;
export type SearchPage = z.infer<typeof searchPageSchema>;
