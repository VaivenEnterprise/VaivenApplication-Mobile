// API pública de reportes (Art. VI): hoja, botón y aviso de moderación reutilizables.
export { ReportSheet } from '@/features/reports/components/ReportSheet';
export { ReportButton } from '@/features/reports/components/ReportButton';
export { ModerationNotice } from '@/features/reports/components/ModerationNotice';
export { reportErrorMessage } from '@/features/reports/errors';
export type { ReportReason, ReportResult, ReportTargetType } from '@/features/reports/types';
export { ReportItemAction, ReportUserAction } from '@/features/reports/components/ReportActions';
