import { parseManualCode, parseQr } from '@/features/handover/qr';

const BOOKING = '6731b1b2c3d4e5f6a7b8c9d0';
const TOKEN = 'Zm9vYmFyYmF6cXV4MTIzNDU2Nzg5MC1fYWJjZGVmZ2g';
const expected = { bookingId: BOOKING, stage: 'delivery' } as const;
const payload = (b: string, s: string, t: string) => `vaiven://qr?b=${b}&s=${s}&t=${t}`;

describe('parseQr', () => {
  it('acepta un código de esta reserva y etapa y devuelve el token', () => {
    expect(parseQr(payload(BOOKING, 'delivery', TOKEN), expected)).toEqual({
      ok: true,
      token: TOKEN,
    });
  });

  it('acepta el orden distinto de los parámetros y espacios alrededor', () => {
    expect(parseQr(`  vaiven://qr?t=${TOKEN}&s=delivery&b=${BOOKING}  `, expected)).toEqual({
      ok: true,
      token: TOKEN,
    });
  });

  it('CA-02: rechaza un código de otra reserva', () => {
    expect(parseQr(payload('6731b1b2c3d4e5f6a7b8c9ff', 'delivery', TOKEN), expected)).toEqual({
      ok: false,
      error: 'wrong_booking',
    });
  });

  it('rechaza un código de otra etapa', () => {
    expect(parseQr(payload(BOOKING, 'return', TOKEN), expected)).toEqual({
      ok: false,
      error: 'wrong_stage',
    });
  });

  it.each([
    ['https://example.com/promo?b=1', 'otro sitio'],
    ['vaiven://otra?b=1', 'otra ruta de Vaivén'],
    ['hola', 'texto suelto'],
    ['', 'vacío'],
  ])('rechaza %s (%s) como no Vaivén', (text) => {
    expect(parseQr(text, expected)).toEqual({ ok: false, error: 'not_vaiven' });
  });

  it.each([
    ['vaiven://qr', 'sin consulta'],
    ['vaiven://qr?', 'consulta vacía'],
    [`vaiven://qr?b=${BOOKING}&s=delivery`, 'sin token'],
    [`vaiven://qr?s=delivery&t=${TOKEN}`, 'sin reserva'],
    [`vaiven://qr?b=${BOOKING}&t=${TOKEN}`, 'sin etapa'],
    [payload(BOOKING, 'otra', TOKEN), 'etapa desconocida'],
    [payload(BOOKING, 'delivery', 'corto'), 'token demasiado corto'],
    [payload(BOOKING, 'delivery', 'a b c d e f g h i j k l m n o p'), 'token con espacios'],
    [`vaiven://qr?b=${BOOKING}&b=${BOOKING}&s=delivery&t=${TOKEN}`, 'parámetro repetido'],
    [`vaiven://qr?b=%E0%A4%A&s=delivery&t=${TOKEN}`, 'codificación rota'],
  ])('%s (%s) está mal formado', (text) => {
    expect(parseQr(text, expected)).toEqual({ ok: false, error: 'malformed' });
  });
});

describe('parseManualCode', () => {
  it('acepta el token escrito a mano', () => {
    expect(parseManualCode(`  ${TOKEN} `, expected)).toEqual({ ok: true, token: TOKEN });
  });

  it('también acepta el texto completo del QR y lo valida', () => {
    expect(parseManualCode(payload(BOOKING, 'delivery', TOKEN), expected)).toEqual({
      ok: true,
      token: TOKEN,
    });
    expect(parseManualCode(payload(BOOKING, 'return', TOKEN), expected)).toEqual({
      ok: false,
      error: 'wrong_stage',
    });
  });

  it.each(['', '   ', 'corto', 'con espacios en medio del código que es largo'])(
    'rechaza «%s»',
    (text) => {
      expect(parseManualCode(text, expected)).toEqual({ ok: false, error: 'malformed' });
    },
  );
});
