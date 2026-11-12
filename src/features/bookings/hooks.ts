import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
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

/** Detalle de una reserva; es el caché de verdad que actualizan las mutaciones (P-06). */
export function useBooking(id: string) {
  return useQuery({
    queryKey: bookingsKeys.detail(id),
    queryFn: ({ signal }) => fetchBooking(id, signal),
  });
}

/** Mis solicitudes y reservas por rol y estado, con paginación por cursor (RF-10). */
export function useMyBookings(role: ListRole, status?: BookingStatus) {
  return useInfiniteQuery({
    queryKey: [...bookingsKeys.mine(role), status ?? 'all'],
    queryFn: ({ pageParam, signal }) => fetchMyBookings(role, pageParam, status, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
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
