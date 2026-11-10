import { useCallback, useState } from 'react';
import { useRecentItems } from '@/features/home/hooks/useRecentItems';
import { useMe } from '@/features/profile/hooks';

/** Datos de Inicio y «jalar para recargar»: vuelve a pedir `GET /me` y los objetos recientes (CA-12). */
export function useHome() {
  const me = useMe();
  const recent = useRecentItems();
  const [refreshing, setRefreshing] = useState(false);
  const { refetch: refetchMe } = me;
  const { refetch: refetchRecent } = recent;

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([refetchMe(), refetchRecent()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchMe, refetchRecent]);

  return { user: me.user, recent, refreshing, refresh };
}
