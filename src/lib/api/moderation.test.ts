import { ApiError } from '@/lib/api/errors';
import { moderationFromError, parseModerationReason } from '@/lib/api/moderation';

const moderated = (field = 'body', issue = 'Contiene contenido no permitido: armas.') =>
  new ApiError('validation_failed', 'x', 400, 'req-1', [{ field, issue }]);

describe('moderationFromError', () => {
  it('reconoce el rechazo y extrae categoría, motivo y referencia', () => {
    expect(moderationFromError(moderated(), ['body'])).toEqual({
      category: 'Armas',
      reason: 'Contiene contenido no permitido: armas.',
      requestId: 'req-1',
    });
  });

  it('acepta categorías de varias palabras', () => {
    const result = moderationFromError(
      moderated('title', 'Contiene contenido no permitido: contenido sexual.'),
      ['title', 'description'],
    );
    expect(result?.category).toBe('Contenido sexual');
  });

  it('ignora campos que no se piden, validaciones comunes y otros errores', () => {
    expect(moderationFromError(moderated('title'), ['body'])).toBeNull();
    expect(
      moderationFromError(
        new ApiError('validation_failed', 'x', 400, null, [{ field: 'body', issue: 'Muy largo' }]),
        ['body'],
      ),
    ).toBeNull();
    expect(
      moderationFromError(new ApiError('internal_error', 'x', 500, null, []), ['body']),
    ).toBeNull();
    expect(moderationFromError(new Error('boom'), ['body'])).toBeNull();
  });

  it('sin categoría legible deja solo el motivo', () => {
    const result = moderationFromError(moderated('body', 'Contiene contenido no permitido'), [
      'body',
    ]);
    expect(result).toMatchObject({ category: null, reason: 'Contiene contenido no permitido' });
  });
});

describe('parseModerationReason', () => {
  it('extrae la categoría del motivo del servidor', () => {
    expect(parseModerationReason('Contiene contenido no permitido: drogas.')).toEqual({
      category: 'Drogas',
      reason: 'Contiene contenido no permitido: drogas.',
      requestId: null,
    });
  });

  it('sin motivo no hay categoría', () => {
    expect(parseModerationReason(null, 'r1')).toEqual({
      category: null,
      reason: null,
      requestId: 'r1',
    });
  });
});
