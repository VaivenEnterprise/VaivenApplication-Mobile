import { COMMENT_MAX, buildComment, ratingFormSchema } from '@/features/ratings/schemas';
import { es } from '@/i18n/es-MX';

const v = es.ratings.validation;

describe('ratingFormSchema', () => {
  it.each([1, 2, 3, 4, 5])('acepta %s estrellas', (score) => {
    expect(ratingFormSchema.safeParse({ score, comment: '' }).success).toBe(true);
  });

  it.each([0, 6, -1, 2.5])('rechaza %s estrellas', (score) => {
    const result = ratingFormSchema.safeParse({ score, comment: '' });
    expect(result.success).toBe(false);
  });

  it('pide estrellas con un mensaje en español', () => {
    const result = ratingFormSchema.safeParse({ score: 0, comment: '' });
    expect(result.success ? '' : result.error.issues[0]?.message).toBe(v.scoreRequired);
  });

  it('acepta un comentario de exactamente 300 caracteres y rechaza uno de 301', () => {
    expect(ratingFormSchema.safeParse({ score: 5, comment: 'a'.repeat(COMMENT_MAX) }).success).toBe(
      true,
    );
    const result = ratingFormSchema.safeParse({ score: 5, comment: 'a'.repeat(COMMENT_MAX + 1) });
    expect(result.success).toBe(false);
    expect(result.success ? '' : result.error.issues[0]?.message).toBe(v.commentTooLong);
  });
});

describe('buildComment (CA-08)', () => {
  it('sin chips devuelve el comentario sin espacios sobrantes', () => {
    expect(buildComment([], '  Todo bien  ')).toBe('Todo bien');
  });

  it('con chips y sin comentario envía solo los textos de los chips', () => {
    expect(buildComment(['Puntual', 'Amable'], '')).toBe('Puntual, Amable');
  });

  it('une chips y comentario', () => {
    expect(buildComment(['Puntual'], 'Gracias')).toBe('Puntual. Gracias');
  });

  it('sin chips ni comentario devuelve vacío', () => {
    expect(buildComment([], '   ')).toBe('');
  });
});
