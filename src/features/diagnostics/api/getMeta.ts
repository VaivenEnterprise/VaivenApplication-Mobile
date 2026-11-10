import { request } from '@/lib/api/client';
import { metaSchema, type Meta } from '@/features/diagnostics/types';

export function getMeta(): Promise<Meta> {
  return request('/meta', metaSchema);
}
