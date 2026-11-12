// Constantes de las políticas (POL-xx) que la app necesita para validar antes de llamar a la API
// (spec 005, plan P-02). El servidor sigue siendo la autoridad: estos límites solo evitan viajes
// inútiles y deben coincidir con `backend/api/openapi.yaml` (`ItemInput`).

export const POLICY = {
  photos: { min: 1, max: 5 },
  title: { min: 3, max: 80 },
  description: { max: 1000 },
  usageRules: { max: 500 },
  zone: { min: 2, max: 60 },
  /** Valor declarado: de $50 a $100,000, en centavos (POL-04). */
  declaredValueCents: { min: 5_000, max: 10_000_000 },
  /** Precio mínimo por día en renta: $10, en centavos (POL-04). */
  minRentPriceCents: 1_000,
  /** Objetos por página en «Mis objetos». */
  pageSize: 20,
  /** Búsqueda (spec 006, contrato `GET /items`): texto de 2 a 80, radios en km, periodo máximo en días. */
  search: {
    qMin: 2,
    qMax: 80,
    debounceMs: 400,
    pageSize: 20,
    radiiKm: [1, 3, 5, 10],
    maxRangeDays: 7,
    /** Decimales de las coordenadas enviadas (≈1 km): ubicación mínima, Art. VI. */
    coordDecimals: 2,
  },
} as const;
