import type { ComponentType } from 'react';
import type { Booking } from '@/features/bookings/types';

// Puntos de extensión del detalle de la reserva (plan P-04, Art. XIII). 008 (chat), 009 (entrega
// y pagos) y 010 (calificaciones e incidencias) registran su componente con una línea en el
// `index.ts` de su propia feature:
//
//   slots.register('chat', ChatSection);
//
// `BookingDetailScreen` pinta, en este orden, las secciones que tengan componente. Una sección sin
// registrar no ocupa lugar: no hay marcadores de posición en producción.

export type BookingSlotName = 'chat' | 'deliveryAndPayments' | 'ratingsAndIncidents';
export type BookingSlotProps = { booking: Booking };
export type BookingSlotComponent = ComponentType<BookingSlotProps>;

/** Orden en que el detalle pinta las secciones. */
export const SLOT_ORDER: readonly BookingSlotName[] = [
  'chat',
  'deliveryAndPayments',
  'ratingsAndIncidents',
];

const registry = new Map<BookingSlotName, BookingSlotComponent>();

export const slots = {
  /** Registra (o reemplaza) el componente de una sección. */
  register(name: BookingSlotName, component: BookingSlotComponent): void {
    registry.set(name, component);
  },
  /** Componentes registrados, en el orden del detalle. */
  registered(): { name: BookingSlotName; Component: BookingSlotComponent }[] {
    return SLOT_ORDER.flatMap((name) => {
      const Component = registry.get(name);
      return Component === undefined ? [] : [{ name, Component }];
    });
  },
  /** Solo para pruebas. */
  clear(): void {
    registry.clear();
  },
};
