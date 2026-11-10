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
