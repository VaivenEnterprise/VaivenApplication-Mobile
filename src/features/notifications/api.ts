import { z } from 'zod';
import {
  NOTIFICATIONS_PAGE_SIZE,
  notificationPageSchema,
  unreadCountSchema,
  type NotificationPage,
} from '@/features/notifications/types';
import { request } from '@/lib/api/client';

// Las rutas de avisos y de tokens de push (backend 011). Todo pasa por `request` (Art. II, IV).

/** A quién se marcan como leídos: ids concretos (máximo 100) o todos los avisos propios. */
export type MarkReadTarget = { ids: readonly string[] } | { all: true };

/** Plataformas que acepta el contrato al registrar un token. */
export type PushPlatform = 'android' | 'ios';

/** `GET /me/notifications`: mis avisos, los más recientes primero, por cursor. */
export function fetchNotifications(
  cursor: string | null,
  signal?: AbortSignal,
): Promise<NotificationPage> {
  const params = new URLSearchParams({ limit: String(NOTIFICATIONS_PAGE_SIZE) });
  if (cursor !== null) params.set('cursor', cursor);
  return request(`/me/notifications?${params.toString()}`, notificationPageSchema, { signal });
}

/** `GET /me/notifications/unread-count`: cuántos avisos no he leído. */
export async function fetchUnreadCount(signal?: AbortSignal): Promise<number> {
  const { count } = await request('/me/notifications/unread-count', unreadCountSchema, { signal });
  return count;
}

/** `POST /me/notifications/read`: marca como leídos ciertos avisos o todos (204). */
export async function markNotificationsRead(target: MarkReadTarget): Promise<void> {
  const body = 'all' in target ? { all: true } : { ids: target.ids };
  await request('/me/notifications/read', z.null(), {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** `POST /me/push-tokens`: registra el token de Expo de este dispositivo (204; repetirlo es seguro). */
export async function registerPushToken(token: string, platform: PushPlatform): Promise<void> {
  await request('/me/push-tokens', z.null(), {
    method: 'POST',
    body: JSON.stringify({ token, platform }),
  });
}

/** `DELETE /me/push-tokens`: elimina el token al cerrar sesión o apagar los avisos (204). */
export async function deletePushToken(token: string): Promise<void> {
  await request('/me/push-tokens', z.null(), {
    method: 'DELETE',
    body: JSON.stringify({ token }),
  });
}
