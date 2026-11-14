import { es } from '@/i18n/es-MX';

// Fechas de los avisos (Art. V.2): se agrupan por día y se muestran en la zona del dispositivo.

const LOCALE = 'es-MX';
const MINUTE_MS = 60_000;
const t = es.notifications;

function toDate(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Día del dispositivo `AAAA-MM-DD` de una fecha ISO; cadena vacía si es inválida. */
export function dayKey(iso: string): string {
  const date = toDate(iso);
  if (date === null) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** «Hoy», «Ayer» o la fecha completa del día de un aviso. */
export function dayLabel(iso: string, now: Date = new Date()): string {
  const key = dayKey(iso);
  if (key === '') return '';
  if (key === dayKey(now.toISOString())) return t.center.today;
  const yesterday = new Date(now.getTime());
  yesterday.setDate(yesterday.getDate() - 1);
  if (key === dayKey(yesterday.toISOString())) return t.center.yesterday;
  const date = toDate(iso);
  if (date === null) return '';
  return new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' }).format(
    date,
  );
}

/** «Ahora» (< 1 min), «hace N min» (< 1 h) o la hora del día. */
export function timeLabel(iso: string, now: Date = new Date()): string {
  const date = toDate(iso);
  if (date === null) return '';
  const minutes = Math.floor((now.getTime() - date.getTime()) / MINUTE_MS);
  if (minutes < 1) return t.time.now;
  if (minutes < 60) return `${t.time.ago} ${minutes} ${t.time.minutesAgo}`;
  return new Intl.DateTimeFormat(LOCALE, { hour: 'numeric', minute: '2-digit' }).format(date);
}

export type DaySection<T> = { key: string; title: string; data: T[] };

/** Agrupa avisos (ya ordenados, más nuevos primero) por día conservando el orden. */
export function groupByDay<T extends { createdAt: string }>(
  items: readonly T[],
  now: Date = new Date(),
): DaySection<T>[] {
  const sections: DaySection<T>[] = [];
  for (const item of items) {
    const key = dayKey(item.createdAt);
    const last = sections.at(-1);
    if (last !== undefined && last.key === key) last.data.push(item);
    else sections.push({ key, title: dayLabel(item.createdAt, now), data: [item] });
  }
  return sections;
}
