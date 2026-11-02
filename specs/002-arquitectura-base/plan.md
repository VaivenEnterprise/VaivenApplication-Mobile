# Plan 002 — Arquitectura base de la app móvil

- **Spec:** `spec.md` (mismo directorio)
- **Constitución:** v1.0.0
- **Estado:** Borrador, pendiente de aprobación humana

## 1. Enfoque

Crear el proyecto Expo con TypeScript estricto y construir el esqueleto de adentro hacia afuera: configuración y utilidades puras → *tokens* y textos → cliente de API y caché → componentes base → rutas y pantallas → calidad y automatización. No se crean funcionalidades de negocio; `src/features/` contiene solo `diagnostics` (la comprobación de conectividad) como ejemplo del patrón por funcionalidad.

## 2. Estructura de archivos a crear

```
vaiven-frontend/
├─ src/
│  ├─ app/
│  │  ├─ _layout.tsx                     # proveedores + Stack
│  │  ├─ index.tsx                       # pantalla base de inicio
│  │  ├─ +not-found.tsx
│  │  └─ (dev)/{_layout.tsx, diagnostico.tsx}   # solo en desarrollo
│  ├─ components/
│  │  ├─ ui/{Screen,AppText,Button,LoadingState,ErrorState}.tsx (+ .test.tsx)
│  │  └─ AppErrorBoundary.tsx
│  ├─ features/diagnostics/
│  │  ├─ api/getMeta.ts
│  │  ├─ hooks/useMeta.ts (+ .test.tsx)
│  │  └─ types.ts
│  ├─ lib/
│  │  ├─ config.ts (+ .test.ts)
│  │  ├─ api/{client.ts, errors.ts, request-id.ts} (+ tests)
│  │  ├─ query/queryClient.ts (+ test)
│  │  ├─ storage/secureStorage.ts (+ test)
│  │  └─ format/{money.ts, date.ts} (+ tests)
│  ├─ theme/{tokens.ts, index.ts}
│  ├─ i18n/es-MX.ts
│  └─ providers/AppProviders.tsx
├─ app.config.ts · package.json · tsconfig.json
├─ eslint.config.js · .prettierrc · jest.config.js · jest.setup.ts
├─ .env.example · .gitignore
└─ README.md
```

## 3. Decisiones técnicas

| # | Decisión | Motivo | Art. |
|---|---|---|---|
| P-01 | Proyecto creado con la plantilla TypeScript de `create-expo-app` y reorganizado a `src/` | Punto de partida oficial | VI, X |
| P-02 | `tsconfig`: `strict`, `noUncheckedIndexedAccess`, alias `@/*` → `src/*` | Tipado estricto | III, VI |
| P-03 | Configuración con `zod` sobre `process.env.EXPO_PUBLIC_*` | Validación en un solo lugar | II, III |
| P-04 | Cliente `fetch` propio con `AbortController` (10 s), validación `zod` y `ApiError` | Sin dependencias extra; error único | IV, X |
| P-05 | `X-Request-Id` de 32 hex generado con `Math.random` (no criptográfico, solo correlación) | Sin dependencias; no es secreto | IV |
| P-06 | TanStack Query v5 con `staleTime` 30 s, reintento 1 para red/5xx y 0 para 4xx | Alinea con convenciones de datos | X, §6 |
| P-07 | `StyleSheet` + *tokens* provisionales; sin librería de UI | Menos dependencias | VII, X |
| P-08 | Formato con `Intl.NumberFormat`/`DateTimeFormat` (`es-MX`, zona del dispositivo) | Disponible en Hermes | V |
| P-09 | `expo-secure-store` envuelto en `secureStorage` | Almacenamiento seguro | VIII |
| P-10 | Ruta `(dev)` protegida: `_layout` redirige a `/` si `config.appEnv !== 'development'` | Diagnóstico solo en desarrollo | VI, VIII |
| P-11 | Prueba automática que busca literales de color (`#xxxxxx`) y cadenas visibles fuera de `theme/` e `i18n/` | Hace verificable RNF-04 | VII |

## 4. Diseño por componente

### 4.1 Configuración (`lib/config.ts`)
| Variable | Obligatoria | Por defecto | Descripción |
|---|---|---|---|
| `EXPO_PUBLIC_API_URL` | **Sí** | — | URL base del backend, sin `/` final (p. ej. `http://10.0.2.2:8080`) |
| `EXPO_PUBLIC_APP_ENV` | No | `development` | `development` · `production` |

`config.ts` exporta `loadConfig()` (puro, probado) y `config` (resultado en tiempo de ejecución). Si la validación falla, `_layout.tsx` muestra `ConfigErrorScreen` con el mensaje de `i18n`.
Valores **públicos**: nunca secretos (Art. VIII).

### 4.2 Tokens de diseño (provisionales)
| Grupo | Valores |
|---|---|
| `colors` | `primary` `#0F7B6C`, `ink` `#0E3B43`, `surface` `#FFFFFF`, `background` `#F5F8F8`, `muted` `#5B6B70`, `danger` `#B3261E`, `onPrimary` `#FFFFFF` |
| `spacing` | `xs` 4 · `sm` 8 · `md` 16 · `lg` 24 · `xl` 32 |
| `radius` | `sm` 6 · `md` 12 · `pill` 999 |
| `typography` | `body` 16/22 · `bodyBold` 16/22 700 · `title` 24/30 700 · `caption` 13/18 |
| `touch` | `minSize` 44 |
Marcados como provisionales hasta resolver la pregunta abierta de la spec §7.

### 4.3 Textos (`i18n/es-MX.ts`)
Secciones: `common` (reintentar, cargando, volver), `home` (título y subtítulo de la pantalla base), `diagnostics` (títulos y etiquetas), `errors` (un mensaje por cada `ApiErrorCode`, más `unexpected` y `config`), `notFound`.

### 4.4 Cliente de API (`lib/api/`)
- `errors.ts`: `ApiErrorCode`, clase `ApiError`, `fromServerError(status, body, requestId)`.
- `request-id.ts`: `newRequestId()` (32 hex).
- `client.ts`: `request<T>(path, schema, init?)` según la skill `react-query-api-client`.
- Esquema del envoltorio de error del servidor definido con `zod`; si el cuerpo de un error no lo cumple, se deriva el `code` del estado HTTP (400→`validation_failed`, 401, 403, 404, 409, 429, 5xx→`internal_error`/`service_unavailable`).

### 4.5 Componentes base (`components/ui/`)
| Componente | Responsabilidad |
|---|---|
| `Screen` | Contenedor con área segura, fondo, relleno y título opcional |
| `AppText` | Texto con variantes de `typography` y color por *token* |
| `Button` | Botón con variantes `primary`/`secondary`, estado deshabilitado/cargando, rol `button`, área ≥ 44 |
| `LoadingState` | Indicador de actividad con texto accesible |
| `ErrorState` | Mensaje (por `ApiError.code` → `i18n`), `requestId` pequeño opcional y botón de reintento |
`AppErrorBoundary` (clase) muestra `ErrorState` genérico y permite reintentar (reinicia su estado).

### 4.6 Rutas
| Ruta | Archivo | Contenido |
|---|---|---|
| `/` | `app/index.tsx` | Pantalla base con título y subtítulo (sin lógica) |
| `/diagnostico` | `app/(dev)/diagnostico.tsx` | Consulta `/meta` y muestra resultado; solo desarrollo |
| otras | `app/+not-found.tsx` | Mensaje y botón para volver al inicio |

### 4.7 Feature `diagnostics`
- `types.ts`: `metaSchema = z.object({ name, version, environment, serverTime })`.
- `api/getMeta.ts`: `request('/meta', metaSchema)`.
- `hooks/useMeta.ts`: `useQuery({ queryKey: ['meta'], queryFn: getMeta })`.
Contrato consumido: `GET /api/v1/meta` del backend (spec 002 del backend, RF-06).

### 4.8 Utilidades
- `formatMXN(cents: number): string` → `$123.45` (`Intl.NumberFormat('es-MX', {style:'currency', currency:'MXN'})` con `cents / 100`; **solo para mostrar**).
- `formatDate(iso)` y `formatDateTime(iso)` con `Intl.DateTimeFormat('es-MX', …)`.
- `secureStorage.get/set/remove` con manejo de errores devuelto como `null`/`false`.

## 5. Dependencias (registradas también en `memoria.md`)

| Paquete | Uso |
|---|---|
| `expo`, `react`, `react-native` | Base |
| `expo-router`, `react-native-safe-area-context`, `react-native-screens` | Navegación |
| `expo-constants`, `expo-status-bar` | Utilidades de Expo |
| `expo-secure-store` | Almacenamiento seguro |
| `@tanstack/react-query` | Datos del servidor |
| `zod` | Validación |
| Dev: `typescript`, `eslint`, `eslint-config-expo`, `prettier` | Calidad |
| Dev: `jest`, `jest-expo`, `@testing-library/react-native`, `@types/jest` | Pruebas |
Los módulos de Expo se instalan con `npx expo install`.

## 6. Estrategia de pruebas

| Nivel | Qué | Herramienta |
|---|---|---|
| Unitaria | `config`, `errors`, `request-id`, `client` (éxito, 4xx, 5xx, esquema inválido, red, timeout), `queryClient`, `format/*`, `secureStorage` (con módulo simulado) | Jest |
| Hook | `useMeta` con `QueryClientProvider` y `fetch` simulado | RNTL `renderHook` |
| Componente | `Button`, `ErrorState`, `LoadingState`, `AppErrorBoundary` | RNTL |
| Convención | Prueba que falla si hay colores literales o textos visibles literales fuera de `theme/` e `i18n/` | Jest + lectura de archivos |
| Calidad | `tsc --noEmit`, `eslint`, `prettier --check` | npm scripts (en local) |

## 7. Verificación de constitución

| Art. | ¿Cumple? | Cómo |
|---|---|---|
| I | Sí | Spec → plan → tasks antes de código |
| II | Sí | Todo pasa por `lib/api`; URL desde configuración |
| III | Sí | `strict`, `zod`, sin `any` |
| IV | Sí | Errores normalizados, `X-Request-Id`, consume `/api/v1/meta` |
| V | Sí | `formatMXN`, fechas con `Intl`, textos en `i18n` |
| VI | Sí | Pantallas delgadas, feature `diagnostics`, alias `@/` |
| VII | Sí | Tokens, componentes base, estados cargando/error |
| VIII | Sí | `secureStorage`; solo variables públicas no secretas |
| IX | Sí | Cobertura ≥ 80 %, typecheck, lint |
| X | Sí | Solo dependencias del stack fijo; sin Zustand ni librería de UI |
| XI | Sí | Tareas pequeñas con agente asignado |
| XII | Sí | Cambios de principios pasan por `memoria.md` |

## 8. Fases

1. **Fase 0 — Preparación:** proyecto Expo, TypeScript estricto, calidad y pruebas.
2. **Fase 1 — Fundamentos:** configuración, *tokens*, textos, utilidades, almacenamiento.
3. **Fase 2 — Datos y errores:** cliente de API, caché, feature `diagnostics`.
4. **Fase 3 — UI y rutas:** componentes base, *error boundary*, rutas, proveedores.
5. **Fase 4 — Cierre:** README, memoria, revisión y verificación en Expo Go.

## 9. Riesgos

| Riesgo | Mitigación |
|---|---|
| El modelo gratuito propone APIs obsoletas de Expo Router o RN | Fijar versión del SDK en `memoria.md`; verificar con `npx expo-doctor` y documentación de esa versión |
| `localhost` no funciona desde el emulador/dispositivo | README con tabla de URLs: Android `10.0.2.2`, iOS simulador `localhost`, físico IP local |
| Android bloquea HTTP sin cifrar | Permitir tráfico HTTP solo en desarrollo (configuración documentada en `app.config.ts`); producción solo HTTPS (Art. VIII) |
| `Intl` con formatos distintos entre plataformas | Pruebas normalizan espacios; verificar en emulador |
| Paleta provisional se vuelve definitiva sin revisión | Pregunta abierta registrada en spec y memoria |

## 9. Servicios y entorno local (movido desde la antigua spec de servicios)
Archivos: `app.config.ts` (modificar) · `.env.example` · `src/config/env.ts` (modificar) · `src/features/diagnostics/` (ampliar con versión y readyz).

| # | Decisión | Art. |
|---|---|---|
| P-S1 | Variables públicas con prefijo `EXPO_PUBLIC_`, validadas con el esquema de T005 | VI |
| P-S2 | Permisos declarados desde ahora (cámara, ubicación, fotos, notificaciones) para no tocar `app.config.ts` en cada feature | II |
| P-S3 | Módulos aprobados que se instalan aquí y funcionan en Expo Go: `expo-camera`, `expo-location`, `expo-image-picker`, `expo-image-manipulator`, `expo-image`, `expo-notifications`, `expo-device`, `expo-linking`, `react-native-svg`, `react-native-qrcode-svg`, `@react-native-community/datetimepicker`. **Sin** `expo-dev-client` ni EAS | II.4, XIV |
| P-S4 | `react-hook-form` y `@hookform/resolvers` los agrega la spec 003 | X.4 |
