import { z } from 'zod';

// Contrato de calificaciones (`Rating`, `RatingStatus`, `RatingPage` en backend/api/openapi.yaml).
// Las respuestas se validan con zod (Art. III.2, IV).

export const SCORES = [1, 2, 3, 4, 5] as const;
export type Score = (typeof SCORES)[number];

export const ratingSchema = z.object({
  id: z.string(),
  bookingId: z.string(),
  score: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  ratedRole: z.enum(['owner', 'requester']),
  rater: z.object({ id: z.string(), displayName: z.string() }),
  createdAt: z.string(),
});
export type Rating = z.infer<typeof ratingSchema>;

export const ratingStatusSchema = z.object({
  canRate: z.boolean(),
  myRating: ratingSchema.nullable(),
  expiresAt: z.string().nullable(),
});
export type RatingStatus = z.infer<typeof ratingStatusSchema>;

export const ratingPageSchema = z.object({
  items: z.array(ratingSchema),
  nextCursor: z.string().nullable(),
});
export type RatingPage = z.infer<typeof ratingPageSchema>;

/** Cuerpo de `POST /bookings/{id}/ratings`. */
export type RateRequest = { score: number; comment?: string };
