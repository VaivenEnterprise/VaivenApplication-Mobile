import type { InfiniteData } from '@tanstack/react-query';
import type {
  Conversation,
  ConversationPage,
  Message,
  MessagePage,
  PendingMessage,
  PendingStatus,
} from '@/features/chat/types';

// Mezcla de lo que dice el servidor con lo que la persona acaba de enviar (plan P-01, RF-03).
// El orden del servidor es el de confirmación del envío: se respeta tal cual (más nuevo primero),
// no se vuelve a ordenar por fecha, porque dos mensajes del mismo segundo mantienen su orden real.

/** Un mensaje listo para pintar, sea del servidor o aún pendiente. */
export type ChatMessage = {
  /** Estable entre renders y entre «pendiente» y «confirmado» de un mismo mensaje. */
  key: string;
  /** `null` mientras no hay confirmación del servidor. */
  id: string | null;
  clientId: string | null;
  senderId: string | null;
  body: string;
  createdAt: string;
  mine: boolean;
  status: 'sent' | PendingStatus;
};

/**
 * Une los mensajes del servidor (más nuevo primero) con los pendientes y devuelve la lista para
 * una `FlatList` invertida (más nuevo primero). Un pendiente desaparece cuando llega su eco: el
 * mensaje del servidor con el mismo `clientId` (CA-01: el reintento no se duplica). Los
 * pendientes van arriba, del más nuevo al más antiguo.
 */
export function mergeMessages(
  server: readonly Message[],
  pending: readonly PendingMessage[],
  currentUserId: string,
): ChatMessage[] {
  const seenIds = new Set<string>();
  const echoed = new Set<string>();
  const confirmed: ChatMessage[] = [];
  for (const message of server) {
    if (seenIds.has(message.id)) continue;
    seenIds.add(message.id);
    if (message.clientId !== null && message.senderId === currentUserId) {
      echoed.add(message.clientId);
    }
    confirmed.push({
      // Si el mensaje nació como pendiente conserva su clave: la burbuja no parpadea al confirmarse.
      key:
        message.clientId !== null && message.senderId === currentUserId
          ? `c:${message.clientId}`
          : `m:${message.id}`,
      id: message.id,
      clientId: message.clientId,
      senderId: message.senderId,
      body: message.body,
      createdAt: message.createdAt,
      mine: message.senderId === currentUserId,
      status: 'sent',
    });
  }
  const waiting: ChatMessage[] = [];
  const seenClientIds = new Set<string>();
  for (const item of pending) {
    if (echoed.has(item.clientId) || seenClientIds.has(item.clientId)) continue;
    seenClientIds.add(item.clientId);
    waiting.push({
      key: `c:${item.clientId}`,
      id: null,
      clientId: item.clientId,
      senderId: currentUserId,
      body: item.body,
      createdAt: item.createdAt,
      mine: true,
      status: item.status,
    });
  }
  // Más nuevo primero; a igual fecha, el que se envió después (posición posterior en `pending`).
  const ordered = waiting
    .map((message, index) => ({ message, index }))
    .sort((a, b) => {
      const byDate = Date.parse(b.message.createdAt) - Date.parse(a.message.createdAt);
      return byDate !== 0 && !Number.isNaN(byDate) ? byDate : b.index - a.index;
    })
    .map(({ message }) => message);
  return [...ordered, ...confirmed];
}

/** Un renglón de la lista del chat: un mensaje o el separador de un día. */
export type ChatEntry =
  | { type: 'message'; key: string; message: ChatMessage }
  | { type: 'day'; key: string; iso: string };

/** Clave del día local (zona del dispositivo, Art. V.2) de una fecha ISO. */
export function dayKey(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/**
 * Intercala un separador de día. La lista va invertida (más nuevo primero), así que el separador
 * de un día va justo después de su mensaje más antiguo: en pantalla queda arriba de ese día.
 */
export function withDaySeparators(messages: readonly ChatMessage[]): ChatEntry[] {
  const entries: ChatEntry[] = [];
  messages.forEach((message, index) => {
    entries.push({ type: 'message', key: message.key, message });
    const older = messages[index + 1];
    const day = dayKey(message.createdAt);
    if (older === undefined || dayKey(older.createdAt) !== day) {
      entries.push({ type: 'day', key: `d:${day}`, iso: message.createdAt });
    }
  });
  return entries;
}

type MessagesData = InfiniteData<MessagePage, unknown>;

/** Id del mensaje confirmado más reciente del caché (cursor `after` de la consulta periódica). */
export function latestMessageId(data: MessagesData | undefined): string | null {
  return data?.pages[0]?.items[0]?.id ?? null;
}

/**
 * Anexa al caché los mensajes nuevos de la consulta periódica (llegan en orden ascendente) y los
 * que devuelve el envío. Sin duplicar por `id`. Devuelve el mismo objeto si no hay nada nuevo.
 */
export function appendNewer(
  data: MessagesData | undefined,
  incoming: readonly Message[],
): MessagesData {
  const first = data?.pages[0];
  const known = new Set(data?.pages.flatMap((page) => page.items.map((m) => m.id)) ?? []);
  const fresh: Message[] = [];
  for (const message of incoming) {
    if (known.has(message.id)) continue;
    known.add(message.id);
    fresh.push(message);
  }
  if (data === undefined || first === undefined) {
    return {
      pages: [{ items: fresh.reverse(), nextCursor: null }],
      pageParams: [null],
    };
  }
  if (fresh.length === 0) return data;
  const [, ...rest] = data.pages;
  return {
    pageParams: data.pageParams,
    pages: [{ ...first, items: [...fresh.reverse(), ...first.items] }, ...rest],
  };
}

type ConversationsData = InfiniteData<ConversationPage, unknown>;

/**
 * Sustituye la primera página de la lista de conversaciones por una recién pedida (la consulta
 * periódica siempre pide la primera, contrato `GET /conversations`) y quita de las páginas
 * siguientes lo que ahora ya viene arriba, para no repetir filas.
 */
export function replaceFirstConversationPage(
  data: ConversationsData | undefined,
  first: ConversationPage,
): ConversationsData {
  if (data === undefined || data.pages.length === 0) {
    return { pages: [first], pageParams: [null] };
  }
  const top = new Set(first.items.map((item) => item.id));
  const [, ...rest] = data.pages;
  return {
    pageParams: data.pageParams,
    pages: [
      first,
      ...rest.map((page) => ({
        ...page,
        items: page.items.filter((item) => !top.has(item.id)),
      })),
    ],
  };
}

/** Busca una conversación en las páginas cargadas. */
export function findConversation(
  data: ConversationsData | undefined,
  id: string,
): Conversation | undefined {
  for (const page of data?.pages ?? []) {
    const found = page.items.find((item) => item.id === id);
    if (found !== undefined) return found;
  }
  return undefined;
}
