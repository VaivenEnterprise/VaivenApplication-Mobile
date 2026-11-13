import type { StageName } from '@/features/handover/types';

// Claves de consulta de la entrega y la devolución (Art. XIII.4).
export const handoverKeys = {
  all: ['handover'] as const,
  stage: (bookingId: string, stage: StageName) => ['handover', 'stage', bookingId, stage] as const,
};
