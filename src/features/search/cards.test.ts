import { flattenPages, toResultCard } from '@/features/search/cards';
import type { SearchItem, SearchPage } from '@/features/search/types';

const item = (id: string, over: Partial<SearchItem> = {}): SearchItem => ({
  id,
  title: `Objeto ${id}`,
  modality: 'rent',
  pricePerDayCents: 3000,
  ...over,
});

describe('tarjetas de resultados', () => {
  it('convierte un resultado en datos de tarjeta con distancia y calificación', () => {
    expect(
      toResultCard(
        item('a', {
          thumbUrl: 'https://img.test/a.jpg',
          distanceKm: 2.4,
          owner: { ratingAverage: 4.5 },
        }),
      ),
    ).toEqual({
      id: 'a',
      title: 'Objeto a',
      modality: 'rent',
      pricePerDayCents: 3000,
      thumbUrl: 'https://img.test/a.jpg',
      distanceKm: 2.4,
      ratingAverage: 4.5,
    });
  });

  it('los datos ausentes quedan en null', () => {
    expect(toResultCard(item('b'))).toMatchObject({
      thumbUrl: null,
      distanceKm: null,
      ratingAverage: null,
    });
  });

  it('aplana las páginas y descarta repetidos', () => {
    const pages: SearchPage[] = [
      { items: [item('a'), item('b')], nextCursor: 'c1' },
      { items: [item('b'), item('c')], nextCursor: null },
    ];
    expect(flattenPages(pages).map((card) => card.id)).toEqual(['a', 'b', 'c']);
    expect(flattenPages(undefined)).toEqual([]);
  });
});
