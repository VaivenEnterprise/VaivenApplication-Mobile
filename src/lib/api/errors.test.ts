import {
  API_ERROR_CODES,
  ApiError,
  CLIENT_ERROR_CODES,
  SERVER_ERROR_CODES,
  fromServerError,
  messageForCode,
} from '@/lib/api/errors';
import { newRequestId } from '@/lib/api/request-id';
import { es } from '@/i18n/es-MX';

const envelope = (code: string, extra: Record<string, unknown> = {}) => ({
  error: { code, message: `mensaje ${code}`, ...extra },
});

describe('ApiError', () => {
  it('conserva sus campos y es una instancia de Error y de ApiError', () => {
    const error = new ApiError('conflict', 'ya existe', 409, 'abc', [
      { field: 'email', issue: 'duplicado' },
    ]);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.name).toBe('ApiError');
    expect(error).toMatchObject({ code: 'conflict', message: 'ya existe', status: 409 });
    expect(error.requestId).toBe('abc');
    expect(error.details).toEqual([{ field: 'email', issue: 'duplicado' }]);
  });

  it('no trae detalles por defecto', () => {
    expect(new ApiError('timeout', 'x', null, null).details).toEqual([]);
  });
});

describe('códigos de error', () => {
  it('son los 8 del servidor más 3 del cliente', () => {
    expect(SERVER_ERROR_CODES).toHaveLength(8);
    expect(CLIENT_ERROR_CODES).toEqual(['network_error', 'timeout', 'invalid_response']);
    expect(API_ERROR_CODES).toHaveLength(11);
  });

  it.each(API_ERROR_CODES)('tiene mensaje en español para %s', (code) => {
    expect(messageForCode(code)).toBe(es.errors[code]);
    expect(messageForCode(code).length).toBeGreaterThan(0);
  });
});

describe('fromServerError con el envoltorio del backend', () => {
  it.each<[number, (typeof SERVER_ERROR_CODES)[number]]>([
    [400, 'validation_failed'],
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [404, 'not_found'],
    [409, 'conflict'],
    [429, 'rate_limited'],
    [500, 'internal_error'],
    [503, 'service_unavailable'],
  ])('estado %i con código %s', (status, code) => {
    const error = fromServerError(status, envelope(code, { requestId: 'srv-1' }), 'cli-1');
    expect(error.code).toBe(code);
    expect(error.status).toBe(status);
    expect(error.message).toBe(`mensaje ${code}`);
    expect(error.requestId).toBe('srv-1');
  });

  it('CA-05: 404 con envoltorio produce not_found con el requestId recibido', () => {
    const error = fromServerError(404, envelope('not_found', { requestId: '01JABC' }), 'enviado');
    expect(error.code).toBe('not_found');
    expect(error.requestId).toBe('01JABC');
  });

  it('conserva los detalles de validación', () => {
    const details = [{ field: 'email', issue: 'formato inválido' }];
    const error = fromServerError(400, envelope('validation_failed', { details }), null);
    expect(error.details).toEqual(details);
  });

  it('ignora detalles mal formados', () => {
    const error = fromServerError(400, envelope('validation_failed', { details: 'x' }), null);
    expect(error.details).toEqual([]);
  });

  it('usa el requestId enviado si el servidor no lo incluye o es null', () => {
    expect(fromServerError(404, envelope('not_found'), 'enviado').requestId).toBe('enviado');
    expect(
      fromServerError(404, envelope('not_found', { requestId: null }), 'enviado').requestId,
    ).toBe('enviado');
  });

  it('usa el mensaje de i18n si el servidor manda uno vacío', () => {
    const error = fromServerError(404, { error: { code: 'not_found', message: '  ' } }, null);
    expect(error.message).toBe(es.errors.not_found);
  });
});

describe('fromServerError sin envoltorio válido', () => {
  it.each<[number, string]>([
    [400, 'validation_failed'],
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [404, 'not_found'],
    [409, 'conflict'],
    [422, 'validation_failed'],
    [429, 'rate_limited'],
    [500, 'internal_error'],
    [502, 'internal_error'],
    [503, 'service_unavailable'],
    [504, 'internal_error'],
    [418, 'internal_error'],
  ])('deriva el código del estado %i → %s', (status, code) => {
    const error = fromServerError(status, null, 'enviado');
    expect(error.code).toBe(code);
    expect(error.status).toBe(status);
    expect(error.requestId).toBe('enviado');
    expect(error.message).toBe(es.errors[code as keyof typeof es.errors]);
  });

  it.each<[string, unknown]>([
    ['cuerpo vacío', null],
    ['texto', '<html>Bad Gateway</html>'],
    ['arreglo', []],
    ['objeto sin error', { message: 'x' }],
    ['error sin código', { error: { message: 'x' } }],
    ['código desconocido', envelope('algo_raro')],
  ])('trata %s como cuerpo sin envoltorio', (_name, body) => {
    const error = fromServerError(404, body, null);
    expect(error.code).toBe('not_found');
    expect(error.message).toBe(es.errors.not_found);
    expect(error.details).toEqual([]);
  });
});

describe('newRequestId', () => {
  it('devuelve 32 caracteres hexadecimales', () => {
    for (let i = 0; i < 50; i += 1) expect(newRequestId()).toMatch(/^[0-9a-f]{32}$/);
  });

  it('cumple el formato permitido por el contrato (≤ 64 alfanuméricos y guiones)', () => {
    expect(newRequestId()).toMatch(/^[A-Za-z0-9-]{1,64}$/);
  });

  it('no repite valores en 1000 llamadas', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => newRequestId()));
    expect(ids.size).toBe(1000);
  });

  it('es determinista con Math.random simulado', () => {
    const spy = jest.spyOn(Math, 'random').mockReturnValue(0.999);
    expect(newRequestId()).toBe('f'.repeat(32));
    spy.mockReturnValue(0);
    expect(newRequestId()).toBe('0'.repeat(32));
    spy.mockRestore();
  });
});
