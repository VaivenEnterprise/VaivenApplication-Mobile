import { z } from 'zod';
import { es } from '@/i18n/es-MX';
import { REPORT_DETAILS_MAX, REPORT_REASONS } from '@/features/reports/types';

const t = es.reports.errors;

/** Formulario de reporte (RF-06): motivo obligatorio y detalles opcionales de hasta 500. */
export const reportFormSchema = z.object({
  reason: z.enum(REPORT_REASONS, { error: t.reasonRequired }),
  details: z.string().trim().max(REPORT_DETAILS_MAX, { error: t.detailsTooLong }).optional(),
});
export type ReportForm = z.infer<typeof reportFormSchema>;
