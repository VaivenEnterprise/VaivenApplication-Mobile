import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { usePolling } from '@/features/chat/usePolling';
import {
  acceptBooking,
  cancelBooking,
  createBooking,
  fetchBooking,
  fetchMyBookings,
  fetchQuote,
  rejectBooking,
  setMeetingPoint,
} from '@/features/bookings/api';
import { bookingsKeys } from '@/features/bookings/keys';
import type {
  Booking,
  BookingRequest,
  BookingStatus,
  ListRole,
  PaymentMode,
} from '@/features/bookings/types';

type QuoteArgs = {
  itemId: string;
  startDate: string;
  endDate: string;
  paymentMode: PaymentMode;
};

/**
 * Cotización del periodo (plan P-04). Se vuelve a pedir al cambiar fechas o forma de pago, sin
 * guardarla en caché: el precio que se acepta debe ser el vigente (CA-03). Solo corre con
 * `enabled` (periodo válido).
 */
export function useQuote({ itemId, startDate, endDate, paymentMode }: QuoteArgs, enabled = true) {
  return useQuery({
    queryKey: bookingsKeys.quote(itemId, startDate, endDate, paymentMode),
    queryFn: ({ signal }) => fetchQuote(itemId, startDate, endDate, paymentMode, signal),
    enabled,
    gcTime: 0,
    staleTime: 0,
    retry: false,
  });
}

/**
 * Cada cuánto se vuelve a pedir una reserva abierta: la otra parte la cambia desde su teléfono y
 * el backend no tiene *websockets* (solo sondeo), igual que el chat.
 */
export const BOOKING_POLL_MS = 10_000;

/**
 * Detalle de una reserva; es el caché de verdad que actualizan las mutaciones (P-06). Se refresca
 * solo con la pantalla enfocada y la app en primer plano (hallazgo de 012-T007).
 */
export function useBooking(id: string) {
  const query = useQuery({
    queryKey: bookingsKeys.detail(id),
    queryFn: ({ signal }) => fetchBooking(id, signal),
  });
  usePolling(() => query.refetch(), BOOKING_POLL_MS, { runOnMount: false });
  return query;
}

/** Mis solicitudes y reservas por rol y estado, con paginación por cursor (RF-10). */
export function useMyBookings(role: ListRole, status?: BookingStatus) {
  const query = useInfiniteQuery({
    queryKey: [...bookingsKeys.mine(role), status ?? 'all'],
    queryFn: ({ pageParam, signal }) => fetchMyBookings(role, pageParam, status, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
  usePolling(() => query.refetch(), BOOKING_POLL_MS, { runOnMount: false });
  return query;
}

/** Deja el detalle como verdad y marca las listas para recargar (P-06). */
function commit(client: QueryClient, booking: Booking): void {
  client.setQueryData(bookingsKeys.detail(booking.id), booking);
  void client.invalidateQueries({ queryKey: bookingsKeys.mine() });
}

/** Envía la solicitud. El 409 `quote_changed` lo trata la pantalla con `isQuoteChanged`. */
export function useCreateBooking() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: BookingRequest) => createBooking(body),
    onSuccess: (booking) => commit(client, booking),
  });
}

export function useAcceptBooking(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (meetingPoint?: string) => acceptBooking(id, meetingPoint),
    onSuccess: (booking) => commit(client, booking),
  });
}

export function useRejectBooking(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) => rejectBooking(id, reason),
    onSuccess: (booking) => commit(client, booking),
  });
}

export function useCancelBooking(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) => cancelBooking(id, reason),
    onSuccess: (booking) => commit(client, booking),
  });
}

export function useSetMeetingPoint(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (description: string) => setMeetingPoint(id, description),
    onSuccess: (booking) => commit(client, booking),
  });
}
