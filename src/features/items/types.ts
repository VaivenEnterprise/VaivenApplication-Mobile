import { z } from 'zod';
import { publicUserSchema } from '@/features/profile/schemas';

// Contrato de objetos (`Item`, `ItemInput`, `Category` en backend/api/openapi.yaml). Las respuestas
// se validan con zod en el cliente de API (Art. IV); el servidor sigue siendo la autoridad.

export const CONDITIONS = ['new', 'like_new', 'good', 'fair', 'worn'] as const;
export const MODALITIES = ['loan', 'rent'] as const;
export const ITEM_STATUSES = ['active', 'paused', 'blocked', 'removed'] as const;
export const PRICE_SOURCES = ['manual', 'suggested'] as const;

export type Condition = (typeof CONDITIONS)[number];
export type Modality = (typeof MODALITIES)[number];
export type ItemStatus = (typeof ITEM_STATUSES)[number];
export type PriceSource = (typeof PRICE_SOURCES)[number];

const imageSchema = z.object({
  publicId: z.string(),
  url: z.string(),
  thumbUrl: z.string(),
});

const zoneSchema = z.object({
  municipality: z.string(),
  neighborhood: z.string().nullish(),
});

const locationSchema = z.object({ lat: z.number(), lng: z.number() });

export const itemSchema = z.object({
  id: z.string(),
  owner: publicUserSchema,
  title: z.string(),
  description: z.string(),
  category: z.string(),
  condition: z.enum(CONDITIONS),
  modality: z.enum(MODALITIES),
  /** `null` si quien consulta no es el dueño (Art. VI): nunca se muestra a terceros. */
  declaredValueCents: z.number().int().nullable(),
  pricePerDayCents: z.number().int().min(0),
  priceSource: z.enum(PRICE_SOURCES),
  usageRules: z.string().nullable(),
  zone: zoneSchema,
  approxLocation: locationSchema.nullable(),
  photos: z.array(imageSchema),
  status: z.enum(ITEM_STATUSES),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number().int(),
});

export type Item = z.infer<typeof itemSchema>;

export const itemPageSchema = z.object({
  items: z.array(itemSchema),
  nextCursor: z.string().nullable(),
});
export type ItemPage = z.infer<typeof itemPageSchema>;

export const categorySchema = z.object({ key: z.string(), label: z.string() });
export const categoriesSchema = z.array(categorySchema);
export type Category = z.infer<typeof categorySchema>;

export const priceSuggestionSchema = z.object({
  suggestedPricePerDayCents: z.number().int().min(1),
});

export type ApproxLocation = { lat: number; lng: number };

/** Cuerpo de `POST /items` (`ItemInput`). Dinero en centavos enteros (Art. V.1). */
export type ItemInput = {
  title: string;
  description: string;
  category: string;
  condition: Condition;
  modality: Modality;
  declaredValueCents: number;
  pricePerDayCents: number;
  priceSource: PriceSource;
  usageRules?: string | null;
  zone: { municipality: string; neighborhood?: string | null };
  approxLocation?: ApproxLocation | null;
  photos: { publicId: string }[];
};

/** Cuerpo de `PATCH /items/{id}` (`ItemUpdate`): `version` más los campos que cambian. */
export type ItemUpdate = Partial<ItemInput> & { version: number };

/** Filtro de estado de «Mis objetos» que admite el servidor. */
export type MyItemsFilter = 'active' | 'paused';
