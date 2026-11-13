import { stageRoles } from '@/features/handover/roles';

// Matriz etapa × rol (spec 009 RF-03, CA-05): la entrega la registra y la muestra el propietario
// y la escanea quien solicita; en la devolución es al revés. La administración nunca actúa.
describe('stageRoles', () => {
  it.each([
    ['delivery', 'owner', { canRecordEvidence: true, canShowQr: true, canScan: false }],
    ['delivery', 'requester', { canRecordEvidence: false, canShowQr: false, canScan: true }],
    ['delivery', 'admin', { canRecordEvidence: false, canShowQr: false, canScan: false }],
    ['return', 'owner', { canRecordEvidence: false, canShowQr: false, canScan: true }],
    ['return', 'requester', { canRecordEvidence: true, canShowQr: true, canScan: false }],
    ['return', 'admin', { canRecordEvidence: false, canShowQr: false, canScan: false }],
  ] as const)('%s con rol %s', (stage, role, expected) => {
    expect(stageRoles(stage, role)).toEqual(expected);
  });

  it('CA-05: quien solicita no ve «Generar QR» en la entrega', () => {
    expect(stageRoles('delivery', 'requester').canShowQr).toBe(false);
  });

  it('nunca puede mostrar y escanear a la vez', () => {
    for (const stage of ['delivery', 'return'] as const) {
      for (const role of ['owner', 'requester', 'admin'] as const) {
        const roles = stageRoles(stage, role);
        expect(roles.canShowQr && roles.canScan).toBe(false);
      }
    }
  });
});
