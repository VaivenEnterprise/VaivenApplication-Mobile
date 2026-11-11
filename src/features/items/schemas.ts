import { z } from 'zod';
import {
  CONDITIONS,
  MODALITIES,
  PRICE_SOURCES,
  type ApproxLocation,
  type Item,
  type ItemInput,
} from '@/features/items/types';
import { es } from '@/i18n/es-MX';
import { POLICY } from '@/lib/policy';

const v = es.items.validation;

/**
 * Esquema del formulario de publicar/editar (plan P-02, backend 005 RF-01/RF-02). Dinero en
 * centavos enteros; el precio de un préstamo es $0 y el de una renta va de $10 al valor declarado.
 */
export const itemFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, v.titleRequired)
      .min(POLICY.title.min, v.titleTooShort)
      .max(POLICY.title.max, v.titleTooLong),
    description: z.string().trim().max(POLICY.description.max, v.descriptionTooLong),
    category: z.string().min(1, v.categoryRequired),
    condition: z.enum(CONDITIONS, { error: v.conditionRequired }),
    modality: z.enum(MODALITIES, { error: v.modalityRequired }),
    declaredValueCents: z.number().int().nullable(),
    pricePerDayCents: z.number().int().min(0).nullable(),
    priceSource: z.enum(PRICE_SOURCES),
    usageRules: z.string().trim().max(POLICY.usageRules.max, v.usageRulesTooLong),
    municipality: z
      .string()
      .trim()
      .min(1, v.municipalityRequired)
      .min(POLICY.zone.min, v.municipalityTooShort)
      .max(POLICY.zone.max, v.zoneTooLong),
    neighborhood: z.string().trim().max(POLICY.zone.max, v.zoneTooLong),
    location: z.object({ lat: z.number(), lng: z.number() }).nullable(),
  })
  .superRefine((values, ctx) => {
    const declared = values.declaredValueCents;
    if (declared === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['declaredValueCents'],
        message: v.declaredValueRequired,
      });
    } else if (
      declared < POLICY.declaredValueCents.min ||
      declared > POLICY.declaredValueCents.max
    ) {
      ctx.addIssue({ code: 'custom', path: ['declaredValueCents'], message: v.declaredValueRange });
    }

    // Préstamo: precio $0 fijo; no se valida lo que haya quedado escrito.
    if (values.modality !== 'rent') return;
    const price = values.pricePerDayCents;
    if (price === null) {
      ctx.addIssue({ code: 'custom', path: ['pricePerDayCents'], message: v.priceRequired });
    } else if (price < POLICY.minRentPriceCents) {
      ctx.addIssue({ code: 'custom', path: ['pricePerDayCents'], message: v.priceTooLow });
    } else if (declared !== null && price > declared) {
      ctx.addIssue({ code: 'custom', path: ['pricePerDayCents'], message: v.priceTooHigh });
    }
  });

export type ItemFormValues = z.infer<typeof itemFormSchema>;

/** Valores iniciales de una publicación nueva. */
export const emptyItemForm: ItemFormValues = {
  title: '',
  description: '',
  category: '',
  condition: 'good',
  modality: 'loan',
  declaredValueCents: null,
  pricePerDayCents: 0,
  priceSource: 'manual',
  usageRules: '',
  municipality: '',
  neighborhood: '',
  location: null,
};

/** Rellena el formulario con un objeto existente (modo edición). */
export function formValuesFromItem(item: Item): ItemFormValues {
  return {
    title: item.title,
    description: item.description,
    category: item.category,
    condition: item.condition,
    modality: item.modality,
    declaredValueCents: item.declaredValueCents,
    pricePerDayCents: item.pricePerDayCents,
    priceSource: item.priceSource,
    usageRules: item.usageRules ?? '',
    municipality: item.zone.municipality,
    neighborhood: item.zone.neighborhood ?? '',
    location: item.approxLocation,
  };
}

/** Cuerpo de `POST /items` a partir de valores ya validados y las fotos subidas. */
export function toItemInput(
  values: ItemFormValues,
  photos: readonly { publicId: string }[],
): ItemInput {
  const loan = values.modality === 'loan';
  const location: ApproxLocation | null = values.location;
  return {
    title: values.title,
    description: values.description,
    category: values.category,
    condition: values.condition,
    modality: values.modality,
    declaredValueCents: values.declaredValueCents ?? 0,
    pricePerDayCents: loan ? 0 : (values.pricePerDayCents ?? 0),
    priceSource: loan ? 'manual' : values.priceSource,
    usageRules: values.usageRules === '' ? null : values.usageRules,
    zone: {
      municipality: values.municipality,
      neighborhood: values.neighborhood === '' ? null : values.neighborhood,
    },
    approxLocation: location,
    photos: photos.map(({ publicId }) => ({ publicId })),
  };
}
