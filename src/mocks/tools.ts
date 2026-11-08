import type { Tool } from '@/lib/domain/models';

export const tools: readonly Tool[] = [
  {
    id: 'tool-drill',
    name: 'Taladro percutor',
    ownerName: 'Carlos',
    distanceBlocks: 3,
    status: 'available',
    category: 'tools',
  },
  {
    id: 'tool-level',
    name: 'Nivel de burbuja',
    ownerName: 'Ana',
    distanceBlocks: 1,
    status: 'available',
    category: 'tools',
  },
  {
    id: 'tool-bits',
    name: 'Juego de brocas',
    ownerName: 'Luis',
    distanceBlocks: 4,
    status: 'lent',
    category: 'tools',
  },
];
