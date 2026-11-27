// API pública de la feature de proyectos guiados (spec 007).
export { ProjectScreen } from '@/features/project-guide/screens/ProjectScreen';
// Fila «quién lo tiene» y tarjeta pública: también las usa el asistente de proyectos (021-T032).
export { ToolRow } from '@/features/project-guide/components/ToolRow';
export type { ToolQuery } from '@/features/project-guide/hooks';
export { WIDE_RADIUS_KM, toolHitSchema, type ToolHit } from '@/features/project-guide/types';
