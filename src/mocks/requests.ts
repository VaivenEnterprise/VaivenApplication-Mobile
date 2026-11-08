import type { ToolRequest } from '@/lib/domain/models';

export const requests: readonly ToolRequest[] = [
  {
    id: 'request-m',
    requesterName: 'M...',
    toolName: 'Taladro percutor',
    day: 'today',
    time: '5:00 PM',
    status: 'pending',
  },
  {
    id: 'request-david',
    requesterName: 'David',
    toolName: 'Nivel de burbuja',
    day: 'yesterday',
    time: '6:30 PM',
    status: 'accepted',
  },
];
