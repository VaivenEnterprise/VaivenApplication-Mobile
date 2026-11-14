import type { AppNotification } from '@/features/notifications/types';

// Datos de prueba de avisos (spec 011). Solo para pruebas.

export const NOTIFICATION_ID = '6731d0000000000000000001';

export const fakeNotification = (over: Partial<AppNotification> = {}): AppNotification => ({
  id: NOTIFICATION_ID,
  type: 'booking_accepted',
  title: 'Solicitud aceptada',
  body: 'Ana aceptó tu solicitud de Taladro percutor.',
  data: { bookingId: '6731b1b2c3d4e5f6a7b8c9d0', itemId: '6731a2b3c4d5e6f7a8b9c0d1' },
  readAt: null,
  createdAt: '2026-11-17T16:00:00Z',
  ...over,
});

export const fakeNotificationPage = (
  items: AppNotification[] = [fakeNotification()],
  nextCursor: string | null = null,
) => ({ items, nextCursor });
