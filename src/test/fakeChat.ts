import type { Conversation, Message } from '@/features/chat/types';
import { fakeRequester } from '@/test/fakeBookings';
import { fakeUser } from '@/test/fakeApi';

// Datos falsos del chat para pruebas (spec 008). `ME` es la persona de `fakeUser`.
export const ME = fakeUser.id;
export const OTHER = fakeRequester.id;
export const CONVERSATION_ID = '6731a0000000000000000001';
export const BOOKING_ID_CHAT = '6731b1b2c3d4e5f6a7b8c9d0';

export const fakeMessage = (id: string, over: Partial<Message> = {}): Message => ({
  id,
  conversationId: CONVERSATION_ID,
  senderId: OTHER,
  body: `Mensaje ${id}`,
  createdAt: '2026-11-12T18:00:00Z',
  clientId: null,
  ...over,
});

export const fakeConversation = (over: Partial<Conversation> = {}): Conversation => ({
  id: CONVERSATION_ID,
  bookingId: BOOKING_ID_CHAT,
  bookingStatus: 'accepted',
  counterpart: fakeRequester,
  item: { id: '6731a2b3c4d5e6f7a8b9c0d1', title: 'Taladro percutor', thumbUrl: null },
  canWrite: true,
  lastMessage: { preview: 'Nos vemos a las 5', at: '2026-11-12T18:00:00Z', senderId: OTHER },
  unreadCount: 0,
  ...over,
});
