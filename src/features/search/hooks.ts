import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { searchItems } from '@/features/search/api';
import { searchKeys } from '@/features/search/keys';
import { POLICY } from '@/lib/policy';

/** Devuelve `value` después de que deja de cambiar durante `delayMs` (CA-02: 400 ms). */
export function useDebouncedValue<T>(value: T, delayMs: number = POLICY.search.debounceMs): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

type SearchOptions = { enabled?: boolean };

/**
 * Resultados paginados con cursor (RF-01). La clave lleva la consulta completa (P-02): al cambiar
 * un filtro, TanStack Query cancela con `signal` la petición anterior y no hay respuestas fuera de
 * orden (RF-08).
 */
export function useSearchItems(query: string, { enabled = true }: SearchOptions = {}) {
  return useInfiniteQuery({
    queryKey: searchKeys.items(query),
    queryFn: ({ pageParam, signal }) => searchItems(query, pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled,
  });
}
