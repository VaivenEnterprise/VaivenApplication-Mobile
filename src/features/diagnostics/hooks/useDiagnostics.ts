import { useHealth, useReadiness } from '@/features/diagnostics/hooks/useHealth';
import { useMeta } from '@/features/diagnostics/hooks/useMeta';

/** Reúne `/api/v1/meta`, `/healthz` y `/readyz` para la pantalla de diagnóstico (RF-S3). */
export function useDiagnostics() {
  const meta = useMeta();
  const health = useHealth();
  const readiness = useReadiness();
  const queries = [meta, health, readiness];
  const failed = queries.find((query) => query.error !== null);

  return {
    meta: meta.data,
    health: health.data,
    readiness: readiness.data,
    isPending: queries.some((query) => query.isPending),
    error: failed?.error ?? null,
    refetch: () => Promise.all(queries.map((query) => query.refetch())),
  };
}
