import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { useSession } from '@/features/auth/useSession';
import {
  createItem,
  deleteItem,
  getItem,
  getPriceSuggestion,
  listCategories,
  listMyItems,
  pauseItem,
  resumeItem,
  updateItem,
} from '@/features/items/api';
import { itemsKeys } from '@/features/items/keys';
import type { Item, ItemInput, ItemStatus, ItemUpdate } from '@/features/items/types';

/** Las categorías casi no cambian: se piden una vez por sesión (POL-14). */
const CATEGORIES_STALE_MS = 10 * 60 * 1000;

/** `GET /me/items` paginado con cursor; `status` filtra por estado (sin él, todos). */
export function useMyItems(status?: Exclude<ItemStatus, 'removed'>) {
  const { status: session } = useSession();
  return useInfiniteQuery({
    queryKey: itemsKeys.mine(status),
    queryFn: ({ pageParam }) => listMyItems({ status, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    enabled: session === 'signedIn',
  });
}

/** `GET /items/{id}`. */
export function useItem(id: string) {
  const { status } = useSession();
  return useQuery({
    queryKey: itemsKeys.detail(id),
    queryFn: () => getItem(id),
    enabled: status === 'signedIn' && id !== '',
  });
}

/** `GET /categories`. */
export function useCategories() {
  const { status } = useSession();
  return useQuery({
    queryKey: itemsKeys.categories,
    queryFn: listCategories,
    staleTime: CATEGORIES_STALE_MS,
    enabled: status === 'signedIn',
  });
}

/** Plan P-03: toda mutación refresca mis listas y el detalle, sin duplicar estado. */
function refresh(queryClient: QueryClient, item: Item): Promise<unknown> {
  queryClient.setQueryData(itemsKeys.detail(item.id), item);
  return queryClient.invalidateQueries({ queryKey: itemsKeys.mine() });
}

/** `POST /items`. */
export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ItemInput) => createItem(body),
    onSuccess: (item) => refresh(queryClient, item),
  });
}

/** `PATCH /items/{id}`. */
export function useUpdateItem(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ItemUpdate) => updateItem(id, body),
    onSuccess: (item) => refresh(queryClient, item),
  });
}

/** `POST /items/{id}/pause`. */
export function usePauseItem(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => pauseItem(id),
    onSuccess: (item) => refresh(queryClient, item),
  });
}

/** `POST /items/{id}/resume`. */
export function useResumeItem(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => resumeItem(id),
    onSuccess: (item) => refresh(queryClient, item),
  });
}

/** `DELETE /items/{id}`: quita el detalle de la caché y refresca mis listas. */
export function useDeleteItem(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteItem(id),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: itemsKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: itemsKeys.mine() });
    },
  });
}

/** `GET /items/price-suggestion` a petición de la persona («Usar sugerido»). */
export function usePriceSuggestion() {
  return useMutation({
    mutationFn: (declaredValueCents: number) => getPriceSuggestion(declaredValueCents),
  });
}
