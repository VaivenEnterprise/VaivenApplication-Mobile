import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ChatScreen } from '@/features/chat/screens/ChatScreen';
import { ModerationNotice, ReportSheet } from '@/features/reports';
import { parseModerationReason } from '@/lib/api/moderation';

/** Chat de una reserva (spec 008 §7.2). La 011 conecta «Reportar mensaje» y el aviso de moderación. */
export default function Screen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <ChatScreen
      id={id}
      renderMessageReport={(message, onClose) =>
        message.id === null ? null : (
          <ReportSheet visible onClose={onClose} targetType="message" targetId={message.id} />
        )
      }
      renderModeration={(rejection, onDismiss) => (
        <ChatModeration reason={rejection.reason} chatId={id} onDismiss={onDismiss} />
      )}
    />
  );
}

type ChatModerationProps = { reason: string | null; chatId: string; onDismiss: () => void };

/** Un aviso por rechazo: la referencia de la decisión se fija al montarlo (el servidor la limita a 64). */
function ChatModeration({ reason, chatId, onDismiss }: ChatModerationProps) {
  const [decisionRef] = useState(() => `chat:${chatId}:${Date.now().toString(36)}`);
  return (
    <ModerationNotice
      rejection={parseModerationReason(reason)}
      decisionRef={decisionRef}
      onDismiss={onDismiss}
    />
  );
}
