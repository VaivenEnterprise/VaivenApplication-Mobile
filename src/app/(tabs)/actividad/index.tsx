import { PlaceholderScreen } from '@/components/PlaceholderScreen';
import { es } from '@/i18n/es-MX';

/** Marcador de la pestaña; la spec dueña reemplaza este contenido. */
export default function Screen() {
  return <PlaceholderScreen icon="swap" title={es.tabs.activity} />;
}
