---
name: expo-router-structure
description: Estructura de rutas con Expo Router, pantallas delgadas, carpetas por funcionalidad, tokens de tema y textos centralizados en la app móvil de VAIVÉN. Úsala al crear rutas, layouts, pantallas, componentes de UI o carpetas de features.
---

# Skill: Expo Router y estructura de la app

## Rutas (`src/app/`)
- Una ruta = un archivo. `_layout.tsx` define navegación y proveedores; `index.tsx` es la ruta `/`; `+not-found.tsx` atrapa rutas inexistentes.
- Grupos `(nombre)` organizan sin afectar la URL. Parámetros: `[id].tsx` → `useLocalSearchParams()`.
- Verifica nombres y *hooks* con la documentación de la versión de Expo fijada en `memoria.md`.

## Pantalla delgada (patrón obligatorio)
```tsx
// src/app/(dev)/diagnostico.tsx
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useMeta } from '@/features/diagnostics/hooks/useMeta';
import { es } from '@/i18n/es-MX';

export default function DiagnosticoScreen() {
  const { data, isPending, error, refetch } = useMeta();
  if (isPending) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  return (
    <Screen title={es.diagnostics.title}>
      <AppText>{data.version}</AppText>
    </Screen>
  );
}
```
La pantalla **compone**; la obtención de datos vive en un *hook* de la funcionalidad.

## Carpetas por funcionalidad
```
src/features/<nombre>/
  api/          # funciones que llaman a lib/api y validan con zod
  hooks/        # useX con TanStack Query
  components/   # componentes propios de la funcionalidad
  types.ts      # esquemas zod + tipos derivados
```
Reglas de importación: `app → features → components/lib/theme`. Una feature **no** importa de otra.

## Tokens de tema (`src/theme/`)
```ts
export const colors = { primary: '#…', ink: '#…', surface: '#…', danger: '#…' } as const;
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 6, md: 12, pill: 999 } as const;
export const typography = { body: { fontSize: 16, lineHeight: 22 }, title: { fontSize: 24, lineHeight: 30, fontWeight: '700' } } as const;
```
En componentes: `StyleSheet.create({ box: { padding: spacing.md, backgroundColor: colors.surface } })`. **Nunca** valores literales.

## Textos (`src/i18n/es-MX.ts`)
```ts
export const es = { common: { retry: 'Reintentar', loading: 'Cargando…' }, errors: { network_error: 'Sin conexión. Revisa tu internet.' } } as const;
```
Ningún texto visible literal en componentes. Mensajes de error del servidor ya llegan en español; los códigos propios del cliente se traducen aquí.

## Componentes base (`src/components/ui/`)
`Screen`, `AppText`, `Button`, `LoadingState`, `ErrorState`. Antes de crear un componente nuevo, comprueba que ninguno existente sirva. Controles sin texto: `accessibilityLabel`. Área táctil ≥ 44×44.

## Estados de datos remotos
Siempre: **cargando** (`LoadingState`), **error** (`ErrorState` con reintento) y **vacío** (mensaje de `i18n`).

## Lista de comprobación
- [ ] ¿La pantalla solo compone y no hace `fetch`?
- [ ] ¿Sin textos ni valores de diseño literales?
- [ ] ¿Alias `@/` en lugar de rutas relativas largas?
- [ ] ¿Contempla cargando, error y vacío?
- [ ] ¿La feature no importa de otra feature?
