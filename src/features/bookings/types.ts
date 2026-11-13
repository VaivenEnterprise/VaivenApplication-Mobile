import { z } from 'zod';
import { publicUserSchema } from '@/features/profile/schemas';

// Contrato de solicitudes y reservas (`Quote`, `Booking` en backend/api/openapi.yaml). Las
// respuestas se validan con zod (Art. IV). Las etapas de entrega/devolución, los pagos y los
// ajustes los consumen 009 y 010: aquí solo se conservan sin interpretarlas.

export const BOOKING_STATUSES = [
  'pending',
  'accepted',
  'rejected',
  'expired',
  'cancelled',
  'in_progress',
  'completed',
] as const;
export const PAYMENT_MODES = ['none', 'full_on_delivery', 'split_50_50'] as const;
export const VIEWER_ROLES = ['owner', 'requester', 'admin'] as const;
export const MODALITIES = ['loan', 'rent'] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export type PaymentMode = (typeof PAYMENT_MODES)[number];
export type ViewerRole = (typeof VIEWER_ROLES)[number];
/** Rol de la lista `GET /me/bookings?role=`. */
export type ListRole = 'owner' | 'requester';

const stageSchema = z.enum(['delivery', 'return']);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const quoteSchema = z.object({
  itemId: z.string(),
  startDate: dateSchema,
  endDate: dateSchema,
  days: z.number().int().min(1),
  modality: z.enum(MODALITIES),
  pricePerDayCents: z.number().int().min(0),
  totalCents: z.number().int().min(0),
  currency: z.literal('MXN'),
  paymentMode: z.enum(PAYMENT_MODES),
  payments: z.array(z.object({ stage: stageSchema, amountCents: z.number().int().min(0) })),
  policy: z.object({
    requestExpiresInHours: z.number().int(),
    lateCancellationNotice: z.string(),
    noShowNotice: z.string(),
  }),
});
export type Quote = z.infer<typeof quoteSchema>;

const meetingPointSchema = z.object({ description: z.string() });

// Etapas presenciales y pagos (backend 009: `Stage`, `Adjustment`, `BookingPayment`). Los campos
// nuevos son opcionales para tolerar un servidor que aún no los envía (spec 009, RF-05).
export const QR_STATES = ['none', 'active', 'expired', 'used'] as const;
export const PAYMENT_STATUSES = ['pending', 'reported', 'confirmed'] as const;
export type QrState = (typeof QR_STATES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const handoverStageSchema = z.object({
  recordedAt: z.string().nullish(),
  recordedById: z.string().nullish(),
  conditionNotes: z.string(),
  photos: z.array(z.object({ publicId: z.string(), url: z.string(), thumbUrl: z.string() })),
  evidenceVersion: z.number().int(),
  qr: z.object({ state: z.enum(QR_STATES), expiresAt: z.string().nullish() }),
  confirmedAt: z.string().nullish(),
  confirmedById: z.string().nullish(),
});
export type HandoverStage = z.infer<typeof handoverStageSchema>;

export const adjustmentSchema = z.object({
  type: z.literal('late_return'),
  lateDays: z.number().int().min(1),
  amountCents: z.number().int(),
  status: z.literal('recorded'),
});
export type Adjustment = z.infer<typeof adjustmentSchema>;

const paymentSchema = z.object({
  stage: stageSchema,
  amountCents: z.number().int().min(0),
  status: z.enum(PAYMENT_STATUSES).optional(),
  reportedAt: z.string().nullish(),
  note: z.string().nullish(),
  confirmedAt: z.string().nullish(),
});
export type BookingPayment = z.infer<typeof paymentSchema>;

export const bookingSchema = z.object({
  id: z.string(),
  item: z.object({
    id: z.string(),
    title: z.string(),
    thumbUrl: z.string().nullish(),
    modality: z.enum(MODALITIES),
  }),
  owner: publicUserSchema,
  requester: publicUserSchema,
  startDate: dateSchema,
  endDate: dateSchema,
  days: z.number().int(),
  usageRules: z.string().nullish(),
  priceSnapshot: z.object({
    modality: z.enum(MODALITIES),
    pricePerDayCents: z.number().int().min(0),
    totalCents: z.number().int().min(0),
    currency: z.literal('MXN'),
  }),
  paymentMode: z.enum(PAYMENT_MODES),
  payments: z.array(paymentSchema),
  status: z.enum(BOOKING_STATUSES),
  expiresAt: z.string().nullish(),
  meetingPoint: meetingPointSchema.nullish(),
  cancelReason: z.string().nullish(),
  cancelledBy: z.enum(['owner', 'requester']).nullish(),
  rejectReason: z.string().nullish(),
  conversationId: z.string().nullish(),
  delivery: handoverStageSchema.nullish(),
  return: handoverStageSchema.nullish(),
  isLate: z.boolean().optional(),
  adjustments: z.array(adjustmentSchema).optional(),
  affectedBy: z.string().nullish(),
  viewerRole: z.enum(VIEWER_ROLES),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number().int(),
});
export type Booking = z.infer<typeof bookingSchema>;

export const bookingPageSchema = z.object({
  items: z.array(bookingSchema),
  nextCursor: z.string().nullable(),
});
export type BookingPage = z.infer<typeof bookingPageSchema>;

/** Cuerpo de `POST /bookings`. */
export type BookingRequest = {
  itemId: string;
  startDate: string;
  endDate: string;
  paymentMode: PaymentMode;
  acceptedTotalCents: number;
};
