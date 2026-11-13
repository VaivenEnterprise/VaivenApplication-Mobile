import { bookingSchema, handoverStageSchema, type Booking } from '@/features/bookings/types';
import {
  qrTokenSchema,
  type EvidenceInput,
  type QrToken,
  type Stage,
  type StageName,
} from '@/features/handover/types';
import { request } from '@/lib/api/client';

// Las rutas de entrega, devolución y pagos (backend 009). Todo pasa por `request` (Art. II, IV).
// Ningún cuerpo ni token se escribe en logs (RF-11, Art. VIII.3).

const bookingPath = (id: string) => `/bookings/${encodeURIComponent(id)}`;
const stagePath = (id: string, stage: StageName) => `${bookingPath(id)}/${stage}`;

/** `GET /bookings/{id}/{delivery|return}`: la etapa con sus fotos (URL firmadas de 10 minutos). */
export function fetchStage(id: string, stage: StageName, signal?: AbortSignal): Promise<Stage> {
  return request(stagePath(id, stage), handoverStageSchema, { signal });
}

/** `PUT …/evidence`: registra o reemplaza la evidencia (el QR vigente deja de servir). */
export function putEvidence(id: string, stage: StageName, input: EvidenceInput): Promise<Stage> {
  return request(`${stagePath(id, stage)}/evidence`, handoverStageSchema, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

/** `POST …/qr`: genera un QR de un solo uso, vigente 15 minutos. El token solo viaja aquí. */
export function issueQr(id: string, stage: StageName): Promise<QrToken> {
  return request(`${stagePath(id, stage)}/qr`, qrTokenSchema, { method: 'POST' });
}

/** `POST …/confirm`: confirma la etapa con el token leído; devuelve la reserva actualizada. */
export function confirmStage(id: string, stage: StageName, token: string): Promise<Booking> {
  return request(`${stagePath(id, stage)}/confirm`, bookingSchema, {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

/** `POST …/payments/{stage}/report` (solicitante): informa que ya pagó la etapa. */
export function reportPayment(id: string, stage: StageName, note?: string): Promise<Booking> {
  return request(`${bookingPath(id)}/payments/${stage}/report`, bookingSchema, {
    method: 'POST',
    body: JSON.stringify(note === undefined ? {} : { note }),
  });
}

/** `POST …/payments/{stage}/confirm` (propietario): confirma que recibió el pago reportado. */
export function confirmPayment(id: string, stage: StageName): Promise<Booking> {
  return request(`${bookingPath(id)}/payments/${stage}/confirm`, bookingSchema, {
    method: 'POST',
  });
}
