import {
  addDaysYmd,
  dateToYmd,
  diffDaysYmd,
  formatDate,
  formatDateTime,
  formatMonthYear,
  formatYmd,
  isYmd,
  todayYmd,
  ymdToDate,
} from '@/lib/format/date';
import { formatMXN, fromCents, toCents } from '@/lib/format/money';

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

describe('toCents / fromCents', () => {
  it.each([
    ['90', 9000],
    ['90.5', 9050],
    ['90.50', 9050],
    ['0.05', 5],
    ['.5', 50],
    ['1,234.56', 123_456],
    ['  12 ', 1200],
    ['12.', 1200],
    ['0', 0],
  ])('convierte «%s» a %i centavos', (text, cents) => {
    expect(toCents(text)).toBe(cents);
  });

  it.each(['', '.', 'abc', '12.345', '-5', '1e3', '12,3,4x', '1234567890'])(
    'rechaza «%s» sin redondear en silencio',
    (text) => {
      expect(toCents(text)).toBeNull();
    },
  );

  it('redondea un número de pesos al centavo más cercano', () => {
    expect(toCents(1.005)).toBe(101);
    expect(toCents(19.99)).toBe(1999);
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(toCents(30)).toBe(3000);
  });

  it('rechaza números negativos o no finitos', () => {
    expect(toCents(-1)).toBeNull();
    expect(toCents(Number.NaN)).toBeNull();
    expect(toCents(Number.POSITIVE_INFINITY)).toBeNull();
  });

  it('fromCents da pesos para editar, sin símbolo', () => {
    expect(fromCents(9000)).toBe('90');
    expect(fromCents(9050)).toBe('90.50');
    expect(fromCents(5)).toBe('0.05');
    expect(fromCents(0)).toBe('0');
  });

  it('fromCents devuelve vacío con entradas inválidas', () => {
    expect(fromCents(1.5)).toBe('');
    expect(fromCents(-1)).toBe('');
  });

  it('ida y vuelta conserva los centavos', () => {
    for (const cents of [0, 1, 99, 100, 101, 12_345, 10_000_000]) {
      expect(toCents(fromCents(cents))).toBe(cents);
    }
  });
});

describe('fechas de calendario YYYY-MM-DD', () => {
  it('valida fechas reales y rechaza las imposibles', () => {
    expect(isYmd('2026-11-09')).toBe(true);
    expect(isYmd('2028-02-29')).toBe(true);
    expect(isYmd('2026-02-30')).toBe(false);
    expect(isYmd('2026-13-01')).toBe(false);
    expect(isYmd('09/11/2026')).toBe(false);
    expect(isYmd('')).toBe(false);
  });

  it('calcula «hoy» en la Ciudad de México, no en UTC', () => {
    // 01:30 UTC del día 10 sigue siendo el día 9 a las 19:30 en CDMX.
    expect(todayYmd(new Date('2026-11-10T01:30:00Z'))).toBe('2026-11-09');
    expect(todayYmd(new Date('2026-11-10T07:00:00Z'))).toBe('2026-11-10');
  });

  it('suma días y calcula diferencias a través de fin de mes y año bisiesto', () => {
    expect(addDaysYmd('2026-11-28', 5)).toBe('2026-12-03');
    expect(addDaysYmd('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDaysYmd('xx', 1)).toBe('');
    expect(diffDaysYmd('2026-11-09', '2026-11-16')).toBe(7);
    expect(diffDaysYmd('2026-11-09', '2026-11-08')).toBe(-1);
    expect(diffDaysYmd('xx', '2026-11-08')).toBeNaN();
  });

  it('convierte entre Date local y YYYY-MM-DD sin saltar de día', () => {
    expect(dateToYmd(new Date(2026, 10, 9, 23, 59))).toBe('2026-11-09');
    expect(dateToYmd(ymdToDate('2026-11-09'))).toBe('2026-11-09');
    expect(Number.isNaN(ymdToDate('nope').getTime())).toBe(true);
  });

  it('da formato es-MX a la fecha de calendario', () => {
    expect(formatYmd('2026-11-09')).toBe('9 de noviembre de 2026');
    expect(formatYmd('2026-02-30')).toBe('');
  });
});
