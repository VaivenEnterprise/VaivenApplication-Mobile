// Identificador de cliente de un mensaje (plan P-05): UUID v4 sin dependencias nuevas. No es un
// secreto: solo sirve para que reintentar un envío no duplique el mensaje (idempotencia).

const HEX = '0123456789abcdef';

function randomBytes(length: number): number[] {
  const bytes = new Uint8Array(length);
  const webCrypto = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } })
    .crypto;
  if (webCrypto?.getRandomValues !== undefined) {
    webCrypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes);
}

/** UUID v4 en minúsculas (36 caracteres; el backend acepta hasta 64). */
export function newClientId(): string {
  const bytes = randomBytes(16);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  let out = '';
  bytes.forEach((byte, index) => {
    if (index === 4 || index === 6 || index === 8 || index === 10) out += '-';
    out += HEX[byte >> 4]! + HEX[byte & 0x0f]!;
  });
  return out;
}
