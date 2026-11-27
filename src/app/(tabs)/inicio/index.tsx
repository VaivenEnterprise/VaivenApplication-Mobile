import { useUnreadBadge } from '@/features/chat';
import { AssistantEntry } from '@/features/ai-suggestions';
import { HomeScreen } from '@/features/home/screens/HomeScreen';

/**
 * Pestaña Inicio: delega en la pantalla de la feature (Art. VI). La insignia viene de 008 y el
 * acceso al asistente de proyectos, de 021-T032 (solo con la IA activa).
 */
export default function Screen() {
  return <HomeScreen unreadCount={useUnreadBadge()} renderHeaderExtra={() => <AssistantEntry />} />;
}
