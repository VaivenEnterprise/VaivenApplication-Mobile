import { PlaceholderScreen } from '@/components/PlaceholderScreen';
import { es } from '@/i18n/es-MX';

/** Ruta de detalle vacía: la spec dueña reemplaza este contenido. */
export default function Screen() {
  return <PlaceholderScreen icon="cube" title={es.tabs.placeholder.item} />;
}
