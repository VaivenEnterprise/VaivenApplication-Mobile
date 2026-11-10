import { useQuery } from '@tanstack/react-query';
import { getHealth, getReadiness } from '@/features/diagnostics/api/getHealth';
import { healthKeys, readinessKeys } from '@/features/diagnostics/keys';
import type { Health, Readiness } from '@/features/diagnostics/types';
import type { ApiError } from '@/lib/api/errors';

/** El proceso del backend responde (`/healthz`). */
export function useHealth() {
  return useQuery<Health, ApiError>({ queryKey: healthKeys.all, queryFn: getHealth });
}

/** El backend y MongoDB están listos (`/readyz`). */
export function useReadiness() {
  return useQuery<Readiness, ApiError>({ queryKey: readinessKeys.all, queryFn: getReadiness });
}
