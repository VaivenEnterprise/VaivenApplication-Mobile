import { useTrackView } from '@/features/recommendations/hooks';
import type { Item } from '@/features/items';

/** Efecto sin interfaz: registra la vista del detalle (RF-03). La pantalla no cambia (CA-02). */
export function TrackViewEffect({ item }: { item: Item }) {
  useTrackView({ id: item.id, ownerId: item.owner.id });
  return null;
}
