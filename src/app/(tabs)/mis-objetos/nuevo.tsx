import { renderFormExtras } from '@/features/ai-suggestions';
import { ItemFormScreen } from '@/features/items/screens/ItemFormScreen';

/**
 * Publicar objeto. El *slot* `renderFormExtras` de `ItemFormScreen` monta aquí las sugerencias con IA
 * de la spec 014 (solo si el servidor las enciende y hay una foto subida), sin tocar la pantalla.
 */
export default function Screen() {
  return <ItemFormScreen renderFormExtras={renderFormExtras} />;
}
