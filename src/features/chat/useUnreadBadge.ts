import { useUnreadCount } from '@/features/chat/hooks';
import { POLL_LIST_MS } from '@/features/chat/types';
import { usePolling } from '@/features/chat/usePolling';

/**
 * Insignia del botón de mensajes de Inicio (RF-01, CA-05): mis no leídos, renovados cada 20 s
 * con la app en primer plano. Sin dato o con error devuelve 0 (no hay insignia).
 */
export function useUnreadBadge(): number {
  const query = useUnreadCount();
  const { refetch } = query;
  usePolling(() => refetch(), POLL_LIST_MS, { runOnMount: false });
  return query.data ?? 0;
}
