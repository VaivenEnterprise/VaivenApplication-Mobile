import { es } from '@/i18n/es-MX';
import { dayKey } from '@/features/chat/merge';

// Horas y días del chat en la zona horaria del dispositivo (Art. V.2), con `Intl` es-MX.

const LOCALE = 'es-MX';

function toDate(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Ej.: «6:05 p.m.». Fecha inválida → cadena vacía. */
export function formatClock(iso: string): string {
  const date = toDate(iso);
  if (date === null) return '';
  return new Intl.DateTimeFormat(LOCALE, { hour: 'numeric', minute: '2-digit' }).format(date);
}

function shortDate(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' })
    .format(date)
    .replace(/\./g, '');
}

function sameOrOffsetDay(iso: string, now: Date, offsetDays: number): boolean {
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offsetDays, 12);
  return dayKey(iso) === dayKey(target.toISOString());
}

/** «Hoy», «Ayer» o «12 nov» (separadores de día, spec §7.2). */
export function dayLabel(iso: string, now: Date = new Date()): string {
  const date = toDate(iso);
  if (date === null) return '';
  if (sameOrOffsetDay(iso, now, 0)) return es.chat.day.today;
  if (sameOrOffsetDay(iso, now, 1)) return es.chat.day.yesterday;
  return shortDate(date);
}

/** Hora del último mensaje en la lista: la hora si es de hoy, si no «Ayer» o «12 nov». */
export function listTime(iso: string, now: Date = new Date()): string {
  const date = toDate(iso);
  if (date === null) return '';
  return sameOrOffsetDay(iso, now, 0) ? formatClock(iso) : dayLabel(iso, now);
}
