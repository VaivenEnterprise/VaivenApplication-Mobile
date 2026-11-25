import { ApiError, type ApiErrorCode } from '@/lib/api/errors';
import { moderationFromError } from '@/lib/api/moderation';

// Spec 016 · S-10 (OWASP M4 validación insuficiente de entradas): el texto inapropiado se
// detecta en el servidor (spec 011) y la app lo muestra con salida, sin tratarlo como un fallo común.

const rejection = (
  field: string,
  issue: string,
  status = 400,
  code: ApiErrorCode = 'validation_failed',
) => new ApiError(code, 'x', status, 'req-1', [{ field, issue }]);

describe('S-10 · M4 · rechazo de texto inapropiado', () => {
  it('S-10a reconoce el rechazo del filtro de contenido y extrae la categoría', () => {
    const r = moderationFromError(rejection('title', 'Contiene contenido no permitido: armas.'), [
      'title',
      'description',
    ]);
    expect(r).toEqual({
      category: 'Armas',
      reason: 'Contiene contenido no permitido: armas.',
      requestId: 'req-1',
    });
  });

  it('S-10b ignora campos que no se pidieron, otros motivos y otros códigos', () => {
    expect(
      moderationFromError(rejection('price', 'Contiene contenido no permitido: x.'), ['title']),
    ).toBeNull();
    expect(moderationFromError(rejection('title', 'Es obligatorio'), ['title'])).toBeNull();
    expect(
      moderationFromError(
        rejection('title', 'Contiene contenido no permitido: x.', 500, 'internal_error'),
        ['title'],
      ),
    ).toBeNull();
    expect(moderationFromError(new Error('red'), ['title'])).toBeNull();
  });
});
