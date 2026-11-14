import { z } from 'zod';
import { es } from '@/i18n/es-MX';

const v = es.ratings.validation;

/** Largo máximo del comentario en el contrato (`RateRequest.comment`). */
export const COMMENT_MAX = 300;

/** Formulario de calificación: de 1 a 5 estrellas y comentario opcional de hasta 300 caracteres. */
export const ratingFormSchema = z.object({
  score: z.number().int(v.scoreRequired).min(1, v.scoreRequired).max(5, v.scoreRequired),
  comment: z.string().max(COMMENT_MAX, v.commentTooLong),
});
export type RatingFormInput = z.infer<typeof ratingFormSchema>;

/**
 * Texto final del comentario: los chips elegidos y lo escrito, separados por un punto. Los chips
 * viajan dentro del comentario (RF-10), sin cambiar el contrato.
 */
export function buildComment(chips: readonly string[], typed: string): string {
  const parts = [chips.join(', '), typed.trim()].filter((part) => part !== '');
  return parts.join('. ');
}
