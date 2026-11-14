import type { Incident } from '@/features/incidents/types';
import type { Rating, RatingStatus } from '@/features/ratings/types';
import { BOOKING_ID, fakeRequester } from '@/test/fakeBookings';
import { fakeOwner } from '@/test/fakeItems';

// Datos de prueba de calificaciones e incidencias (spec 010).

export const INCIDENT_ID = '6731c0000000000000000020';

export const fakeRating = (over: Partial<Rating> = {}): Rating => ({
  id: '6731b0000000000000000010',
  bookingId: BOOKING_ID,
  score: 5,
  comment: 'Todo salió muy bien, llegó puntual.',
  ratedRole: 'owner',
  rater: { id: fakeRequester.id, displayName: fakeRequester.displayName },
  createdAt: '2026-11-21T16:00:00Z',
  ...over,
});

export const fakeRatingStatus = (over: Partial<RatingStatus> = {}): RatingStatus => ({
  canRate: true,
  myRating: null,
  expiresAt: '2026-12-05T16:00:00Z',
  ...over,
});

export const fakeIncident = (over: Partial<Incident> = {}): Incident => ({
  id: INCIDENT_ID,
  bookingId: BOOKING_ID,
  reporter: fakeRequester,
  reported: fakeOwner,
  reason: 'damaged',
  description: 'El objeto regresó con la tapa rota y no estaba así en la entrega.',
  evidence: [],
  status: 'open',
  notes: [],
  finalResponse: null,
  createdAt: '2026-11-13T16:00:00Z',
  closedAt: null,
  ...over,
});

export const fakeEvidence = (n: number) => ({
  publicId: `vaiven/evidence/6731/${n}`,
  url: `https://img.test/evidence/${n}.jpg`,
  thumbUrl: `https://img.test/evidence/${n}-thumb.jpg`,
});
