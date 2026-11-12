// Las fechas viajan en UTC (ISO-8601); aquí se muestran en la zona horaria del
// dispositivo con formato es-MX (Art. V.2). `timeZone` es opcional y sirve para
// pruebas deterministas.

const LOCALE = 'es-MX';

function toDate(iso: string): Date | null {
  if (typeof iso !== 'string' || iso.trim() === '') return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function format(iso: string, options: Intl.DateTimeFormatOptions): string {
  const date = toDate(iso);
  if (!date) return '';
  try {
    return new Intl.DateTimeFormat(LOCALE, options).format(date);
  } catch {
    // Zona horaria inválida u otro fallo de Intl: no se interrumpe la pantalla.
    return '';
  }
}

/** Ej.: «9 de noviembre de 2026». Entrada inválida → cadena vacía. */
export function formatDate(iso: string, timeZone?: string): string {
  return format(iso, { day: 'numeric', month: 'long', year: 'numeric', timeZone });
}

/** Ej.: «9 de noviembre de 2026 a las 6:05 p.m.». Entrada inválida → cadena vacía. */
export function formatDateTime(iso: string, timeZone?: string): string {
  return format(iso, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  });
}

/** Ej.: «noviembre de 2026» (para «En Vaivén desde …»). Entrada inválida → cadena vacía. */
export function formatMonthYear(iso: string, timeZone?: string): string {
  return format(iso, { month: 'long', year: 'numeric', timeZone });
}

// --- Fechas de calendario `YYYY-MM-DD` (Art. V.2): disponibilidad y filtros, sin hora. ---

const YMD_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MEXICO_CITY = 'America/Mexico_City';
const DAY_MS = 86_400_000;
/** México no tiene horario de verano desde 2022: la hora local es UTC-6 todo el año. */
const MEXICO_OFFSET_MS = 6 * 3_600_000;

function ymdToUtc(ymd: string): number {
  const match = YMD_PATTERN.exec(ymd);
  if (match === null) return Number.NaN;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const time = Date.UTC(year, month - 1, day);
  const check = new Date(time);
  const valid =
    check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day;
  return valid ? time : Number.NaN;
}

/** `true` si es una fecha real con forma `YYYY-MM-DD` (rechaza «2026-02-30»). */
export function isYmd(value: string): boolean {
  return !Number.isNaN(ymdToUtc(value));
}

/** Hoy en la Ciudad de México como `YYYY-MM-DD` (el servidor valida `from ≥ hoy` en esa zona). */
export function todayYmd(now: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: MEXICO_CITY,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
    const value = `${pick('year')}-${pick('month')}-${pick('day')}`;
    if (isYmd(value)) return value;
  } catch {
    // Sin Intl para esa zona: se usa el desfase fijo.
  }
  return new Date(now.getTime() - MEXICO_OFFSET_MS).toISOString().slice(0, 10);
}

/** Suma (o resta) días a una fecha de calendario. Entrada inválida → cadena vacía. */
export function addDaysYmd(ymd: string, days: number): string {
  const time = ymdToUtc(ymd);
  return Number.isNaN(time) ? '' : new Date(time + days * DAY_MS).toISOString().slice(0, 10);
}

/** Días de `from` a `to` (negativo si `to` es anterior). Entrada inválida → `NaN`. */
export function diffDaysYmd(from: string, to: string): number {
  return Math.round((ymdToUtc(to) - ymdToUtc(from)) / DAY_MS);
}

/** Fecha del selector (hora local del teléfono) → `YYYY-MM-DD`. */
export function dateToYmd(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** `YYYY-MM-DD` → `Date` al mediodía local, para entregarlo al selector sin saltos de día. */
export function ymdToDate(ymd: string): Date {
  const time = ymdToUtc(ymd);
  if (Number.isNaN(time)) return new Date(Number.NaN);
  const base = new Date(time);
  return new Date(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), 12);
}

/** Ej.: «9 de noviembre de 2026» a partir de `2026-11-09`. Entrada inválida → cadena vacía. */
export function formatYmd(ymd: string): string {
  return isYmd(ymd) ? formatDate(`${ymd}T12:00:00Z`, 'UTC') : '';
}
