import { z } from 'zod';
import { INCIDENT_REASONS } from '@/features/incidents/types';
import { es } from '@/i18n/es-MX';

const v = es.incidents.validation;

export const DESCRIPTION_MIN = 10;
export const DESCRIPTION_MAX = 1000;
/** Máximo de fotos de evidencia por incidencia (`IncidentInput.evidence`). */
export const EVIDENCE_MAX = 5;

/** Formulario de reporte: motivo y descripción de 10 a 1000 caracteres (sin espacios de los extremos). */
export const incidentFormSchema = z.object({
  reason: z.enum(INCIDENT_REASONS, v.reasonRequired),
  description: z
    .string()
    .trim()
    .min(DESCRIPTION_MIN, v.descriptionTooShort)
    .max(DESCRIPTION_MAX, v.descriptionTooLong),
});
export type IncidentFormInput = z.infer<typeof incidentFormSchema>;
