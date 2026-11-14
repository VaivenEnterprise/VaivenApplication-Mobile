import {
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
  EVIDENCE_MAX,
  incidentFormSchema,
} from '@/features/incidents/schemas';
import { INCIDENT_REASONS } from '@/features/incidents/types';
import { es } from '@/i18n/es-MX';

const v = es.incidents.validation;
const valid = { reason: 'damaged', description: 'a'.repeat(DESCRIPTION_MIN) };

describe('incidentFormSchema', () => {
  it('tiene los 6 motivos del contrato', () => {
    expect([...INCIDENT_REASONS]).toEqual([
      'no_show',
      'late_return',
      'damaged',
      'not_returned',
      'payment_dispute',
      'other',
    ]);
    for (const reason of INCIDENT_REASONS) {
      expect(incidentFormSchema.safeParse({ ...valid, reason }).success).toBe(true);
    }
  });

  it('exige un motivo válido', () => {
    const result = incidentFormSchema.safeParse({ ...valid, reason: 'robo' });
    expect(result.success).toBe(false);
    expect(result.success ? '' : result.error.issues[0]?.message).toBe(v.reasonRequired);
  });

  it('la descripción va de 10 a 1000 caracteres', () => {
    expect(incidentFormSchema.safeParse(valid).success).toBe(true);
    expect(
      incidentFormSchema.safeParse({ ...valid, description: 'a'.repeat(DESCRIPTION_MAX) }).success,
    ).toBe(true);
    const short = incidentFormSchema.safeParse({ ...valid, description: 'a'.repeat(9) });
    expect(short.success ? '' : short.error.issues[0]?.message).toBe(v.descriptionTooShort);
    const long = incidentFormSchema.safeParse({
      ...valid,
      description: 'a'.repeat(DESCRIPTION_MAX + 1),
    });
    expect(long.success ? '' : long.error.issues[0]?.message).toBe(v.descriptionTooLong);
  });

  it('no cuenta los espacios de los extremos', () => {
    const result = incidentFormSchema.safeParse({
      ...valid,
      description: `   ${'a'.repeat(9)}   `,
    });
    expect(result.success).toBe(false);
  });

  it('permite hasta 5 fotos de evidencia', () => {
    expect(EVIDENCE_MAX).toBe(5);
  });
});
