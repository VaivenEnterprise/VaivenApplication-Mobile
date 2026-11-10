import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/features/auth/useSession';
import { RECENT_LIMIT, getRecentItems } from '@/features/home/api';
import { homeKeys } from '@/features/home/keys';

/** Objetos recientes de Inicio. Cuando exista `useSearchItems` (006) puede apoyarse en él. */
export function useRecentItems() {
  const { status } = useSession();
  return useQuery({
    queryKey: homeKeys.recent(RECENT_LIMIT),
    queryFn: () => getRecentItems(RECENT_LIMIT),
    enabled: status === 'signedIn',
  });
}
