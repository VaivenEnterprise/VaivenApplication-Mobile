import type { HandoverStage } from '@/features/bookings';
import type { QrToken } from '@/features/handover/types';

// Datos de prueba de la entrega y la devolución (spec 009). Una etapa «vacía» es la que devuelve
// el servidor mientras nadie ha registrado nada: campos vacíos y `qr.state: none`.

export const fakeStage = (over: Partial<HandoverStage> = {}): HandoverStage => ({
  recordedAt: null,
  recordedById: null,
  conditionNotes: '',
  photos: [],
  evidenceVersion: 0,
  qr: { state: 'none', expiresAt: null },
  confirmedAt: null,
  confirmedById: null,
  ...over,
});

export const fakePhoto = (n: number) => ({
  publicId: `vaiven/evidence/6731b1b2c3d4e5f6a7b8c9d0/${n}`,
  url: `https://img.test/evidence/${n}.jpg`,
  thumbUrl: `https://img.test/evidence/${n}-thumb.jpg`,
});

/** Etapa con evidencia registrada (versión 1) y, si se pide, un QR vigente. */
export const fakeRecordedStage = (over: Partial<HandoverStage> = {}): HandoverStage =>
  fakeStage({
    recordedAt: '2026-11-12T16:00:00Z',
    recordedById: '6730f1c2a9b3e4d5f6a7b8c9',
    conditionNotes: 'Taladro limpio, con estuche y dos brocas.',
    photos: [fakePhoto(1)],
    evidenceVersion: 1,
    ...over,
  });

export const FAKE_TOKEN = 'Zm9vYmFyYmF6cXV4MTIzNDU2Nzg5MC1fYWJjZGVmZ2g';

export const fakeQrToken = (
  bookingId: string,
  stage: 'delivery' | 'return',
  over: Partial<QrToken> = {},
): QrToken => ({
  token: FAKE_TOKEN,
  qrPayload: `vaiven://qr?b=${bookingId}&s=${stage}&t=${FAKE_TOKEN}`,
  expiresAt: '2026-11-12T18:15:00Z',
  ...over,
});
