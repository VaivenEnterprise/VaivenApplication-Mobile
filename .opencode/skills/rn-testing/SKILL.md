---
name: rn-testing
description: Pruebas en la app móvil de VAIVÉN con Jest, jest-expo y React Native Testing Library - configuración, patrones para lib, hooks con TanStack Query y componentes, y simulación de fetch. Úsala al escribir o corregir pruebas.
---

# Skill: Pruebas en React Native (Jest + RNTL)

## Configuración base
- Preset `jest-expo`; alias `@/` mapeado con `moduleNameMapper` (`'^@/(.*)$': '<rootDir>/src/$1'`).
- Archivos `*.test.ts` / `*.test.tsx` junto al código probado.
- Cobertura mínima 80 % en `src/lib/` y `src/features/*/hooks/` (Art. IX).
- Comando: `npm test` (`jest --coverage`).

## Lógica pura (`lib/`)
```ts
describe('formatMXN', () => {
  it.each([
    [0, '$0.00'],
    [12345, '$123.45'],
    [100, '$1.00'],
  ])('formatea %i centavos como %s', (cents, expected) => {
    expect(formatMXN(cents).replace(/\s/g, '')).toBe(expected);
  });
});
```
(Normaliza espacios porque `Intl` puede insertar espacios no separables.)

## Simular la red
```ts
const mockFetch = (status: number, body: unknown) =>
  jest.spyOn(global, 'fetch').mockResolvedValue({ ok: status >= 200 && status < 300, status, json: async () => body } as Response);

afterEach(() => jest.restoreAllMocks());
```
Casos mínimos para `request`: éxito válido, esquema inválido (`invalid_response`), 400 con detalles, 404, 500, `fetch` que rechaza (`network_error`), abortado (`timeout` con `jest.useFakeTimers()`).

## Hooks con TanStack Query
```tsx
const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

it('devuelve la meta', async () => {
  mockFetch(200, { name: 'vaiven-backend', version: '1.0.0', environment: 'test', serverTime: '2026-10-26T15:00:00Z' });
  const { result } = renderHook(() => useMeta(), { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data?.name).toBe('vaiven-backend');
});
```
Un `QueryClient` nuevo por prueba; `retry: false` en pruebas.

## Componentes
```tsx
it('muestra el estado de error y reintenta', async () => {
  const onRetry = jest.fn();
  render(<ErrorState error={new ApiError('network_error', '', null, null)} onRetry={onRetry} />);
  fireEvent.press(screen.getByRole('button', { name: es.common.retry }));
  expect(onRetry).toHaveBeenCalledTimes(1);
});
```
- Consulta por rol, texto (`es.…`) o `accessibilityLabel`; nunca por estructura interna.
- Textos esperados provienen de `i18n/es-MX.ts`.

## Reglas
- Sin llamadas reales a red ni al backend.
- Sin dependencias de la hora real; usa temporizadores falsos.
- Una prueba, un comportamiento; nombres que describan el resultado esperado.
- Si una prueba es frágil, corrige la causa; no la elimines ni la marques `skip` sin registrarlo en `memoria.md`.

## Lista de comprobación
- [ ] ¿Caso feliz, bordes y errores?
- [ ] ¿`fetch` simulado y restaurado?
- [ ] ¿Consultas por rol/texto/label?
- [ ] ¿Cobertura ≥ 80 % en las carpetas exigidas?
