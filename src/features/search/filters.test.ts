import {
  PARAM_KEYS,
  activeFilterCount,
  clearAll,
  clearFilters,
  effectiveText,
  filtersToParams,
  isSearching,
  maxTo,
  paramsToFilters,
  rangeProblem,
  toQueryString,
  withCursor,
} from '@/features/search/filters';
import { EMPTY_FILTERS, type SearchFilters } from '@/features/search/types';

const FULL: SearchFilters = {
  q: 'taladro percutor',
  category: 'herramientas_electricas',
  modality: 'rent',
  municipality: 'Coyoacán',
  from: '2026-11-12',
  to: '2026-11-15',
  radiusKm: 3,
};

describe('filtros ↔ parámetros de ruta (plan P-01)', () => {
  it('hace ida y vuelta con todos los filtros', () => {
    expect(paramsToFilters(filtersToParams(FULL))).toEqual(FULL);
  });

  it('hace ida y vuelta sin filtros y omite los vacíos', () => {
    const params = filtersToParams(EMPTY_FILTERS);
    expect(PARAM_KEYS.every((key) => params[key] === undefined)).toBe(true);
    expect(paramsToFilters(params)).toEqual(EMPTY_FILTERS);
  });

  it('hace ida y vuelta con filtros parciales', () => {
    const partial: SearchFilters = { ...EMPTY_FILTERS, category: 'hogar', radiusKm: 10 };
    expect(paramsToFilters(filtersToParams(partial))).toEqual(partial);
  });

  it('lee el primer valor si un parámetro llega repetido', () => {
    expect(paramsToFilters({ q: ['sierra', 'otra'] }).q).toBe('sierra');
  });

  it('descarta valores inválidos de una URL manipulada o antigua', () => {
    const filters = paramsToFilters({
      modality: 'venta',
      radiusKm: '7',
      from: '2026-02-30',
      to: 'mañana',
      q: 'x'.repeat(200),
    });
    expect(filters).toMatchObject({ modality: null, radiusKm: null, from: '', to: '' });
    expect(filters.q).toHaveLength(80);
    expect(paramsToFilters({ radiusKm: 'abc' }).radiusKm).toBeNull();
  });
});

describe('texto efectivo', () => {
  it.each<[string, string]>([
    ['', ''],
    ['a', ''],
    ['  a  ', ''],
    ['ta', 'ta'],
    ['  taladro   percutor ', 'taladro percutor'],
  ])('«%s» → «%s»', (input, expected) => {
    expect(effectiveText(input)).toBe(expected);
  });

  it('recorta a 80 caracteres', () => {
    expect(effectiveText('a'.repeat(120))).toHaveLength(80);
  });
});

describe('contador y modo de búsqueda', () => {
  it('cuenta cada filtro una vez y las fechas como uno', () => {
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0);
    expect(activeFilterCount(FULL)).toBe(5);
    expect(activeFilterCount({ ...EMPTY_FILTERS, from: '2026-11-12' })).toBe(1);
    expect(activeFilterCount({ ...EMPTY_FILTERS, municipality: '   ' })).toBe(0);
    expect(activeFilterCount({ ...EMPTY_FILTERS, q: 'taladro' })).toBe(0);
  });

  it('distingue el inicio de Explorar de una búsqueda', () => {
    expect(isSearching(EMPTY_FILTERS)).toBe(false);
    expect(isSearching({ ...EMPTY_FILTERS, q: '  ' })).toBe(false);
    expect(isSearching({ ...EMPTY_FILTERS, q: 'a' })).toBe(true);
    expect(isSearching({ ...EMPTY_FILTERS, category: 'hogar' })).toBe(true);
  });

  it('limpia todo o solo los filtros según el botón', () => {
    expect(clearAll()).toEqual(EMPTY_FILTERS);
    expect(clearFilters(FULL)).toEqual({ ...EMPTY_FILTERS, q: FULL.q });
  });
});

describe('periodo de fechas (P-04)', () => {
  it('acepta hasta 7 días y una sola fecha', () => {
    expect(rangeProblem('2026-11-12', '2026-11-12')).toBeNull();
    expect(rangeProblem('2026-11-12', '2026-11-19')).toBeNull();
    expect(rangeProblem('2026-11-12', '')).toBeNull();
    expect(rangeProblem('', '2026-11-12')).toBeNull();
  });

  it('detecta periodo invertido o demasiado largo', () => {
    expect(rangeProblem('2026-11-12', '2026-11-11')).toBe('inverted');
    expect(rangeProblem('2026-11-12', '2026-11-20')).toBe('tooLong');
  });

  it('calcula la última fecha elegible para «Hasta»', () => {
    expect(maxTo('2026-11-12')).toBe('2026-11-19');
    expect(maxTo('')).toBeNull();
  });
});

describe('query string de GET /items', () => {
  it('sin filtros solo pide la página', () => {
    expect(toQueryString(EMPTY_FILTERS)).toBe('limit=20');
  });

  it('omite lo vacío y el texto de un solo carácter', () => {
    expect(toQueryString({ ...EMPTY_FILTERS, q: 'a', municipality: '  ' })).toBe('limit=20');
  });

  it('codifica texto con acentos y espacios', () => {
    expect(toQueryString({ ...EMPTY_FILTERS, q: 'sierra  caladora ñ' })).toBe(
      `limit=20&q=${encodeURIComponent('sierra caladora ñ')}`,
    );
  });

  it('incluye todos los filtros y la ubicación redondeada cuando hay radio', () => {
    const query = toQueryString(FULL, { lat: 19.4326077, lng: -99.133208 });
    expect(Object.fromEntries(new URLSearchParams(query))).toEqual({
      limit: '20',
      q: 'taladro percutor',
      category: 'herramientas_electricas',
      modality: 'rent',
      municipality: 'Coyoacán',
      from: '2026-11-12',
      to: '2026-11-15',
      lat: '19.43',
      lng: '-99.13',
      radiusKm: '3',
    });
  });

  it('no envía coordenadas sin radio ni radio sin coordenadas (Art. VI)', () => {
    const coords = { lat: 19.43, lng: -99.13 };
    expect(toQueryString(EMPTY_FILTERS, coords)).toBe('limit=20');
    expect(toQueryString({ ...EMPTY_FILTERS, radiusKm: 5 }, null)).toBe('limit=20');
  });

  it('no envía un periodo inválido', () => {
    const query = toQueryString({ ...EMPTY_FILTERS, from: '2026-11-12', to: '2026-11-01' });
    expect(query).toBe('limit=20');
  });

  it('agrega el cursor codificado', () => {
    expect(withCursor('limit=20', null)).toBe('limit=20');
    expect(withCursor('limit=20', 'abc/+=')).toBe('limit=20&cursor=abc%2F%2B%3D');
  });
});
