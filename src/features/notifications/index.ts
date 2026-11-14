// API pública de la feature de avisos y notificaciones push (spec 011).

// Fila del Perfil: la ruta de Perfil la pasa a `renderExtraRows` (003), como la de incidencias (010).
export { NotificationsRow } from '@/features/notifications/components/NotificationsRow';
// Se monta una sola vez en el proveedor raíz (`src/app/_layout.tsx`, una línea acordada con 003).
export { NotificationsBootstrap } from '@/features/notifications/NotificationsBootstrap';
export { hrefForData, hrefOrCenter } from '@/features/notifications/routing';
