const HEX = '0123456789abcdef';
const REQUEST_ID_LENGTH = 32;

/**
 * Identificador de correlación para `X-Request-Id`: 32 caracteres hexadecimales.
 * Usa `Math.random` a propósito: no es un secreto ni un token, solo sirve para
 * relacionar una petición con los registros del servidor (plan P-05).
 */
export function newRequestId(): string {
  let id = '';
  for (let i = 0; i < REQUEST_ID_LENGTH; i += 1) {
    id += HEX.charAt(Math.floor(Math.random() * HEX.length));
  }
  return id;
}
