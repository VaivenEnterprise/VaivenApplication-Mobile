import type { CompletedWork } from '@/lib/domain/models';

export const works: readonly CompletedWork[] = [
  {
    id: 'work-hang-picture',
    title: 'Colgar un cuadro',
    completedDaysAgo: 3,
  },
  {
    id: 'work-assemble-furniture',
    title: 'Armar un mueble',
    completedDaysAgo: 12,
  },
];
