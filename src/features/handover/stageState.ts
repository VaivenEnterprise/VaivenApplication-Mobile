import type { BookingStatus, ViewerRole } from '@/features/bookings';
import { stageRoles } from '@/features/handover/roles';
import type { Stage, StageName } from '@/features/handover/types';

/** Etapa que está en juego: la entrega con la reserva aceptada y la devolución, en curso. */
export function activeStage(status: BookingStatus): StageName | null {
  if (status === 'accepted') return 'delivery';
  if (status === 'in_progress') return 'return';
  return null;
}

/**
 * Una etapa está confirmada si el servidor lo dice o, sin datos de la etapa, si el estado de la
 * reserva ya pasó por ella (en curso ⇒ entrega hecha; concluida ⇒ ambas).
 */
export function isConfirmed(
  status: BookingStatus,
  stage: StageName,
  data: Stage | null | undefined,
): boolean {
  if (data?.confirmedAt != null) return true;
  if (status === 'completed') return true;
  return status === 'in_progress' && stage === 'delivery';
}

export type StageAction = 'record' | 'showQr' | 'scan' | 'wait' | 'none';

/** La única acción que le toca a esta persona ahora (spec 009 §7: una sola acción por momento). */
export function stageAction(
  stage: StageName,
  role: ViewerRole,
  data: Stage | null | undefined,
  confirmed: boolean,
): StageAction {
  if (confirmed) return 'none';
  const roles = stageRoles(stage, role);
  const hasEvidence = (data?.evidenceVersion ?? 0) > 0;
  if (roles.canRecordEvidence) return hasEvidence ? 'showQr' : 'record';
  if (roles.canScan) return hasEvidence ? 'scan' : 'wait';
  return 'none';
}
