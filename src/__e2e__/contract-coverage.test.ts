import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Spec 021-T031 (RF-28, RF-29, CA-12): cada operación de ../vaiven-backend/api/openapi.yaml está
// clasificada en docs/calidad/contrato-endpoints.md como consumida, fuera de alcance móvil o
// pendiente. Solo lee archivos (sin red). Sin el contrato junto al repositorio la parte que lo lee se
// omite con un aviso, como contract.test.ts; las reglas del inventario se prueban siempre.
const lib =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('../../scripts/contract-lib.cjs') as typeof import('../../scripts/contract-lib.cjs');

const RAIZ = resolve(__dirname, '../..');
const INVENTARIO = resolve(RAIZ, 'docs/calidad/contrato-endpoints.md');
const ruta = resolve(process.env.VAIVEN_OPENAPI ?? '../vaiven-backend/api/openapi.yaml');
const hay = existsSync(ruta);
if (!hay) {
  console.warn(
    `contract-coverage.test: sin contrato en ${ruta}; se omite (define VAIVEN_OPENAPI).`,
  );
}
const describeSiHay = hay ? describe : describe.skip;

const METODOS = ['get', 'post', 'put', 'patch', 'delete'] as const;
const ESTADOS = ['consumida', 'fuera de alcance móvil', 'pendiente'] as const;
type Estado = (typeof ESTADOS)[number];
type Fila = { operacion: string; estado: string; detalle: string };

/** Operaciones del contrato como «MÉTODO /ruta», en el orden del archivo. */
function operacionesDelContrato(archivo: string): string[] {
  const contrato = lib.cargarContrato(archivo);
  const paths = (contrato.documento as { paths?: Record<string, unknown> }).paths ?? {};
  const salida: string[] = [];
  for (const [plantilla, item] of Object.entries(paths)) {
    const { nodo } = contrato.deref(item, contrato.raiz) as { nodo: Record<string, unknown> };
    for (const m of METODOS)
      if (nodo[m] !== undefined) salida.push(`${m.toUpperCase()} ${plantilla}`);
  }
  return salida;
}

/** Filas de la tabla «Operaciones»: la primera celda es la operación entre comillas invertidas. */
function leerInventario(texto: string): Fila[] {
  const filas: Fila[] = [];
  for (const linea of texto.split(/\r?\n/)) {
    const m = /^\|\s*`((?:GET|POST|PUT|PATCH|DELETE) [^`]+)`\s*\|([^|]*)\|(.*)\|\s*$/.exec(linea);
    if (m === null) continue;
    filas.push({ operacion: m[1]!, estado: m[2]!.trim(), detalle: m[3]!.trim() });
  }
  return filas;
}

/** Devuelve los problemas del inventario frente al contrato; vacío si está completo y coherente. */
function revisarInventario(
  operaciones: readonly string[],
  filas: readonly Fila[],
  archivoExiste: (relativo: string) => boolean,
): string[] {
  const problemas: string[] = [];
  const vistas = new Map<string, Fila>();
  for (const fila of filas) {
    if (vistas.has(fila.operacion)) problemas.push(`${fila.operacion}: fila repetida`);
    vistas.set(fila.operacion, fila);
    if (!operaciones.includes(fila.operacion)) {
      problemas.push(`${fila.operacion}: no existe en el contrato`);
    }
    if (!(ESTADOS as readonly string[]).includes(fila.estado)) {
      problemas.push(`${fila.operacion}: estado desconocido «${fila.estado}»`);
      continue;
    }
    const estado = fila.estado as Estado;
    if (fila.detalle === '') problemas.push(`${fila.operacion}: falta el archivo, motivo o tarea`);
    if (fila.operacion.includes('/admin/') && estado !== 'fuera de alcance móvil') {
      problemas.push(
        `${fila.operacion}: las operaciones de administración son fuera de alcance móvil (RF-29)`,
      );
    }
    if (estado === 'consumida') {
      const archivos = [...fila.detalle.matchAll(/`(src\/[^`]+)`/g)].map((a) => a[1]!);
      if (archivos.length === 0) problemas.push(`${fila.operacion}: consumida sin archivo citado`);
      for (const a of archivos) {
        if (!archivoExiste(a)) problemas.push(`${fila.operacion}: no existe ${a}`);
      }
    }
  }
  for (const op of operaciones) {
    if (!vistas.has(op)) problemas.push(`${op}: sin clasificar en contrato-endpoints.md`);
  }
  return problemas;
}

const existeEnRepo = (relativo: string) => existsSync(resolve(RAIZ, relativo));

describe('reglas del inventario de contrato (spec 021-T031)', () => {
  const ops = ['GET /api/v1/items', 'GET /api/v1/admin/reports'];
  const completo: Fila[] = [
    {
      operacion: 'GET /api/v1/items',
      estado: 'consumida',
      detalle: '`src/features/search/api.ts`',
    },
    {
      operacion: 'GET /api/v1/admin/reports',
      estado: 'fuera de alcance móvil',
      detalle: 'Back-office',
    },
  ];

  it('acepta un inventario completo', () => {
    expect(revisarInventario(ops, completo, existeEnRepo)).toEqual([]);
  });

  it('falla ante una operación sin clasificar (caso negativo)', () => {
    expect(revisarInventario([...ops, 'POST /api/v1/nueva'], completo, existeEnRepo)).toEqual([
      'POST /api/v1/nueva: sin clasificar en contrato-endpoints.md',
    ]);
  });

  it('falla ante una fila que no está en el contrato, repetida o con estado desconocido', () => {
    const filas: Fila[] = [
      ...completo,
      {
        operacion: 'GET /api/v1/items',
        estado: 'consumida',
        detalle: '`src/features/search/api.ts`',
      },
      { operacion: 'GET /api/v1/vieja', estado: 'quizá', detalle: 'x' },
    ];
    expect(revisarInventario(ops, filas, existeEnRepo)).toEqual([
      'GET /api/v1/items: fila repetida',
      'GET /api/v1/vieja: no existe en el contrato',
      'GET /api/v1/vieja: estado desconocido «quizá»',
    ]);
  });

  it('exige que /admin/* sea fuera de alcance móvil y que lo consumido cite un archivo real', () => {
    const filas: Fila[] = [
      { operacion: 'GET /api/v1/items', estado: 'consumida', detalle: '`src/no/existe.ts`' },
      { operacion: 'GET /api/v1/admin/reports', estado: 'pendiente', detalle: 'T999' },
    ];
    expect(revisarInventario(ops, filas, existeEnRepo)).toEqual([
      'GET /api/v1/items: no existe src/no/existe.ts',
      'GET /api/v1/admin/reports: las operaciones de administración son fuera de alcance móvil (RF-29)',
    ]);
  });

  it('exige motivo o tarea y archivo citado', () => {
    const filas: Fila[] = [
      { operacion: 'GET /api/v1/items', estado: 'consumida', detalle: 'en algún lado' },
      { operacion: 'GET /api/v1/admin/reports', estado: 'fuera de alcance móvil', detalle: '' },
    ];
    expect(revisarInventario(ops, filas, existeEnRepo)).toEqual([
      'GET /api/v1/items: consumida sin archivo citado',
      'GET /api/v1/admin/reports: falta el archivo, motivo o tarea',
    ]);
  });

  it('lee las filas de la tabla del documento', () => {
    const texto = [
      '| Operación | Estado | Dónde / motivo |',
      '|---|---|---|',
      '| `GET /healthz` | consumida | `src/features/diagnostics/api/getHealth.ts` (solo desarrollo) |',
      '| consumida | 61 |',
    ].join('\n');
    expect(leerInventario(texto)).toEqual([
      {
        operacion: 'GET /healthz',
        estado: 'consumida',
        detalle: '`src/features/diagnostics/api/getHealth.ts` (solo desarrollo)',
      },
    ]);
  });
});

describeSiHay('inventario de contrato ↔ openapi.yaml (spec 021-T031)', () => {
  const operaciones = hay ? operacionesDelContrato(ruta) : [];
  const filas = leerInventario(readFileSync(INVENTARIO, 'utf8'));

  it('cada operación del contrato está clasificada y cada fila es coherente', () => {
    expect(revisarInventario(operaciones, filas, existeEnRepo)).toEqual([]);
  });

  it('las 6 operaciones de administración son fuera de alcance móvil (RF-29)', () => {
    const admin = filas.filter((f) => f.operacion.includes('/admin/'));
    expect(admin).toHaveLength(6);
    expect(admin.every((f) => f.estado === 'fuera de alcance móvil')).toBe(true);
  });
});
