import {
  addDays,
  daysLabel,
  diffDaysInclusive,
  formatRange,
  isPast,
  presetRanges,
  weekday,
} from '@/features/bookings/dates';

describe('fechas de reservas (YYYY-MM-DD, sin Date local)', () => {
  it('suma días a través de fin de mes, de año y bisiesto', () => {
    expect(addDays('2026-11-28', 5)).toBe('2026-12-03');
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-11-10', -10)).toBe('2026-10-31');
    expect(addDays('no', 1)).toBe('');
  });

  it.each<[string, string, number]>([
    ['2026-11-12', '2026-11-12', 1],
    ['2026-11-12', '2026-11-14', 3],
    ['2026-11-12', '2026-11-18', 7],
    ['2026-11-12', '2026-11-19', 8],
    ['2026-11-30', '2026-12-02', 3],
    ['2026-11-14', '2026-11-12', -1],
  ])('diffDaysInclusive(%s, %s) = %i', (start, end, expected) => {
    expect(diffDaysInclusive(start, end)).toBe(expected);
  });

  it('diffDaysInclusive de una fecha inválida es NaN', () => {
    expect(diffDaysInclusive('x', '2026-11-12')).toBeNaN();
  });

  it('isPast compara contra «hoy» sin considerar la hora', () => {
    expect(isPast('2026-11-11', '2026-11-12')).toBe(true);
    expect(isPast('2026-11-12', '2026-11-12')).toBe(false);
    expect(isPast('2026-11-13', '2026-11-12')).toBe(false);
    expect(isPast('basura', '2026-11-12')).toBe(false);
    expect(typeof isPast('2020-01-01')).toBe('boolean');
  });

  it('weekday da el día de la semana del calendario', () => {
    expect(weekday('2026-11-11')).toBe(3); // miércoles
    expect(weekday('2026-11-14')).toBe(6); // sábado
    expect(weekday('2026-11-15')).toBe(0); // domingo
  });

  it('atajos: hoy, mañana y el próximo fin de semana', () => {
    expect(presetRanges('2026-11-11')).toEqual({
      today: { start: '2026-11-11', end: '2026-11-11' },
      tomorrow: { start: '2026-11-12', end: '2026-11-12' },
      weekend: { start: '2026-11-14', end: '2026-11-15' },
    });
    expect(presetRanges('2026-11-14').weekend).toEqual({ start: '2026-11-14', end: '2026-11-15' });
    expect(presetRanges('2026-11-15').weekend).toEqual({ start: '2026-11-15', end: '2026-11-15' });
    expect(presetRanges('2026-11-13').weekend).toEqual({ start: '2026-11-14', end: '2026-11-15' });
  });

  it('da formato corto al periodo', () => {
    expect(formatRange('2026-11-12', '2026-11-14')).toBe('12–14 nov');
    expect(formatRange('2026-11-12', '2026-11-12')).toBe('12 nov');
    expect(formatRange('2026-11-30', '2026-12-02')).toBe('30 nov – 2 dic');
    expect(formatRange('x', '2026-11-12')).toBe('');
  });

  it('daysLabel usa singular y plural', () => {
    expect(daysLabel(1)).toBe('1 día');
    expect(daysLabel(3)).toBe('3 días');
  });
});
