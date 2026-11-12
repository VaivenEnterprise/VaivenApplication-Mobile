import type { ToolRadiusKm } from '@/features/project-guide/types';

// Claves de consulta de la pantalla de proyecto (Art. XIII.4): una por herramienta.
export const guideKeys = {
  all: ['project-guide'] as const,
  tool: (query: string, coords: string, radiusKm: ToolRadiusKm) =>
    ['project-guide', 'tool', query, coords, radiusKm] as const,
};
