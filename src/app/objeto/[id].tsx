import { useLocalSearchParams } from 'expo-router';
import { RequestButton } from '@/features/bookings';
import { ItemDetailScreen } from '@/features/items/screens/ItemDetailScreen';
import { renderEffects } from '@/features/recommendations';
import { ReportItemAction } from '@/features/reports';

/**
 * Detalle del objeto. Aquí se conectan los *slots* de `ItemDetailScreen` sin editar la pantalla:
 * `renderActions` → «Solicitar» (spec 007); `renderOwnerExtras` → «Reportar» (011);
 * `renderEffects` → efectos de otras specs (015: registra la vista).
 */
export default function Screen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <ItemDetailScreen
      id={id}
      renderActions={(item) => <RequestButton item={item} />}
      renderOwnerExtras={(item) => <ReportItemAction itemId={item.id} ownerId={item.owner.id} />}
      renderEffects={renderEffects}
    />
  );
}
