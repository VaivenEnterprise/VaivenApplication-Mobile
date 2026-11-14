import { z } from 'zod';
import { publicUserSchema } from '@/features/profile/schemas';

// Contrato de incidencias (`Incident`, `IncidentPage`, `IncidentInput` en backend/api/openapi.yaml).
// Las respuestas se validan con zod (Art. III.2, IV). Las notas ocultas del equipo nunca llegan a
// la app: las filtra el backend (P-06).

/** Los 6 motivos del contrato (`IncidentReason`). */
export const INCIDENT_REASONS = [
  'no_show',
  'late_return',
  'damaged',
  'not_returned',
  'payment_dispute',
  'other',
] as const;
export type IncidentReason = (typeof INCIDENT_REASONS)[number];

export const INCIDENT_STATUSES = ['open', 'closed'] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const INCIDENT_OUTCOMES = ['none', 'monetary_adjustment', 'restriction'] as const;
export type IncidentOutcome = (typeof INCIDENT_OUTCOMES)[number];

const evidenceSchema = z.object({ publicId: z.string(), url: z.string(), thumbUrl: z.string() });

export const incidentSchema = z.object({
  id: z.string(),
  bookingId: z.string(),
  reporter: publicUserSchema,
  reported: publicUserSchema,
  reason: z.enum(INCIDENT_REASONS),
  description: z.string(),
  evidence: z.array(evidenceSchema),
  status: z.enum(INCIDENT_STATUSES),
  notes: z.array(z.object({ text: z.string(), at: z.string() })),
  finalResponse: z
    .object({ text: z.string(), outcome: z.enum(INCIDENT_OUTCOMES), at: z.string() })
    .nullable(),
  createdAt: z.string(),
  closedAt: z.string().nullable(),
});
export type Incident = z.infer<typeof incidentSchema>;

export const incidentPageSchema = z.object({
  items: z.array(incidentSchema),
  nextCursor: z.string().nullable(),
});
export type IncidentPage = z.infer<typeof incidentPageSchema>;

/** Cuerpo de `POST /bookings/{id}/incidents`. */
export type IncidentRequest = {
  reason: IncidentReason;
  description: string;
  evidence?: { publicId: string }[];
};
