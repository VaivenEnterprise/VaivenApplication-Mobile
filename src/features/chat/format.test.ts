import { dayLabel, formatClock, listTime } from '@/features/chat/format';

const NOW = new Date(2026, 10, 12, 15, 0, 0); // 12 nov 2026, hora local
const at = (day: number, hour: number, minute = 5) =>
  new Date(2026, 10, day, hour, minute, 0).toISOString();
const plain = (text: string) => text.replace(/\s/g, ' ');

describe('formatClock', () => {
  it('muestra la hora en es-MX', () => {
    expect(plain(formatClock(at(12, 18)))).toMatch(/^6:05 p\.\s?m\.$/);
  });

  it('una fecha inválida da cadena vacía', () => {
    expect(formatClock('x')).toBe('');
  });
});

describe('dayLabel', () => {
  it('dice Hoy, Ayer o la fecha corta', () => {
    expect(dayLabel(at(12, 1), NOW)).toBe('Hoy');
    expect(dayLabel(at(11, 23), NOW)).toBe('Ayer');
    expect(dayLabel(at(3, 10), NOW)).toBe('3 nov');
  });

  it('Ayer funciona al cruzar de mes', () => {
    const first = new Date(2026, 11, 1, 9, 0, 0);
    expect(dayLabel(new Date(2026, 10, 30, 20, 0, 0).toISOString(), first)).toBe('Ayer');
  });

  it('usa la fecha actual cuando no se da `now`', () => {
    expect(dayLabel(new Date().toISOString())).toBe('Hoy');
  });

  it('una fecha inválida da cadena vacía', () => {
    expect(dayLabel('x', NOW)).toBe('');
  });
});

describe('listTime', () => {
  it('hoy muestra la hora; antes, Ayer o la fecha', () => {
    expect(plain(listTime(at(12, 9), NOW))).toMatch(/^9:05 a\.\s?m\.$/);
    expect(listTime(at(11, 9), NOW)).toBe('Ayer');
    expect(listTime(at(1, 9), NOW)).toBe('1 nov');
    expect(listTime('x', NOW)).toBe('');
    expect(listTime(new Date().toISOString())).not.toBe('');
  });
});
