import {
  emptyItemForm,
  formValuesFromItem,
  itemFormSchema,
  toItemInput,
  type ItemFormValues,
} from '@/features/items/schemas';
import { es } from '@/i18n/es-MX';
import { fakeItem } from '@/test/fakeItems';

const v = es.items.validation;

const rent: ItemFormValues = {
  ...emptyItemForm,
  title: 'Taladro percutor',
  category: 'herramientas_electricas',
  modality: 'rent',
  declaredValueCents: 100_000,
  pricePerDayCents: 3_000,
  municipality: 'Coyoacán',
};
const loan: ItemFormValues = { ...rent, modality: 'loan', pricePerDayCents: 0 };

const messages = (values: ItemFormValues) => {
  const result = itemFormSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
};

describe('itemFormSchema', () => {
  it('acepta una renta válida y un préstamo válido', () => {
    expect(messages(rent)).toEqual([]);
    expect(messages(loan)).toEqual([]);
  });

  it('exige título de 3 a 80 caracteres', () => {
    expect(messages({ ...rent, title: '' })).toContain(`title: ${v.titleRequired}`);
    expect(messages({ ...rent, title: 'ab' })).toContain(`title: ${v.titleTooShort}`);
    expect(messages({ ...rent, title: 'a'.repeat(81) })).toContain(`title: ${v.titleTooLong}`);
    expect(messages({ ...rent, title: 'a'.repeat(80) })).toEqual([]);
  });

  it('limita descripción (1000) y reglas (500)', () => {
    expect(messages({ ...rent, description: 'a'.repeat(1001) })).toContain(
      `description: ${v.descriptionTooLong}`,
    );
    expect(messages({ ...rent, usageRules: 'a'.repeat(501) })).toContain(
      `usageRules: ${v.usageRulesTooLong}`,
    );
    expect(
      messages({ ...rent, description: 'a'.repeat(1000), usageRules: 'a'.repeat(500) }),
    ).toEqual([]);
  });

  it('exige categoría, estado y municipio', () => {
    expect(messages({ ...rent, category: '' })).toContain(`category: ${v.categoryRequired}`);
    expect(messages({ ...rent, municipality: '' })).toContain(
      `municipality: ${v.municipalityRequired}`,
    );
    expect(messages({ ...rent, municipality: 'a' })).toContain(
      `municipality: ${v.municipalityTooShort}`,
    );
    expect(messages({ ...rent, condition: null as never })).toContain(
      `condition: ${v.conditionRequired}`,
    );
  });

  it('el valor declarado va de $50 a $100,000', () => {
    expect(messages({ ...rent, declaredValueCents: null })).toContain(
      `declaredValueCents: ${v.declaredValueRequired}`,
    );
    expect(messages({ ...rent, declaredValueCents: 4_999, pricePerDayCents: 1_000 })).toContain(
      `declaredValueCents: ${v.declaredValueRange}`,
    );
    expect(messages({ ...rent, declaredValueCents: 10_000_001 })).toContain(
      `declaredValueCents: ${v.declaredValueRange}`,
    );
    expect(messages({ ...rent, declaredValueCents: 5_000, pricePerDayCents: 1_000 })).toEqual([]);
    expect(messages({ ...rent, declaredValueCents: 10_000_000 })).toEqual([]);
  });

  it('en renta el precio va de $10 al valor declarado', () => {
    expect(messages({ ...rent, pricePerDayCents: null })).toContain(
      `pricePerDayCents: ${v.priceRequired}`,
    );
    expect(messages({ ...rent, pricePerDayCents: 999 })).toContain(
      `pricePerDayCents: ${v.priceTooLow}`,
    );
    expect(messages({ ...rent, pricePerDayCents: 100_001 })).toContain(
      `pricePerDayCents: ${v.priceTooHigh}`,
    );
    expect(messages({ ...rent, pricePerDayCents: 1_000 })).toEqual([]);
    expect(messages({ ...rent, pricePerDayCents: 100_000 })).toEqual([]);
  });

  it('en préstamo no valida el precio (siempre es $0)', () => {
    expect(messages({ ...loan, pricePerDayCents: null })).toEqual([]);
  });
});

describe('toItemInput', () => {
  const photos = [{ publicId: 'p1' }, { publicId: 'p2' }];

  it('arma la renta en centavos con la sugerencia y la ubicación', () => {
    const input = toItemInput(
      {
        ...rent,
        priceSource: 'suggested',
        neighborhood: 'Del Carmen',
        usageRules: 'Devolver limpio',
        location: { lat: 19.349512, lng: -99.162301 },
      },
      photos,
    );
    expect(input).toEqual({
      title: 'Taladro percutor',
      description: '',
      category: 'herramientas_electricas',
      condition: 'good',
      modality: 'rent',
      declaredValueCents: 100_000,
      pricePerDayCents: 3_000,
      priceSource: 'suggested',
      usageRules: 'Devolver limpio',
      zone: { municipality: 'Coyoacán', neighborhood: 'Del Carmen' },
      approxLocation: { lat: 19.349512, lng: -99.162301 },
      photos: [{ publicId: 'p1' }, { publicId: 'p2' }],
    });
  });

  it('el préstamo fuerza precio 0 y fuente manual', () => {
    const input = toItemInput(
      { ...loan, pricePerDayCents: 5_000, priceSource: 'suggested' },
      photos,
    );
    expect(input.pricePerDayCents).toBe(0);
    expect(input.priceSource).toBe('manual');
  });

  it('manda null en lo opcional vacío', () => {
    const input = toItemInput(rent, photos);
    expect(input.usageRules).toBeNull();
    expect(input.zone.neighborhood).toBeNull();
    expect(input.approxLocation).toBeNull();
  });
});

describe('formValuesFromItem', () => {
  it('rellena el formulario con el objeto', () => {
    const values = formValuesFromItem(fakeItem());
    expect(values).toMatchObject({
      title: 'Taladro percutor 600 W',
      modality: 'rent',
      declaredValueCents: 100_000,
      pricePerDayCents: 3_000,
      municipality: 'Coyoacán',
      neighborhood: 'Del Carmen',
      location: { lat: 19.35, lng: -99.16 },
    });
    expect(itemFormSchema.safeParse(values).success).toBe(true);
  });

  it('convierte los null del servidor en cadenas vacías', () => {
    const values = formValuesFromItem(
      fakeItem({ usageRules: null, zone: { municipality: 'Tlalpan', neighborhood: null } }),
    );
    expect(values.usageRules).toBe('');
    expect(values.neighborhood).toBe('');
  });
});
