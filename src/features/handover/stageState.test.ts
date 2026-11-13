import { fakeStage } from '@/test/fakeHandover';
import { activeStage, isConfirmed, stageAction } from '@/features/handover/stageState';

describe('activeStage', () => {
  it('la entrega está activa con la reserva aceptada y la devolución, en curso', () => {
    expect(activeStage('accepted')).toBe('delivery');
    expect(activeStage('in_progress')).toBe('return');
  });

  it.each(['pending', 'rejected', 'expired', 'cancelled', 'completed'] as const)(
    '%s no tiene etapa activa',
    (status) => {
      expect(activeStage(status)).toBeNull();
    },
  );
});

describe('isConfirmed', () => {
  it('sigue la confirmación del servidor', () => {
    expect(
      isConfirmed('accepted', 'delivery', fakeStage({ confirmedAt: '2026-11-12T18:00:00Z' })),
    ).toBe(true);
    expect(isConfirmed('accepted', 'delivery', fakeStage())).toBe(false);
    expect(isConfirmed('accepted', 'delivery', null)).toBe(false);
  });

  it('sin datos de la etapa se deduce del estado de la reserva', () => {
    expect(isConfirmed('in_progress', 'delivery', undefined)).toBe(true);
    expect(isConfirmed('in_progress', 'return', undefined)).toBe(false);
    expect(isConfirmed('completed', 'delivery', null)).toBe(true);
    expect(isConfirmed('completed', 'return', null)).toBe(true);
  });
});

describe('stageAction', () => {
  const withEvidence = fakeStage({ evidenceVersion: 1, conditionNotes: 'Limpio' });

  it('quien registra: registrar y luego mostrar el QR', () => {
    expect(stageAction('delivery', 'owner', fakeStage(), false)).toBe('record');
    expect(stageAction('delivery', 'owner', null, false)).toBe('record');
    expect(stageAction('delivery', 'owner', withEvidence, false)).toBe('showQr');
    expect(stageAction('return', 'requester', withEvidence, false)).toBe('showQr');
  });

  it('quien escanea: espera la evidencia y luego escanea', () => {
    expect(stageAction('delivery', 'requester', fakeStage(), false)).toBe('wait');
    expect(stageAction('delivery', 'requester', withEvidence, false)).toBe('scan');
    expect(stageAction('return', 'owner', withEvidence, false)).toBe('scan');
  });

  it('una etapa confirmada o la administración no tienen acción', () => {
    expect(stageAction('delivery', 'owner', withEvidence, true)).toBe('none');
    expect(stageAction('delivery', 'admin', withEvidence, false)).toBe('none');
  });
});
