import type { User } from '@/lib/domain/models';

export const mariana = {
  id: 'user-mariana',
  name: 'Mariana',
  email: 'mariana@vaiven.mx',
} as const satisfies User;

export const users = [mariana] as const satisfies readonly User[];
