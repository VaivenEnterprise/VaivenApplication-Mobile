import { request } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import {
  healthSchema,
  readinessSchema,
  type Health,
  type Readiness,
} from '@/features/diagnostics/types';

// `/healthz` y `/readyz` están fuera del prefijo `/api/v1` (backend, Art. IV.1).
export function getHealth(): Promise<Health> {
  return request('/healthz', healthSchema, { prefix: '' });
}

/** Un 503 `service_unavailable` es una respuesta válida («no listo»), no un fallo de conexión. */
export async function getReadiness(): Promise<Readiness> {
  try {
    const body = await request('/readyz', readinessSchema, { prefix: '' });
    return { ready: body.status === 'ready', redis: body.redis ?? null };
  } catch (error) {
    if (error instanceof ApiError && error.code === 'service_unavailable') {
      return { ready: false, redis: null };
    }
    throw error;
  }
}
