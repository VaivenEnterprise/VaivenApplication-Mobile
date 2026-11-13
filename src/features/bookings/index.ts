// API pública de la feature de solicitudes y reservas (spec 007).
export { RequestButton } from '@/features/bookings/components/RequestButton';
export { slots } from '@/features/bookings/slots';
export type {
  Adjustment,
  Booking,
  BookingPayment,
  BookingStatus,
  HandoverStage,
  PaymentStatus,
  QrState,
  ViewerRole,
} from '@/features/bookings/types';
export { useBooking, useMyBookings } from '@/features/bookings/hooks';
export { bookingsKeys } from '@/features/bookings/keys';
export { StatusBadge } from '@/features/bookings/components/StatusBadge';
export { BOOKING_STATUSES, handoverStageSchema } from '@/features/bookings/types';
