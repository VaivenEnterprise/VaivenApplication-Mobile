import { addDaysYmd, diffDaysYmd, isYmd, todayYmd } from '@/lib/format/date';
import { es } from '@/i18n/es-MX';

// Utilidades de fechas de calendario `YYYY-MM-DD` (plan P-01, Art. V). Nunca pasan por `Date` con
// la zona del teléfono: la reserva se rige por el calendario de la Ciudad de México.

const t = es.bookings;

/** Suma (o resta) días a una fecha. Entrada inválida → cadena vacía. */
export const addDays = addDaysYmd;

/** Días de un periodo contando ambos extremos: del 12 al 14 son 3. Inválido → `NaN`. */
export function diffDaysInclusive(start: string, end: string): number {
  return diffDaysYmd(start, end) + 1;
}

/** `true` si la fecha es anterior a `today` (por defecto, hoy en la Ciudad de México). */
export function isPast(ymd: string, today: string = todayYmd()): boolean {
  return isYmd(ymd) && isYmd(today) && ymd < today;
}

/** Día de la semana de una fecha de calendario: 0 = domingo … 6 = sábado. */
export function weekday(ymd: string): number {
  const [year, month, day] = ymd.split('-').map(Number);
  return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1)).getUTCDay();
}

export type DateRange = { start: string; end: string };

/** Atajos de «¿Cuándo?»: hoy, mañana y el próximo fin de semana (o lo que queda de él). */
export function presetRanges(today: string): {
  today: DateRange;
  tomorrow: DateRange;
  weekend: DateRange;
} {
  const day = weekday(today);
  let start = today;
  let end = today;
  if (day === 6) end = addDays(today, 1);
  else if (day !== 0) {
    start = addDays(today, 6 - day);
    end = addDays(start, 1);
  }
  return {
    today: { start: today, end: today },
    tomorrow: { start: addDays(today, 1), end: addDays(today, 1) },
    weekend: { start, end },
  };
}

const monthOf = (ymd: string): string => t.months[Number(ymd.slice(5, 7)) - 1] ?? '';
const dayOf = (ymd: string): number => Number(ymd.slice(8, 10));

/** «12 nov», «12–14 nov» o «30 nov – 2 dic». Entrada inválida → cadena vacía. */
export function formatRange(start: string, end: string): string {
  if (!isYmd(start) || !isYmd(end)) return '';
  if (start === end) return `${dayOf(start)} ${monthOf(start)}`;
  if (start.slice(0, 7) === end.slice(0, 7))
    return `${dayOf(start)}–${dayOf(end)} ${monthOf(start)}`;
  return `${dayOf(start)} ${monthOf(start)} – ${dayOf(end)} ${monthOf(end)}`;
}

/** «3 días» o «1 día». */
export function daysLabel(days: number): string {
  return `${days} ${days === 1 ? t.days.one : t.days.many}`;
}
