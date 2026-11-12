import { ItemFormScreen } from '@/features/items/screens/ItemFormScreen';

/**
 * Publicar objeto. El *slot* `renderFormExtras` de `ItemFormScreen` es donde la spec 014 monta el
 * botón de IA; se conecta aquí sin tocar la pantalla.
 */
export default function Screen() {
  return <ItemFormScreen />;
}
