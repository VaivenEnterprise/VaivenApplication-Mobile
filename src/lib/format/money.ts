const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

/**
 * Muestra un importe en pesos mexicanos a partir de centavos enteros (Art. V.1).
 * Solo sirve para mostrar: nunca se opera con el resultado.
 * Una entrada que no sea un entero seguro devuelve una cadena vacía.
 */
export function formatMXN(cents: number): string {
  if (!Number.isSafeInteger(cents)) return '';
  return mxn.format(cents / 100);
}

/** Enteros máximos al capturar pesos: 9 dígitos (hasta $999,999,999) caben sobrados en un entero seguro. */
const MAX_PESO_DIGITS = 9;

/**
 * Convierte pesos escritos por una persona («1,234.5») a centavos enteros (Art. V.1). Acepta como
 * máximo 2 decimales; con más, o con texto que no sea un importe, devuelve `null` (nunca redondea
 * en silencio lo que la persona escribió). También acepta un número de pesos, que sí se redondea.
 */
export function toCents(pesos: string | number): number | null {
  if (typeof pesos === 'number') {
    if (!Number.isFinite(pesos) || pesos < 0) return null;
    const cents = Math.round(Number((pesos * 100).toPrecision(15)));
    return Number.isSafeInteger(cents) ? cents : null;
  }
  const clean = pesos.trim().replace(/,/g, '');
  const match = /^(\d*)(?:\.(\d{0,2}))?$/.exec(clean);
  if (match === null) return null;
  const whole = match[1] ?? '';
  // Debe haber al menos un dígito: «.» y «» no son importes («.5» sí: 50 centavos).
  if (whole === '' && (match[2] ?? '') === '') return null;
  if (whole.length > MAX_PESO_DIGITS) return null;
  const fraction = (match[2] ?? '').padEnd(2, '0');
  return Number(whole) * 100 + Number(fraction);
}

/** Pesos para editar en un campo: «90» si es redondo y «90.50» si no (sin símbolo ni miles). */
export function fromCents(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents < 0) return '';
  const whole = Math.floor(cents / 100);
  const rest = cents % 100;
  return rest === 0 ? String(whole) : `${whole}.${String(rest).padStart(2, '0')}`;
}
