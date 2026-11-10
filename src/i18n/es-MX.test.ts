import { es } from '@/i18n/es-MX';
import { API_ERROR_CODES } from '@/lib/api/errors';

describe('textos es-MX', () => {
  it.each([...API_ERROR_CODES])('tiene un mensaje para el código %s', (code) => {
    expect(es.errors[code].trim().length).toBeGreaterThan(0);
  });

  it('incluye los mensajes genéricos unexpected y config', () => {
    expect(es.errors.unexpected).not.toBe('');
    expect(es.errors.config).not.toBe('');
  });

  it('tiene las secciones del plan §4.3', () => {
    expect(Object.keys(es).sort()).toEqual([
      'brand',
      'common',
      'configError',
      'diagnostics',
      'errors',
      'home',
      'notFound',
      'ui',
    ]);
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
