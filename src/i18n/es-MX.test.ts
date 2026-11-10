import { es } from '@/i18n/es-MX';

// Debe coincidir con `ApiErrorCode` (constitución Art. IV y skill react-query-api-client).
// T010 reforzará esta correspondencia con tipos.
const API_ERROR_CODES = [
  'validation_failed',
  'unauthorized',
  'forbidden',
  'not_found',
  'conflict',
  'rate_limited',
  'internal_error',
  'service_unavailable',
  'network_error',
  'timeout',
  'invalid_response',
] as const;

describe('textos es-MX', () => {
  it.each(API_ERROR_CODES)('tiene un mensaje para el código %s', (code) => {
    expect(es.errors[code].trim().length).toBeGreaterThan(0);
  });

  it('incluye los mensajes genéricos unexpected y config', () => {
    expect(es.errors.unexpected).not.toBe('');
    expect(es.errors.config).not.toBe('');
  });

  it('tiene las secciones del plan §4.3', () => {
    expect(Object.keys(es).sort()).toEqual(['common', 'diagnostics', 'errors', 'home', 'notFound']);
  });

  it('no deja textos vacíos ni con marcadores pendientes', () => {
    const texts: string[] = [];
    const collect = (value: unknown): void => {
      if (typeof value === 'string') texts.push(value);
      else if (value && typeof value === 'object') Object.values(value).forEach(collect);
    };
    collect(es);
    expect(texts.length).toBeGreaterThan(0);
    for (const text of texts) {
      expect(text.trim()).not.toBe('');
      expect(text).not.toMatch(/TODO|XXX|lorem/i);
    }
  });
});
