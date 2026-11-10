import { useQuery } from '@tanstack/react-query';
import { getMeta } from '@/features/diagnostics/api/getMeta';
import { metaKeys } from '@/features/diagnostics/keys';
import type { Meta } from '@/features/diagnostics/types';
import type { ApiError } from '@/lib/api/errors';

/** Consulta nombre, versión, entorno y hora del servidor. Pantalla de diagnóstico (solo desarrollo). */
export function useMeta() {
  return useQuery<Meta, ApiError>({
    queryKey: metaKeys.all,
    queryFn: getMeta,
  });
}
