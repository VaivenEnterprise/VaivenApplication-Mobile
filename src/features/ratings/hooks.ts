import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authKeys } from '@/features/auth/keys';
import { bookingsKeys } from '@/features/bookings';
import { profileKeys } from '@/features/profile/keys';
import { createRating, fetchRatingStatus, fetchUserRatings } from '@/features/ratings/api';
import { ratingsKeys } from '@/features/ratings/keys';
import type { RateRequest } from '@/features/ratings/types';

/** Si puedo calificar la reserva (RF-01). Solo se consulta cuando la reserva ya concluyó. */
export function useRatingStatus(bookingId: string, enabled: boolean) {
  return useQuery({
    queryKey: ratingsKeys.status(bookingId),
    queryFn: ({ signal }) => fetchRatingStatus(bookingId, signal),
    enabled,
  });
}

/** Calificaciones recibidas por una persona, con paginación por cursor (RF-03). */
export function useUserRatings(userId: string) {
  return useInfiniteQuery({
    queryKey: ratingsKeys.user(userId),
    queryFn: ({ pageParam, signal }) => fetchUserRatings(userId, pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

/**
 * Envía la calificación. Al terminar deja el estado como «ya calificó» y marca para recargar lo
 * que depende de ella: el estado, la reserva y la reputación (perfiles y lista).
 */
export function useCreateRating(bookingId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: RateRequest) => createRating(bookingId, body),
    onSuccess: (rating) => {
      client.setQueryData(ratingsKeys.status(bookingId), {
        canRate: false,
        myRating: rating,
        expiresAt: null,
      });
      void client.invalidateQueries({ queryKey: ratingsKeys.status(bookingId) });
      void client.invalidateQueries({ queryKey: bookingsKeys.detail(bookingId) });
      void client.invalidateQueries({ queryKey: ratingsKeys.all });
      void client.invalidateQueries({ queryKey: profileKeys.all });
      void client.invalidateQueries({ queryKey: authKeys.me });
    },
    // Un 409 significa que el estado cambió (ya calificó o venció): se vuelve a consultar.
    onError: () => {
      void client.invalidateQueries({ queryKey: ratingsKeys.status(bookingId) });
    },
  });
}
