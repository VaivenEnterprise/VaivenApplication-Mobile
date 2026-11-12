import { request } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import {
  bookingPageSchema,
  bookingSchema,
  quoteSchema,
  type Booking,
  type BookingPage,
  type BookingRequest,
  type BookingStatus,
  type ListRole,
  type PaymentMode,
  type Quote,
} from '@/features/bookings/types';

// Las 8 rutas de solicitudes y reservas (backend 007). Todo pasa por `request` (Art. II, IV).

const itemPath = (itemId: string) => `/items/${encodeURIComponent(itemId)}`;
const bookingPath = (id: string) => `/bookings/${encodeURIComponent(id)}`;

/** `GET /items/{id}/quote`: precio y políticas antes de solicitar; no crea nada. */
export function fetchQuote(
  itemId: string,
  startDate: string,
  endDate: string,
  paymentMode: PaymentMode,
  signal?: AbortSignal,
): Promise<Quote> {
  const query = new URLSearchParams({ startDate, endDate, paymentMode }).toString();
  return request(`${itemPath(itemId)}/quote?${query}`, quoteSchema, { signal });
}

/** `POST /bookings`: crea una solicitud `pending` con el total que la persona vio. */
export function createBooking(body: BookingRequest): Promise<Booking> {
  return request('/bookings', bookingSchema, { method: 'POST', body: JSON.stringify(body) });
}

/** `GET /bookings/{id}`. */
export function fetchBooking(id: string, signal?: AbortSignal): Promise<Booking> {
  return request(bookingPath(id), bookingSchema, { signal });
}

/** `GET /me/bookings?role&status&cursor`: más recientes primero, paginadas con cursor. */
export function fetchMyBookings(
  role: ListRole,
  cursor: string | null,
  status?: BookingStatus,
  signal?: AbortSignal,
): Promise<BookingPage> {
  const params = new URLSearchParams({ role });
  if (status !== undefined) params.set('status', status);
  if (cursor !== null) params.set('cursor', cursor);
  return request(`/me/bookings?${params.toString()}`, bookingPageSchema, { signal });
}

/** `POST /bookings/{id}/accept` (propietario); el punto de encuentro es opcional. */
export function acceptBooking(id: string, meetingPoint?: string): Promise<Booking> {
  const body = meetingPoint === undefined ? {} : { meetingPoint: { description: meetingPoint } };
  return request(`${bookingPath(id)}/accept`, bookingSchema, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** `POST /bookings/{id}/reject` (propietario); el motivo es opcional. */
export function rejectBooking(id: string, reason?: string): Promise<Booking> {
  return request(`${bookingPath(id)}/reject`, bookingSchema, {
    method: 'POST',
    body: JSON.stringify(reason === undefined ? {} : { reason }),
  });
}

/** `POST /bookings/{id}/cancel`; el motivo es obligatorio si la reserva ya fue aceptada. */
export function cancelBooking(id: string, reason?: string): Promise<Booking> {
  return request(`${bookingPath(id)}/cancel`, bookingSchema, {
    method: 'POST',
    body: JSON.stringify(reason === undefined ? {} : { reason }),
  });
}

/** `POST /bookings/{id}/meeting-point` (propietario). */
export function setMeetingPoint(id: string, description: string): Promise<Booking> {
  return request(`${bookingPath(id)}/meeting-point`, bookingSchema, {
    method: 'POST',
    body: JSON.stringify({ description }),
  });
}

/** `true` si el 409 dice que el total cambió desde la cotización (CA-03): hay que cotizar de nuevo. */
export function isQuoteChanged(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 409 &&
    (error.details ?? []).some(
      (detail) => detail.field === 'acceptedTotalCents' && detail.issue === 'quote_changed',
    )
  );
}
