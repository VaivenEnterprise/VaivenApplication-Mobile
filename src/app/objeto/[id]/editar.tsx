import { useLocalSearchParams } from 'expo-router';
import { EditItemScreen } from '@/features/items/screens/EditItemScreen';

/** Editar objeto: reutiliza el formulario de publicar en modo edición. */
export default function Screen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditItemScreen id={id} />;
}
