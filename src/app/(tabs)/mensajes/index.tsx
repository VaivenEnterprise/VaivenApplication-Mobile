import { PlaceholderScreen } from '@/components/PlaceholderScreen';
import { es } from '@/i18n/es-MX';

/** Marcador de la pestaña; la spec dueña reemplaza este contenido. */
export default function Screen() {
  return <PlaceholderScreen icon="chat" title={es.tabs.messages} />;
}
