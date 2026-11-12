import { useLocalSearchParams } from 'expo-router';
import { ChatScreen } from '@/features/chat/screens/ChatScreen';

/** Chat de una reserva (spec 008 §7.2). */
export default function Screen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ChatScreen id={id} />;
}
