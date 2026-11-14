import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';
import { usePolling } from '@/features/chat/usePolling';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationsRead,
  type MarkReadTarget,
} from '@/features/notifications/api';
import { notificationsKeys } from '@/features/notifications/keys';
import { UNREAD_POLL_MS, type NotificationPage } from '@/features/notifications/types';

/** Mis avisos, con paginación por cursor (RF-01). */
export function useNotifications() {
  return useInfiniteQuery({
    queryKey: notificationsKeys.list,
    queryFn: ({ pageParam, signal }) => fetchNotifications(pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

/** Cuántos avisos no he leído (RF-02). */
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationsKeys.unread,
    queryFn: ({ signal }) => fetchUnreadCount(signal),
  });
}

/**
 * Conteo para la insignia del Perfil: se renueva cada 60 s con la app en primer plano y al volver
 * a ella (RF-02, plan P-05); nunca consulta en segundo plano (Art. IX). Sin dato o con error: 0.
 */
export function useUnreadNotifications(): number {
  const query = useUnreadCount();
  const { refetch } = query;
  usePolling(() => refetch(), UNREAD_POLL_MS, { runOnMount: false });
  return query.data ?? 0;
}

/** Marca como leídos los avisos del caché ya cargados, sin esperar otra consulta. */
function markReadInCache(client: QueryClient, target: MarkReadTarget): void {
  const readAt = new Date().toISOString();
  const selected = 'ids' in target ? new Set(target.ids) : null;
  client.setQueriesData<InfiniteData<NotificationPage, string | null>>(
    { queryKey: notificationsKeys.list },
    (old) =>
      old === undefined
        ? old
        : {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.readAt === null && (selected === null || selected.has(item.id))
                  ? { ...item, readAt }
                  : item,
              ),
            })),
          },
  );
}

/** Marca avisos como leídos (RF-01): actualiza la lista y vuelve a pedir el conteo. */
export function useMarkNotificationsRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (target: MarkReadTarget) => markNotificationsRead(target),
    onSuccess: (_data, target) => {
      markReadInCache(client, target);
      void client.invalidateQueries({ queryKey: notificationsKeys.unread });
    },
    onError: () => {
      void client.invalidateQueries({ queryKey: notificationsKeys.all });
    },
  });
}
