// API pública de la feature de incidencias (spec 010).
import { slots } from '@/features/bookings';
import { TrustSection } from '@/features/incidents/components/TrustSection';

// Sección «ratingsAndIncidents» del detalle de la reserva (007, Art. XIII). El *slot* admite un
// solo componente, así que se registra la composición de la tarjeta «Calificar» (que ya registró
// `@/features/ratings`, cargada por `TrustSection`) y la sección de incidencias. Una línea.
slots.register('ratingsAndIncidents', TrustSection);

export { IncidentSection } from '@/features/incidents/components/IncidentSection';
// Fila «Mis incidencias» para `renderExtraRows` del perfil (003, RF-07).
export { IncidentsRow } from '@/features/incidents/components/IncidentsRow';
export { canReport } from '@/features/incidents/rules';
export type { Incident, IncidentReason, IncidentStatus } from '@/features/incidents/types';
