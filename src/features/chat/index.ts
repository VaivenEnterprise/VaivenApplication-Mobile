// API pública de la feature de chat (spec 008).
import { slots } from '@/features/bookings';
import { OpenChatButton } from '@/features/chat/components/OpenChatButton';

// Sección «chat» del detalle de la reserva (007, Art. XIII): una línea, sin tocar archivos de 007.
slots.register('chat', OpenChatButton);

export { OpenChatButton } from '@/features/chat/components/OpenChatButton';
export { useUnreadBadge } from '@/features/chat/useUnreadBadge';
