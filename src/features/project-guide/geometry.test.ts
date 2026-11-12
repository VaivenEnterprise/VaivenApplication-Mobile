import {
  FARTHEST_FILL,
  displayRadiusM,
  distanceLabel,
  offsetMeters,
  placePins,
} from '@/features/project-guide/geometry';

const ORIGIN = { lat: 19.4326, lng: -99.1332 };
const M_PER_DEG = 111_320;
const COS = Math.cos((ORIGIN.lat * Math.PI) / 180);
const north = (m: number) => ({ lat: ORIGIN.lat + m / M_PER_DEG, lng: ORIGIN.lng });
const east = (m: number) => ({ lat: ORIGIN.lat, lng: ORIGIN.lng + m / (M_PER_DEG * COS) });
const south = (m: number) => north(-m);
const west = (m: number) => east(-m);

describe('offsetMeters', () => {
  it('mide norte y este en metros', () => {
    const n = offsetMeters(ORIGIN, north(300));
    expect(n.north).toBeCloseTo(300, 3);
    expect(n.east).toBeCloseTo(0, 3);
    const e = offsetMeters(ORIGIN, east(800));
    expect(e.east).toBeCloseTo(800, 3);
    expect(e.north).toBeCloseTo(0, 3);
  });
});

describe('placePins', () => {
  it('prueba de tabla: un pin a 300 m, otro a 800 m y uno sin ubicación', () => {
    const placed = placePins(ORIGIN, [
      { id: 'cerca', location: north(300) },
      { id: 'lejos', location: east(800) },
      { id: 'sin-zona', location: null },
      { id: 'sin-dato', location: undefined },
    ]);
    expect(placed.map((p) => p.id)).toEqual(['cerca', 'lejos']);
    const [near, far] = placed;
    // El más lejano queda al 80 % del radio, hacia el este (x > 0, y = 0).
    expect(far?.x).toBeCloseTo(FARTHEST_FILL, 6);
    expect(far?.y).toBeCloseTo(0, 6);
    expect(Math.hypot(far!.x, far!.y)).toBeCloseTo(0.8, 6);
    // El de 300 m, al norte (y negativa en pantalla) y a 300/800 del más lejano.
    expect(near?.x).toBeCloseTo(0, 6);
    expect(near?.y).toBeCloseTo(-0.3, 6);
    expect(near?.distanceM).toBeCloseTo(300, 3);
    expect(far?.distanceM).toBeCloseTo(800, 3);
  });

  it('un solo pin a 300 m también queda al 80 %', () => {
    const [pin] = placePins(ORIGIN, [{ id: 'a', location: south(300) }]);
    expect(pin?.x).toBeCloseTo(0, 6);
    expect(pin?.y).toBeCloseTo(0.8, 6);
  });

  it('respeta el cuadrante: oeste es x negativa', () => {
    const placed = placePins(ORIGIN, [
      { id: 'o', location: west(500) },
      { id: 'n', location: north(250) },
    ]);
    expect(placed[0]?.x).toBeCloseTo(-0.8, 6);
    expect(placed[1]?.y).toBeCloseTo(-0.4, 6);
  });

  it('sin pines con ubicación no dibuja nada', () => {
    expect(placePins(ORIGIN, [])).toEqual([]);
    expect(placePins(ORIGIN, [{ id: 'a', location: null }])).toEqual([]);
  });

  it('un pin exactamente en el origen queda al centro', () => {
    expect(placePins(ORIGIN, [{ id: 'a', location: { ...ORIGIN } }])).toEqual([
      { id: 'a', x: 0, y: -0, distanceM: 0 },
    ]);
  });

  it('ignora coordenadas no válidas', () => {
    expect(placePins(ORIGIN, [{ id: 'a', location: { lat: NaN, lng: 1 } }])).toEqual([]);
    expect(placePins({ lat: NaN, lng: 0 }, [{ id: 'a', location: north(10) }])).toEqual([]);
  });
});

describe('displayRadiusM', () => {
  it('redondea hacia arriba a 100 m y no baja de 400 m', () => {
    expect(displayRadiusM(placePins(ORIGIN, [{ id: 'a', location: north(300) }]))).toBe(400);
    expect(displayRadiusM(placePins(ORIGIN, [{ id: 'a', location: east(800) }]))).toBe(1000);
    expect(displayRadiusM(placePins(ORIGIN, [{ id: 'a', location: east(2400) }]))).toBe(3000);
    expect(displayRadiusM([])).toBe(400);
  });
});

describe('distanceLabel', () => {
  it.each([
    [0.3, '~300 m'],
    [0.32, '~300 m'],
    [0.8, '~800 m'],
    [0, '~0 m'],
    [1.2, '~1.2 km'],
    [3, '~3.0 km'],
    [null, null],
    [undefined, null],
    [-1, null],
    [NaN, null],
  ])('%s → %s', (km, expected) => {
    expect(distanceLabel(km as number | null | undefined)).toBe(expected);
  });
});
