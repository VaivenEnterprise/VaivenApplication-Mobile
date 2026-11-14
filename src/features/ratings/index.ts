// API pública de la feature de calificaciones y reputación (spec 010).
import { slots } from '@/features/bookings';
import { RateBookingCard } from '@/features/ratings/components/RateBookingCard';

// Parte «calificar» de la sección `ratingsAndIncidents` del detalle de la reserva (007, Art. XIII).
// La feature de incidencias importa este módulo y registra encima una sección que incluye también
// esta tarjeta, porque el *slot* admite un solo componente.
slots.register('ratingsAndIncidents', RateBookingCard);

export { RateBookingCard } from '@/features/ratings/components/RateBookingCard';
export { RatingSummary } from '@/features/ratings/components/RatingSummary';
// `renderReputation` de los perfiles (003): la ruta lo pasa a `ProfileScreen` y `PublicProfileScreen`.
export { ReputationSection } from '@/features/ratings/components/ReputationSection';
export type { Rating, RatingStatus } from '@/features/ratings/types';
