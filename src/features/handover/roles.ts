import type { ViewerRole } from '@/features/bookings';
import type { StageName } from '@/features/handover/types';

// Quién hace qué en cada etapa (plan P-01, RF-03). Función pura: la interfaz solo consulta; el
// servidor sigue siendo la autoridad y responde 403 si alguien actúa fuera de su turno.

export type StageRoles = {
  canRecordEvidence: boolean;
  canShowQr: boolean;
  canScan: boolean;
};

const NONE: StageRoles = { canRecordEvidence: false, canShowQr: false, canScan: false };

/** Entrega: el propietario registra y muestra el QR. Devolución: lo hace quien solicitó. */
export function stageRoles(stage: StageName, role: ViewerRole): StageRoles {
  if (role === 'admin') return NONE;
  const recorder: ViewerRole = stage === 'delivery' ? 'owner' : 'requester';
  const isRecorder = role === recorder;
  return { canRecordEvidence: isRecorder, canShowQr: isRecorder, canScan: !isRecorder };
}
