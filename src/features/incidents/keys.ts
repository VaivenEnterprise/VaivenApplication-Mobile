import type { IncidentStatus } from '@/features/incidents/types';

// Claves de consulta de incidencias (Art. XIII.4, Art. VI.6).
export const incidentsKeys = {
  all: ['incidents'] as const,
  detail: (id: string) => ['incidents', 'detail', id] as const,
  mine: (status?: IncidentStatus) =>
    (status === undefined
      ? ['incidents', 'mine']
      : ['incidents', 'mine', status]) as readonly string[],
};
