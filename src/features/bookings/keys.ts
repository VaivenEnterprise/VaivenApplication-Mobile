import type { ListRole, PaymentMode } from '@/features/bookings/types';

// Claves de consulta de reservas (Art. XIII.4). El detalle es el caché de verdad (plan P-06).
export const bookingsKeys = {
  all: ['bookings'] as const,
  quote: (itemId: string, startDate: string, endDate: string, paymentMode: PaymentMode) =>
    ['bookings', 'quote', itemId, startDate, endDate, paymentMode] as const,
  quotes: ['bookings', 'quote'] as const,
  detail: (id: string) => ['bookings', 'detail', id] as const,
  mine: (role?: ListRole) =>
    (role === undefined ? ['bookings', 'mine'] : ['bookings', 'mine', role]) as readonly string[],
};
