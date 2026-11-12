// Geometría del mapa esquemático del vecindario (spec 007 §7.2, RF-14, plan P-08). Convierte las
// ubicaciones aproximadas de los objetos en posiciones relativas al usuario. Solo trabaja con
// zonas aproximadas: nunca se dibuja ni se muestra una coordenada exacta (Art. VI).

export type LatLng = { lat: number; lng: number };

export type PinInput = {
  id: string;
  /** Ubicación aproximada del objeto; `null` o ausente → el pin no se dibuja. */
  location: LatLng | null | undefined;
};

export type PlacedPin = {
  id: string;
  /** Posición en el círculo unidad: `x` hacia el este, `y` hacia abajo (como en pantalla). */
  x: number;
  y: number;
  /** Distancia al usuario en metros. */
  distanceM: number;
};

/** Parte del radio mostrado que ocupa el pin más lejano. */
export const FARTHEST_FILL = 0.8;
const METERS_PER_DEGREE = 111_320;
const RADIUS_STEP_M = 100;
const MIN_RADIUS_M = 400;
const ROUNDING_EPSILON = 1e-6;

const isFiniteLocation = (point: LatLng): boolean =>
  Number.isFinite(point.lat) && Number.isFinite(point.lng);

/** Desplazamiento en metros de `point` respecto de `origin` (aproximación plana, válida a unos km). */
export function offsetMeters(origin: LatLng, point: LatLng): { east: number; north: number } {
  const north = (point.lat - origin.lat) * METERS_PER_DEGREE;
  const east =
    (point.lng - origin.lng) * METERS_PER_DEGREE * Math.cos((origin.lat * Math.PI) / 180);
  return { east, north };
}

/**
 * Coloca los pines con ubicación; los demás se omiten. Se escala para que el más lejano quede al
 * 80 % del radio: la escala depende de los pines presentes, no de un radio fijo.
 */
export function placePins(origin: LatLng, pins: readonly PinInput[]): PlacedPin[] {
  const located = pins.flatMap((pin) => {
    const { location } = pin;
    if (location == null || !isFiniteLocation(location) || !isFiniteLocation(origin)) return [];
    const { east, north } = offsetMeters(origin, location);
    return [{ id: pin.id, east, north, distanceM: Math.hypot(east, north) }];
  });
  const farthest = Math.max(0, ...located.map((pin) => pin.distanceM));
  const scale = farthest === 0 ? 0 : FARTHEST_FILL / farthest;
  return located.map(({ id, east, north, distanceM }) => ({
    id,
    x: east * scale,
    y: -north * scale,
    distanceM,
  }));
}

/** Radio que representa el círculo del mapa, redondeado hacia arriba a 100 m (mínimo 400 m). */
export function displayRadiusM(placed: readonly PlacedPin[]): number {
  const farthest = Math.max(0, ...placed.map((pin) => pin.distanceM));
  // La tolerancia evita que 800 / 0.8 = 1000.0000000000001 suba un escalón por error de redondeo.
  const radius =
    Math.ceil(farthest / FARTHEST_FILL / RADIUS_STEP_M - ROUNDING_EPSILON) * RADIUS_STEP_M;
  return Math.max(MIN_RADIUS_M, radius);
}

/** «~300 m» o «~1.2 km» a partir de los kilómetros que devuelve el servidor (1 decimal). */
export function distanceLabel(km: number | null | undefined): string | null {
  if (km == null || !Number.isFinite(km) || km < 0) return null;
  if (km < 1) return `~${Math.round((km * 1000) / 50) * 50} m`;
  return `~${km.toFixed(1)} km`;
}
