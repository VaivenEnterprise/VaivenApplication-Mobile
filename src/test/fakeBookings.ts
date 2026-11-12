import type { Booking, Quote } from '@/features/bookings/types';
import { fakeOwner } from '@/test/fakeItems';

export const BOOKING_ID = '6731b1b2c3d4e5f6a7b8c9d0';
export const ITEM_ID = '6731a2b3c4d5e6f7a8b9c0d1';

export const fakeRequester = {
  id: '6730f1c2a9b3e4d5f6a7b8aa',
  displayName: 'Luis Pérez',
  ratingAverage: null,
  ratingCount: 0,
  memberSince: '2026-11-08T18:00:00Z',
};

export const fakeQuote = (over: Partial<Quote> = {}): Quote => ({
  itemId: ITEM_ID,
  startDate: '2026-11-12',
  endDate: '2026-11-14',
  days: 3,
  modality: 'rent',
  pricePerDayCents: 3000,
  totalCents: 9000,
  currency: 'MXN',
  paymentMode: 'full_on_delivery',
  payments: [{ stage: 'delivery', amountCents: 9000 }],
  policy: {
    requestExpiresInHours: 48,
    lateCancellationNotice: 'Cancelar con poco tiempo puede afectar tu reputación.',
    noShowNotice: 'Si no te presentas, se registrará como incidencia.',
  },
  ...over,
});

export const fakeBooking = (over: Partial<Booking> = {}): Booking => ({
  id: BOOKING_ID,
  item: { id: ITEM_ID, title: 'Taladro percutor', thumbUrl: null, modality: 'rent' },
  owner: fakeOwner,
  requester: fakeRequester,
  startDate: '2026-11-12',
  endDate: '2026-11-14',
  days: 3,
  usageRules: null,
  priceSnapshot: { modality: 'rent', pricePerDayCents: 3000, totalCents: 9000, currency: 'MXN' },
  paymentMode: 'full_on_delivery',
  payments: [{ stage: 'delivery', amountCents: 9000 }],
  status: 'pending',
  expiresAt: '2026-11-13T18:00:00Z',
  meetingPoint: null,
  cancelReason: null,
  cancelledBy: null,
  rejectReason: null,
  conversationId: null,
  viewerRole: 'requester',
  createdAt: '2026-11-11T18:00:00Z',
  updatedAt: '2026-11-11T18:00:00Z',
  version: 1,
  ...over,
});
