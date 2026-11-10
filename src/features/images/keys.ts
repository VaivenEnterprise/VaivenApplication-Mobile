import type { Purpose } from '@/features/images/types';

// Claves de TanStack Query de imágenes (Art. XIII.4). La firma es una mutación de un solo uso.
export const imageKeys = {
  all: ['images'] as const,
  signature: (purpose: Purpose) => ['images', 'signature', purpose] as const,
};
