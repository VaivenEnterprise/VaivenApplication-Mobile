import { z } from 'zod';
import { BOOKING_STATUSES } from '@/features/bookings';
import { publicUserSchema } from '@/features/profile/schemas';

// Contrato del chat (`Conversation`, `Message` en backend/api/openapi.yaml). Las respuestas se
// validan con zod (Art. IV). El mensaje es siempre texto plano: nunca se interpreta como HTML.

/** Límite de caracteres de un mensaje (RF-07). */
export const MESSAGE_MAX = 1000;
/** A partir de aquí se muestra el contador (spec §7.2). */
export const COUNTER_FROM = 900;
/** Frecuencias de la consulta periódica (RF-04): chat abierto y lista de conversaciones. */
export const POLL_CHAT_MS = 5_000;
export const POLL_LIST_MS = 20_000;

export const conversationSchema = z.object({
  id: z.string(),
  bookingId: z.string(),
  bookingStatus: z.enum(BOOKING_STATUSES),
  counterpart: publicUserSchema,
  item: z.object({
    id: z.string(),
    title: z.string(),
    thumbUrl: z.string().nullable(),
  }),
  canWrite: z.boolean(),
  lastMessage: z.object({ preview: z.string(), at: z.string(), senderId: z.string() }).nullable(),
  unreadCount: z.number().int().min(0),
});
export type Conversation = z.infer<typeof conversationSchema>;

export const conversationPageSchema = z.object({
  items: z.array(conversationSchema),
  nextCursor: z.string().nullable(),
});
export type ConversationPage = z.infer<typeof conversationPageSchema>;

export const messageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderId: z.string(),
  body: z.string(),
  createdAt: z.string(),
  clientId: z.string().nullable(),
});
export type Message = z.infer<typeof messageSchema>;

export const messagePageSchema = z.object({
  items: z.array(messageSchema),
  nextCursor: z.string().nullable(),
});
export type MessagePage = z.infer<typeof messagePageSchema>;

export const unreadCountSchema = z.object({ count: z.number().int().min(0) });

/** Estado de un mensaje propio que el servidor todavía no confirmó (RF-03). */
export type PendingStatus = 'sending' | 'failed';

export type PendingMessage = {
  clientId: string;
  body: string;
  status: PendingStatus;
  /** ISO-8601 local: solo para ordenar y mostrar la hora mientras no hay eco del servidor. */
  createdAt: string;
};
