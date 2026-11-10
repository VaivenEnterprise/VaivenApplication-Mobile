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
