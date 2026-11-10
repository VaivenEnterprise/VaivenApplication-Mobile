import { formatDate, formatDateTime, formatMonthYear } from '@/lib/format/date';
import { formatMXN } from '@/lib/format/money';

// Intl puede insertar espacios no separables según la plataforma.
const normalize = (text: string): string => text.replace(/\s/g, ' ');

describe('formatMXN', () => {
  it.each<[number, string]>([
    [12345, '$123.45'],
    [0, '$0.00'],
    [100, '$1.00'],
    [5, '$0.05'],
    [123456789, '$1,234,567.89'],
    [-5000, '-$50.00'],
  ])('formatea %i centavos como %s', (cents, expected) => {
    expect(normalize(formatMXN(cents))).toBe(expected);
  });

  it.each<[string, number]>([
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['decimales', 10.5],
    ['fuera del rango seguro', Number.MAX_SAFE_INTEGER + 2],
  ])('devuelve cadena vacía para %s sin lanzar', (_name, value) => {
    expect(formatMXN(value)).toBe('');
  });

  it('devuelve cadena vacía si llega algo que no es número', () => {
    expect(formatMXN(undefined as unknown as number)).toBe('');
  });
});

describe('formatDate y formatDateTime', () => {
  const ISO = '2026-11-10T00:05:00Z';
  const ZONE = 'America/Mexico_City';

  it('convierte de UTC a la zona indicada (el día puede cambiar)', () => {
    expect(normalize(formatDate(ISO, ZONE))).toBe('9 de noviembre de 2026');
    expect(normalize(formatDate(ISO, 'UTC'))).toBe('10 de noviembre de 2026');
  });

  it('incluye la hora local en formatDateTime', () => {
    const text = normalize(formatDateTime(ISO, ZONE));
    expect(text).toContain('9 de noviembre de 2026');
    expect(text).toMatch(/6:05/);
    expect(text).toMatch(/p\.\s?m\./);
  });

  it('usa la zona del dispositivo cuando no se indica ninguna', () => {
    expect(formatDate(ISO)).toMatch(/de noviembre de 2026$/);
    expect(formatDateTime(ISO)).toMatch(/2026/);
  });

  it.each<[string, string]>([
    ['cadena vacía', ''],
    ['solo espacios', '   '],
    ['texto que no es fecha', 'no-es-fecha'],
    ['fecha imposible', '2026-13-45T99:99:99Z'],
  ])('devuelve cadena vacía para %s sin lanzar', (_name, value) => {
    expect(formatDate(value)).toBe('');
    expect(formatDateTime(value)).toBe('');
  });

  it('devuelve cadena vacía si llega algo que no es texto', () => {
    expect(formatDate(undefined as unknown as string)).toBe('');
    expect(formatDateTime(null as unknown as string)).toBe('');
  });

  it('no lanza con una zona horaria inválida', () => {
    expect(formatDate(ISO, 'Zona/Inexistente')).toBe('');
    expect(formatDateTime(ISO, 'Zona/Inexistente')).toBe('');
  });
});

describe('formatMonthYear', () => {
  it('muestra mes y año en español', () => {
    expect(normalize(formatMonthYear('2026-11-10T01:30:00Z', 'America/Mexico_City'))).toBe(
      'noviembre de 2026',
    );
  });

  it('con una fecha inválida devuelve cadena vacía', () => {
    expect(formatMonthYear('no-es-fecha')).toBe('');
    expect(formatMonthYear('')).toBe('');
  });
});
