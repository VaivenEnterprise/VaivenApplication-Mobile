import { request } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { z } from 'zod';
import {
  conversationPageSchema,
  messageSchema,
  messagePageSchema,
  unreadCountSchema,
  type ConversationPage,
  type Message,
  type MessagePage,
} from '@/features/chat/types';

// Las 5 rutas del chat (backend 008). Todo pasa por `request` (Art. II, IV).

const conversationPath = (id: string) => `/conversations/${encodeURIComponent(id)}`;

/** `GET /conversations?cursor`: más reciente primero; `nextCursor` null = no hay más. */
export function fetchConversations(
  cursor: string | null,
  signal?: AbortSignal,
): Promise<ConversationPage> {
  const query = cursor === null ? '' : `?${new URLSearchParams({ cursor }).toString()}`;
  return request(`/conversations${query}`, conversationPageSchema, { signal });
}

/** `GET /conversations/unread-count`: mis no leídos en todas las conversaciones. */
export async function fetchUnreadCount(signal?: AbortSignal): Promise<number> {
  const { count } = await request('/conversations/unread-count', unreadCountSchema, { signal });
  return count;
}

/**
 * `GET /conversations/{id}/messages`: historial, del más nuevo al más viejo; `before` (el
 * `nextCursor` anterior) sigue hacia atrás.
 */
export function fetchMessages(
  conversationId: string,
  before: string | null,
  signal?: AbortSignal,
): Promise<MessagePage> {
  const query = before === null ? '' : `?${new URLSearchParams({ before }).toString()}`;
  return request(`${conversationPath(conversationId)}/messages${query}`, messagePageSchema, {
    signal,
  });
}

/** `GET /conversations/{id}/messages?after=`: los más nuevos que `afterId`, en orden ascendente. */
export async function fetchMessagesAfter(
  conversationId: string,
  afterId: string,
  signal?: AbortSignal,
): Promise<Message[]> {
  const query = new URLSearchParams({ after: afterId }).toString();
  const page = await request(
    `${conversationPath(conversationId)}/messages?${query}`,
    messagePageSchema,
    { signal },
  );
  return page.items;
}

/**
 * `POST /conversations/{id}/messages`. Con `clientId` es idempotente: repetir el mismo devuelve
 * el mensaje existente (200) sin duplicarlo (CA-01).
 */
export function sendMessage(
  conversationId: string,
  body: string,
  clientId: string,
): Promise<Message> {
  return request(`${conversationPath(conversationId)}/messages`, messageSchema, {
    method: 'POST',
    body: JSON.stringify({ body, clientId }),
  });
}

/** `POST /conversations/{id}/read` (204): pone en cero mis no leídos. */
export async function markConversationRead(conversationId: string): Promise<void> {
  await request(`${conversationPath(conversationId)}/read`, z.null(), { method: 'POST' });
}

/** Cuántos mensajes devuelve como máximo una consulta periódica (`after`). */
export const AFTER_PAGE_SIZE = 100;

/** Por qué el servidor no aceptó el mensaje (RF-08, RF-06). */
export type SendRejection =
  { kind: 'moderation'; reason: string | null } | { kind: 'rate_limited' } | { kind: 'closed' };

/**
 * Clasifica un fallo de envío que NO se arregla reintentando igual: moderación (400 con el motivo
 * en `details`), límite de ritmo (429) o conversación cerrada (409). Cualquier otro fallo
 * (red, tiempo agotado, 5xx) devuelve `null`: el mensaje queda «no enviado» y se puede reintentar.
 */
export function classifySendError(error: unknown): SendRejection | null {
  if (!(error instanceof ApiError)) return null;
  if (error.status === 429) return { kind: 'rate_limited' };
  if (error.status === 409) return { kind: 'closed' };
  if (error.status === 400 && error.code === 'validation_failed') {
    const detail = error.details.find((d) => d.field === 'body');
    return { kind: 'moderation', reason: detail?.issue ?? null };
  }
  return null;
}
