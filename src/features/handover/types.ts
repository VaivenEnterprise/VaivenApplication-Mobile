import { z } from 'zod';
import type { Adjustment, HandoverStage } from '@/features/bookings';

// Contrato de entrega y devolución (backend 009: `Stage`, `QrToken`, `EvidenceRequest`). La etapa
// y el ajuste por retraso viven en `bookings/types.ts` porque forman parte de `Booking`; aquí solo
// se reexportan con los nombres del plan.

export const STAGE_NAMES = ['delivery', 'return'] as const;
export type StageName = (typeof STAGE_NAMES)[number];
export type Stage = HandoverStage;
export type { Adjustment };

/** Límites de la evidencia (backend: `EvidenceRequest`). */
export const EVIDENCE_NOTES_MIN = 3;
export const EVIDENCE_NOTES_MAX = 500;
export const EVIDENCE_PHOTOS_MAX = 5;

/** `POST …/qr`: el `token` solo viaja en esta respuesta y nunca se guarda (RF-11). */
export const qrTokenSchema = z.object({
  token: z.string().min(1),
  qrPayload: z.string().min(1),
  expiresAt: z.string(),
});
export type QrToken = z.infer<typeof qrTokenSchema>;

/** Cuerpo de `PUT …/evidence`: la evidencia reemplaza a la anterior. */
export type EvidenceInput = {
  conditionNotes: string;
  photos: { publicId: string }[];
};

/** Lee el parámetro `stage` de una ruta; cualquier otro valor es `null`. */
export function parseStageName(value: unknown): StageName | null {
  return STAGE_NAMES.find((name) => name === value) ?? null;
}
