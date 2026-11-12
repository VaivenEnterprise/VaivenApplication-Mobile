import { useLocalSearchParams } from 'expo-router';
import { RequestButton } from '@/features/bookings';
import { ItemDetailScreen } from '@/features/items/screens/ItemDetailScreen';

/**
 * Detalle del objeto. Aquí se conectan los *slots* de `ItemDetailScreen` sin editar la pantalla:
 * `renderActions` → «Solicitar» (spec 007); `renderOwnerExtras` → «Reportar» (011);
 * `renderEffects` → efectos de otras specs (010, 011).
 */
export default function Screen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ItemDetailScreen id={id} renderActions={(item) => <RequestButton item={item} />} />;
}
