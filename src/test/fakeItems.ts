import type { Item } from '@/features/items/types';

// Datos de objetos para pruebas (forma del contrato `Item` de backend/api/openapi.yaml).

export const fakeCategories = [
  { key: 'herramientas_manuales', label: 'Herramientas manuales' },
  { key: 'herramientas_electricas', label: 'Herramientas eléctricas' },
  { key: 'hogar', label: 'Hogar' },
];

export const fakeOwner = {
  id: '6730f1c2a9b3e4d5f6a7b8c9',
  displayName: 'Ana López',
  ratingAverage: 4.9,
  ratingCount: 18,
  memberSince: '2026-11-06T18:00:00Z',
};

export const fakePhoto = (n: number) => ({
  publicId: `vaiven/test/item_photo/u1/f${n}`,
  url: `https://img.test/full-${n}.jpg`,
  thumbUrl: `https://img.test/thumb-${n}.jpg`,
});

export const fakeItem = (over: Partial<Item> = {}): Item => ({
  id: '6731a2b3c4d5e6f7a8b9c0d1',
  owner: fakeOwner,
  title: 'Taladro percutor 600 W',
  description: 'Incluye estuche y 5 brocas para concreto.',
  category: 'herramientas_electricas',
  condition: 'good',
  modality: 'rent',
  declaredValueCents: 100_000,
  pricePerDayCents: 3_000,
  priceSource: 'manual',
  usageRules: 'Devolver limpio. No usar en metal.',
  zone: { municipality: 'Coyoacán', neighborhood: 'Del Carmen' },
  approxLocation: { lat: 19.35, lng: -99.16 },
  photos: [fakePhoto(1), fakePhoto(2)],
  status: 'active',
  createdAt: '2026-11-08T16:00:00Z',
  updatedAt: '2026-11-08T16:00:00Z',
  version: 1,
  ...over,
});
