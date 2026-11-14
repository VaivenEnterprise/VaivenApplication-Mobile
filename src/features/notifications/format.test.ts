import { dayKey, dayLabel, groupByDay, timeLabel } from '@/features/notifications/format';

// Mediodía local: no cruza de día en ninguna zona horaria.
const NOW = new Date(2026, 10, 17, 12, 0, 0);
const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 10, day, hour, minute, 0).toISOString();

describe('dayLabel', () => {
  it('llama «Hoy» al día actual y «Ayer» al anterior', () => {
    expect(dayLabel(at(17, 8), NOW)).toBe('Hoy');
    expect(dayLabel(at(16, 23), NOW)).toBe('Ayer');
  });

  it('muestra la fecha completa para días anteriores', () => {
    expect(dayLabel(at(10, 9), NOW)).toBe('10 de noviembre de 2026');
  });

  it('devuelve vacío con una fecha inválida', () => {
    expect(dayLabel('no-es-fecha', NOW)).toBe('');
    expect(dayKey('no-es-fecha')).toBe('');
  });
});

describe('timeLabel', () => {
  it('usa «Ahora» y «hace N min» para lo reciente', () => {
    expect(timeLabel(new Date(NOW.getTime() - 30_000).toISOString(), NOW)).toBe('Ahora');
    expect(timeLabel(at(17, 11, 30), NOW)).toBe('hace 30 min');
  });

  it('usa la hora del día después de una hora', () => {
    expect(timeLabel(at(17, 9, 5), NOW)).toMatch(/9:05/);
  });

  it('devuelve vacío con una fecha inválida', () => {
    expect(timeLabel('no-es-fecha', NOW)).toBe('');
  });
});

describe('groupByDay', () => {
  it('agrupa por día conservando el orden', () => {
    const items = [
      { id: 'a', createdAt: at(17, 10) },
      { id: 'b', createdAt: at(17, 9) },
      { id: 'c', createdAt: at(16, 20) },
      { id: 'd', createdAt: at(10, 8) },
    ];
    const sections = groupByDay(items, NOW);
    expect(sections.map((s) => s.title)).toEqual(['Hoy', 'Ayer', '10 de noviembre de 2026']);
    expect(sections.map((s) => s.data.map((i) => i.id))).toEqual([['a', 'b'], ['c'], ['d']]);
  });

  it('con una lista vacía no hay secciones', () => {
    expect(groupByDay([], NOW)).toEqual([]);
  });
});
