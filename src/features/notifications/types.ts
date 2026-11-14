import { z } from 'zod';

// Avisos dentro de la app (contrato 011: `Notification`, `NotificationPage`). Se validan en el
// borde (Art. III.2). `type` queda como texto: un tipo que el servidor agregue después no debe
// invalidar toda la página; la UI lo trata como aviso del sistema.

export const notificationDataSchema = z.object({
  bookingId: z.string().optional(),
  itemId: z.string().optional(),
  conversationId: z.string().optional(),
  incidentId: z.string().optional(),
});

export const notificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  data: notificationDataSchema,
  readAt: z.string().nullable(),
  createdAt: z.string(),
});

export const notificationPageSchema = z.object({
  items: z.array(notificationSchema),
  nextCursor: z.string().nullable(),
});

export const unreadCountSchema = z.object({ count: z.number().int().min(0) });

export type NotificationData = z.infer<typeof notificationDataSchema>;
export type AppNotification = z.infer<typeof notificationSchema>;
export type NotificationPage = z.infer<typeof notificationPageSchema>;

/** Familia visual de un aviso (spec 011 §7.1): decide el ícono y el tono. */
export type NotificationKind =
  'request' | 'message' | 'delivery' | 'incident' | 'moderation' | 'system';

const KIND_BY_TYPE: Readonly<Record<string, NotificationKind>> = {
  booking_requested: 'request',
  booking_accepted: 'request',
  booking_rejected: 'request',
  booking_cancelled: 'request',
  booking_expired: 'request',
  message_received: 'message',
  delivery_confirmed: 'delivery',
  return_confirmed: 'delivery',
  payment_reported: 'delivery',
  payment_confirmed: 'delivery',
  late_return: 'delivery',
  booking_affected: 'delivery',
  incident_opened: 'incident',
  incident_note: 'incident',
  incident_closed: 'incident',
  sanction_applied: 'moderation',
  content_removed: 'moderation',
};

/** Familia de un tipo de aviso; los tipos desconocidos (y las calificaciones) son «sistema». */
export function kindOf(type: string): NotificationKind {
  return KIND_BY_TYPE[type] ?? 'system';
}

/** Tamaño de página del centro de avisos y de la consulta del conteo. */
export const NOTIFICATIONS_PAGE_SIZE = 20;
/** Cada cuánto se renueva el conteo de no leídos con la app en primer plano (RF-02). */
export const UNREAD_POLL_MS = 60_000;
