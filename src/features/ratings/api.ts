import {
  ratingPageSchema,
  ratingSchema,
  ratingStatusSchema,
  type Rating,
  type RatingPage,
  type RatingStatus,
  type RateRequest,
} from '@/features/ratings/types';
import { request } from '@/lib/api/client';

// Las 3 rutas de calificaciones (backend 010). Todo pasa por `request` (Art. II, IV).

/** Tamaño de página de las calificaciones recibidas. */
export const RATINGS_PAGE_SIZE = 20;

const bookingPath = (id: string) => `/bookings/${encodeURIComponent(id)}`;

/** `POST /bookings/{id}/ratings`: califica a la otra parte (409 si ya calificó o venció). */
export function createRating(bookingId: string, body: RateRequest): Promise<Rating> {
  return request(`${bookingPath(bookingId)}/ratings`, ratingSchema, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** `GET /bookings/{id}/rating-status`: si puedo calificar y, si ya lo hice, mi calificación. */
export function fetchRatingStatus(bookingId: string, signal?: AbortSignal): Promise<RatingStatus> {
  return request(`${bookingPath(bookingId)}/rating-status`, ratingStatusSchema, { signal });
}

/** `GET /users/{id}/ratings`: calificaciones recibidas, las más recientes primero. */
export function fetchUserRatings(
  userId: string,
  cursor: string | null,
  signal?: AbortSignal,
): Promise<RatingPage> {
  const params = new URLSearchParams({ limit: String(RATINGS_PAGE_SIZE) });
  if (cursor !== null) params.set('cursor', cursor);
  return request(
    `/users/${encodeURIComponent(userId)}/ratings?${params.toString()}`,
    ratingPageSchema,
    {
      signal,
    },
  );
}
