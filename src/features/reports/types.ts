import { z } from 'zod';

// Contrato de reportes (backend 011, `POST /reports`). Conjuntos cerrados del OpenAPI.

export const REPORT_REASONS = ['prohibited_content', 'inappropriate', 'spam', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_TARGET_TYPES = ['item', 'message', 'user', 'moderation_decision'] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

/** Máximo de caracteres de los detalles y del `targetId` de una decisión de moderación. */
export const REPORT_DETAILS_MAX = 500;
export const REPORT_TARGET_ID_MAX = 64;

export const reportCreatedSchema = z.object({ id: z.string() });
export type ReportCreated = z.infer<typeof reportCreatedSchema>;

export type ReportInput = {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
};

/** Resultado de reportar: `duplicate` es true cuando el servidor devolvió el reporte existente (200). */
export type ReportResult = { id: string; duplicate: boolean };
