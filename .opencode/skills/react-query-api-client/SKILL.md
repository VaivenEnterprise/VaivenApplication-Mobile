---
name: react-query-api-client
description: Cliente de API con fetch, normalización de errores, validación zod y consultas/mutaciones con TanStack Query v5 en la app móvil de VAIVÉN. Úsala al tocar lib/api, hooks de datos, claves de consulta o manejo de errores de red.
---

# Skill: Cliente de API y TanStack Query

## Contrato (compartido con el backend, Art. IV)
- Base: `${EXPO_PUBLIC_API_URL}/api/v1` (desde `lib/config`, nunca literal).
- JSON `camelCase`; fechas ISO UTC; dinero `…Cents`.
- Error del servidor: `{ "error": { code, message, details, requestId } }`.
- Códigos propios del cliente: `network_error`, `timeout`.
- Enviar `X-Request-Id` (≤ 64 alfanuméricos y guiones).

## Error normalizado (`lib/api/errors.ts`)
```ts
export type ApiErrorCode =
  | 'validation_failed' | 'unauthorized' | 'forbidden' | 'not_found' | 'conflict'
  | 'rate_limited' | 'internal_error' | 'service_unavailable'
  | 'network_error' | 'timeout' | 'invalid_response';

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status: number | null,
    public readonly requestId: string | null,
    public readonly details: { field: string; issue: string }[] = [],
  ) { super(message); this.name = 'ApiError'; }
}
```
`invalid_response` = la respuesta no cumple el esquema `zod` esperado.

## Cliente (`lib/api/client.ts`)
```ts
export async function request<T>(path: string, schema: z.ZodType<T>, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS); // 10 000
  const requestId = newRequestId();
  try {
    const res = await fetch(`${config.apiBaseUrl}/api/v1${path}`, {
      ...init,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Request-Id': requestId, ...init.headers },
      signal: controller.signal,
    });
    const body: unknown = await res.json().catch(() => null);
    if (!res.ok) throw fromServerError(res.status, body, requestId);
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new ApiError('invalid_response', es.errors.invalid_response, res.status, requestId);
    return parsed.data;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof DOMException && e.name === 'AbortError') throw new ApiError('timeout', es.errors.timeout, null, requestId);
    throw new ApiError('network_error', es.errors.network_error, null, requestId);
  } finally { clearTimeout(timer); }
}
```
Nunca registrar cuerpos completos ni tokens.

## Hook de consulta
```ts
export const metaKeys = { all: ['meta'] as const };

export function useMeta() {
  return useQuery({ queryKey: metaKeys.all, queryFn: () => request('/meta', metaSchema) });
}
```
- Claves jerárquicas por funcionalidad (`['things','list',filtros]`).
- `QueryClient`: `staleTime` 30 s; `retry` = 1 si el error es `network_error`, `timeout` o 5xx; **0** si es 4xx.

## Mutación
```ts
useMutation({
  mutationFn: (input: Input) => request('/things', thingSchema, { method: 'POST', body: JSON.stringify(input) }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: thingKeys.all }),
});
```

## Reglas
- Todo acceso a red pasa por `request`. Ningún `fetch` fuera de `lib/api`.
- Todo dato de red se valida con `zod` antes de usarse.
- La UI traduce `error.code` a texto con `i18n`; usa `error.message` del servidor solo para `validation_failed` y `conflict`.

## Lista de comprobación
- [ ] ¿Pasa por `request` con esquema `zod`?
- [ ] ¿Errores normalizados a `ApiError`?
- [ ] ¿Clave de consulta definida en constante?
- [ ] ¿Sin reintentos para 4xx?
- [ ] ¿Pruebas de éxito, 4xx, 5xx, red y timeout?
