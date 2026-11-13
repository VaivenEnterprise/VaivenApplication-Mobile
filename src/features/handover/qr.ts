import type { StageName } from '@/features/handover/types';
import { STAGE_NAMES } from '@/features/handover/types';

// Análisis del código QR de entrega o devolución (plan P-02, RF-05). Función pura: no toca la red
// ni guarda nada (RF-11). El texto del QR es `vaiven://qr?b=<reserva>&s=<etapa>&t=<token>`. Se lee
// a mano porque `URLSearchParams` de React Native no lo implementa por completo y así la prueba no
// necesita módulos nativos.

export type QrFailure = 'not_vaiven' | 'wrong_booking' | 'wrong_stage' | 'malformed';
export type QrParse = { ok: true; token: string } | { ok: false; error: QrFailure };

type Expected = { bookingId: string; stage: StageName };

const PREFIX = 'vaiven://qr?';
/** 32 bytes en base64url son 43 caracteres; se aceptan márgenes por si el servidor cambia. */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;

const fail = (error: QrFailure): QrParse => ({ ok: false, error });

function readParams(query: string): Map<string, string> | null {
  const params = new Map<string, string>();
  for (const pair of query.split('&')) {
    if (pair === '') continue;
    const at = pair.indexOf('=');
    if (at <= 0) return null;
    try {
      const key = decodeURIComponent(pair.slice(0, at));
      const value = decodeURIComponent(pair.slice(at + 1));
      if (params.has(key)) return null;
      params.set(key, value);
    } catch {
      return null;
    }
  }
  return params;
}

/** Valida el texto leído por la cámara contra la reserva y la etapa abiertas. */
export function parseQr(text: string, expected: Expected): QrParse {
  const clean = text.trim();
  if (!clean.toLowerCase().startsWith(PREFIX) && clean.toLowerCase() !== 'vaiven://qr') {
    return fail('not_vaiven');
  }
  const params = readParams(clean.slice(PREFIX.length));
  if (params === null) return fail('malformed');
  const booking = params.get('b');
  const stage = params.get('s');
  const token = params.get('t');
  if (!booking || !stage || !token) return fail('malformed');
  if (!STAGE_NAMES.some((name) => name === stage)) return fail('malformed');
  if (!TOKEN_PATTERN.test(token)) return fail('malformed');
  if (booking !== expected.bookingId) return fail('wrong_booking');
  if (stage !== expected.stage) return fail('wrong_stage');
  return { ok: true, token };
}

/**
 * Código escrito a mano (CA-07): puede ser solo el token que la otra persona lee en pantalla o el
 * texto completo del QR, que se valida igual que el escaneado.
 */
export function parseManualCode(text: string, expected: Expected): QrParse {
  const clean = text.trim();
  if (clean.toLowerCase().startsWith('vaiven://')) return parseQr(clean, expected);
  return TOKEN_PATTERN.test(clean) ? { ok: true, token: clean } : fail('malformed');
}
