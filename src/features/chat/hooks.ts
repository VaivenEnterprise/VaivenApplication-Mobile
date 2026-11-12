import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AFTER_PAGE_SIZE,
  classifySendError,
  fetchConversations,
  fetchMessages,
  fetchMessagesAfter,
  fetchUnreadCount,
  markConversationRead,
  sendMessage,
  type SendRejection,
} from '@/features/chat/api';
import { newClientId } from '@/features/chat/clientId';
import { chatKeys } from '@/features/chat/keys';
import {
  appendNewer,
  findConversation,
  latestMessageId,
  replaceFirstConversationPage,
} from '@/features/chat/merge';
import {
  MESSAGE_MAX,
  POLL_CHAT_MS,
  POLL_LIST_MS,
  type ConversationPage,
  type Message,
  type MessagePage,
  type PendingMessage,
} from '@/features/chat/types';
import { usePolling } from '@/features/chat/usePolling';

type MessagesData = InfiniteData<MessagePage, unknown>;
type ConversationsData = InfiniteData<ConversationPage, unknown>;

/** Mis conversaciones, la más reciente primero, con paginación por cursor (RF-01). */
export function useConversations() {
  return useInfiniteQuery({
    queryKey: chatKeys.conversations,
    queryFn: ({ pageParam, signal }) => fetchConversations(pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

/** Mis no leídos en total (insignia del botón de mensajes). */
export function useUnreadCount() {
  return useQuery({
    queryKey: chatKeys.unread,
    queryFn: ({ signal }) => fetchUnreadCount(signal),
  });
}

/** Mensajes de una conversación, del más nuevo al más viejo; las páginas siguen con `before`. */
export function useMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(conversationId),
    queryFn: ({ pageParam, signal }) => fetchMessages(conversationId, pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

/** Pide la primera página de la lista y la integra al caché (consulta periódica, contrato). */
async function refreshConversations(client: QueryClient): Promise<void> {
  const first = await fetchConversations(null);
  client.setQueryData<ConversationsData>(chatKeys.conversations, (data) =>
    replaceFirstConversationPage(data, first),
  );
}

/** Tope de consultas seguidas por ciclo cuando hay más de 100 mensajes nuevos. */
const MAX_PULLS = 5;

/**
 * Trae los mensajes posteriores al último que se tiene (`after`) y los anexa al caché (P-04).
 * Si la conversación aún no tiene mensajes, pide el historial por si ya llegaron. Devuelve los
 * mensajes nuevos. No hace nada mientras la consulta principal no haya cargado.
 */
export async function pullNewerMessages(
  client: QueryClient,
  conversationId: string,
): Promise<Message[]> {
  const key = chatKeys.messages(conversationId);
  const arrived: Message[] = [];
  for (let pull = 0; pull < MAX_PULLS; pull += 1) {
    const data = client.getQueryData<MessagesData>(key);
    if (data === undefined) return arrived;
    const last = latestMessageId(data);
    if (last === null) {
      const page = await fetchMessages(conversationId, null);
      const ascending = [...page.items].reverse();
      client.setQueryData<MessagesData>(key, (current) => appendNewer(current, ascending));
      return [...arrived, ...ascending];
    }
    const items = await fetchMessagesAfter(conversationId, last);
    if (items.length === 0) break;
    client.setQueryData<MessagesData>(key, (current) => appendNewer(current, items));
    arrived.push(...items);
    if (items.length < AFTER_PAGE_SIZE) break;
  }
  return arrived;
}

/** Marca la conversación como leída y baja los contadores (RF-05, CA-05). */
export function useMarkRead(conversationId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => markConversationRead(conversationId),
    onSuccess: () => {
      const before =
        findConversation(
          client.getQueryData<ConversationsData>(chatKeys.conversations),
          conversationId,
        )?.unreadCount ?? 0;
      client.setQueryData<ConversationsData>(chatKeys.conversations, (data) =>
        data === undefined
          ? data
          : {
              ...data,
              pages: data.pages.map((page) => ({
                ...page,
                items: page.items.map((item) =>
                  item.id === conversationId ? { ...item, unreadCount: 0 } : item,
                ),
              })),
            },
      );
      client.setQueryData<number>(chatKeys.unread, (count) =>
        count === undefined ? count : Math.max(0, count - before),
      );
      void client.invalidateQueries({ queryKey: chatKeys.unread });
    },
  });
}

/** Envía un mensaje; al confirmarse lo deja en el caché y refresca la lista (último mensaje). */
export function useSendMessage(conversationId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ body, clientId }: { body: string; clientId: string }) =>
      sendMessage(conversationId, body, clientId),
    onSuccess: (message) => {
      client.setQueryData<MessagesData>(chatKeys.messages(conversationId), (data) =>
        appendNewer(data, [message]),
      );
      void client.invalidateQueries({ queryKey: chatKeys.conversations });
    },
  });
}

/** Resultado del `useOutbox`. */
export type Outbox = {
  pending: readonly PendingMessage[];
  /** `true` mientras algún mensaje está viajando (bloquea el botón de enviar, RF-07). */
  sending: boolean;
  /** Aviso vigente por un envío que el servidor rechazó (moderación, ritmo, chat cerrado). */
  rejection: SendRejection | null;
  dismissRejection: () => void;
  /** Envía el texto con un `clientId` nuevo. `false` si no se envió (vacío o demasiado largo). */
  send: (body: string) => boolean;
  /** Reintenta un «no enviado» con el MISMO `clientId` (idempotente, CA-01). */
  retry: (clientId: string) => void;
};

/**
 * Envío optimista (RF-03): el mensaje aparece de inmediato como «enviando». Si falla por red o
 * por el servidor, queda «no enviado» con reintento. Si el servidor lo rechaza por moderación o
 * por ritmo (RF-08), el mensaje sale de la lista y `onRestoreText` devuelve el texto al campo:
 * no se pierde (CA-06).
 */
export function useOutbox(conversationId: string, onRestoreText: (text: string) => void): Outbox {
  const client = useQueryClient();
  const mutation = useSendMessage(conversationId);
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [rejection, setRejection] = useState<SendRejection | null>(null);
  const restoreRef = useRef(onRestoreText);
  useEffect(() => {
    restoreRef.current = onRestoreText;
  }, [onRestoreText]);

  const remove = useCallback((clientId: string) => {
    setPending((list) => list.filter((item) => item.clientId !== clientId));
  }, []);
  const setStatus = useCallback((clientId: string, status: PendingMessage['status']) => {
    setPending((list) =>
      list.map((item) => (item.clientId === clientId ? { ...item, status } : item)),
    );
  }, []);

  const { mutateAsync } = mutation;
  const run = useCallback(
    async (clientId: string, body: string) => {
      try {
        await mutateAsync({ body, clientId });
        remove(clientId);
      } catch (error) {
        const rejected = classifySendError(error);
        if (rejected === null) {
          setStatus(clientId, 'failed');
          return;
        }
        remove(clientId);
        setRejection(rejected);
        if (rejected.kind === 'closed') {
          void client.invalidateQueries({ queryKey: chatKeys.conversations });
        } else {
          restoreRef.current(body);
        }
      }
    },
    [mutateAsync, remove, setStatus, client],
  );

  const send = useCallback(
    (raw: string) => {
      const body = raw.trim();
      if (body === '' || body.length > MESSAGE_MAX) return false;
      const clientId = newClientId();
      setRejection(null);
      setPending((list) => [
        ...list,
        { clientId, body, status: 'sending', createdAt: new Date().toISOString() },
      ]);
      void run(clientId, body);
      return true;
    },
    [run],
  );

  const retry = useCallback(
    (clientId: string) => {
      const item = pending.find((p) => p.clientId === clientId && p.status === 'failed');
      if (item === undefined) return;
      setRejection(null);
      setStatus(clientId, 'sending');
      void run(clientId, item.body);
    },
    [pending, run, setStatus],
  );

  return {
    pending,
    sending: pending.some((item) => item.status === 'sending'),
    rejection,
    dismissRejection: () => setRejection(null),
    send,
    retry,
  };
}

/**
 * Mantiene al día el chat abierto: cada 5 s trae lo nuevo (`after`) y, si llegó algo de la otra
 * persona, vuelve a marcar como leído para que el contador no suba mientras se lee.
 */
export function useChatSync(conversationId: string, currentUserId: string | null): void {
  const client = useQueryClient();
  const { mutate: markRead } = useMarkRead(conversationId);
  usePolling(async () => {
    const arrived = await pullNewerMessages(client, conversationId);
    if (arrived.some((message) => message.senderId !== currentUserId)) markRead();
  }, POLL_CHAT_MS);
  // La lista aporta `canWrite` y el estado de la reserva: se mantiene fresca con la pantalla abierta.
  usePolling(() => refreshConversations(client), POLL_LIST_MS);
}

/** Mantiene al día la lista de conversaciones mientras Mensajes está abierta (cada 20 s). */
export function useConversationsSync(): void {
  const client = useQueryClient();
  usePolling(() => refreshConversations(client), POLL_LIST_MS, { runOnMount: false });
}
