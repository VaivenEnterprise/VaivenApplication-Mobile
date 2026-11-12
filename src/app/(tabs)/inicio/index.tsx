import { useUnreadBadge } from '@/features/chat';
import { HomeScreen } from '@/features/home/screens/HomeScreen';

/** Pestaña Inicio: delega en la pantalla de la feature (Art. VI). La insignia viene de 008. */
export default function Screen() {
  return <HomeScreen unreadCount={useUnreadBadge()} />;
}
