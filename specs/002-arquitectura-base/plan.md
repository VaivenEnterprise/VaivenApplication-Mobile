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
│  │  ├─ ui/{Screen,AppText,Button,LoadingState,ErrorState,AppIcon,BrandMark,GradientBackground,Card,Chip,IconBadge,Divider,BottomSheet,SearchBar,Avatar,ListRow,ProgressBar,SegmentedControl,RatingStars,Skeleton,Banner}.tsx (+ .test.tsx)
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
| P-07 | `StyleSheet` + *tokens* del diseño aprobado (§4.2); sin librería de UI. Gradientes con `expo-linear-gradient`, íconos con `@expo/vector-icons`, ilustraciones SVG con `react-native-svg` y tipografía Plus Jakarta Sans con `expo-font` | Reproducir el diseño de Stitch con pocas dependencias, todas de Expo o de su ecosistema | VII, X |
| P-12 | Solo modo claro (`userInterfaceStyle: 'light'`); el diseño aprobado no define modo oscuro | Alcance del diseño | VII |
| P-13 | Las fuentes se cargan con `useFonts` en `_layout.tsx`; el *splash* se mantiene hasta que carguen. Si fallan, se usa la fuente del sistema y la app sigue funcionando | Evita parpadeo de texto sin estilo sin bloquear la app | X |
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

`config.ts` exporta `loadConfig(env)` (puro, probado; lanza `ConfigError`), `tryLoadConfig(env)` (devuelve `{ ok, config | error }` sin lanzar), `configResult` (resultado de validar el entorno al iniciar) y `getConfig()` (configuración válida o `ConfigError`). Las variables se leen por su nombre completo (`process.env.EXPO_PUBLIC_API_URL`), porque Expo no sustituye `process.env` entero. Se normalizan los espacios y las barras finales; en `production` la URL debe ser `https`. Si la validación falla, `_layout.tsx` muestra `ConfigErrorScreen` con el mensaje de `i18n`.
Valores **públicos**: nunca secretos (Art. VIII).

### 4.2 Tokens de diseño (v1 — diseño de Stitch, 9 nov 2026)
Referencia visual: `docs/diseno/referencia/` (inicio de sesión, registro, inicio). **Esencia:** cálido y vecinal. Crema de fondo, terracota como color de marca, verde como apoyo, esquinas muy redondeadas, campos con ícono en círculo tintado, sombras suaves con tinte cálido. Una sola paleta para todas las pantallas (en las capturas el registro usaba un café distinto al coral del inicio de sesión; aquí se unifican).
Contraste verificado (WCAG AA, texto normal ≥ 4.5:1): `onPrimary` sobre `primary` 4.8:1 (sobre el degradado, 4.5:1 a 5.9:1) · `onPrimary` sobre `secondary` 5.3:1 · `primaryInk` sobre `primarySoft` 6.4:1 · `muted` sobre `background` 5.6:1.
**Regla de uso:** `primary` y `secondary` son para relleno, íconos y texto grande (≥ 18.66 pt en negrita, p. ej. títulos). El **texto pequeño** sobre fondo claro (enlaces, pestaña activa, chips) usa `primaryPressed`, `primaryInk` o `secondaryPressed`, porque `primary` sobre `background` da solo 4.4:1 y sobre `primarySoft` 3.9:1.

| Grupo | Token → valor |
|---|---|
| `colors` (marca) | `primary` `#C24E24` · `primaryPressed` `#A33F1A` · `primarySoft` `#FBE4D8` · `primaryInk` `#8A3A1B` · `secondary` `#1B7A57` · `secondaryPressed` `#146B4B` · `secondarySoft` `#DDF1E7` |
| `colors` (neutros) | `background` `#FAF6F0` · `surface` `#FFFFFF` · `surfaceMuted` `#F3EEE7` · `border` `#E9DED2` · `ink` `#2A1F1A` · `muted` `#6F6058` · `placeholder` `#8F8179` · `onPrimary` `#FFFFFF` |
| `colors` (estado) | `danger` `#B3261E` · `dangerSoft` `#FDE8E6` · `success` `#1B7A57` · `warning` `#8A5A00` · `warningSoft` `#FFF1D6` · `scrim` `rgba(30,18,12,0.72)` |
| `gradients` | `authBackground` `#FFF6EE → #FBE3D3 → #F6C9B0` (diagonal) · `primaryButton` `#C65227 → #AE411A` (horizontal) · `secondaryButton` `#1B7A57 → #146B4B` (horizontal) · `heroScrim` `transparent → scrim` (vertical) · `slotWarm` `#FBE4D8 → #F6CFBB` · `slotGreen` `#DDF1E7 → #C4E6D4` |
| `colors` (mapa esquemático) | `mapLand` `#F1EADF` · `mapBlock` `#E7DDCF` · `mapRoad` `#FFFFFF` · `mapPark` `#D9EAD9` · `userDot` `#2F6BFF` |
| `spacing` | `xs` 4 · `sm` 8 · `smd` 12 · `md` 16 · `gutter` 20 (margen horizontal de pantalla) · `lg` 24 · `xl` 32 · `xxl` 48 |
| `radius` | `sm` 8 · `md` 14 · `lg` 20 (campos y botones) · `xl` 28 (tarjetas y hojas) · `pill` 999 |
| `fontFamily` | `regular` `PlusJakartaSans_400Regular` · `medium` `_500Medium` · `semibold` `_600SemiBold` · `bold` `_700Bold` · `extrabold` `_800ExtraBold` |
| `typography` | `display` 32/38 extrabold, interlineado de letra −0.5 (título de bienvenida) · `title` 26/32 extrabold · `heading` 20/26 bold · `subheading` 17/24 bold · `body` 16/22 regular · `bodyStrong` 16/22 semibold · `label` 14/20 semibold (etiqueta de campo) · `eyebrow` 12/16 bold, mayúsculas, +0.8 · `caption` 13/18 medium · `button` 16/20 bold · `tab` 11/14 semibold |
| `shadows` | `soft` y 2, desenfoque 8, `ink` 6 % (elevación 2) · `card` y 4, desenfoque 16, `primaryInk` 10 % (elevación 3) · `button` y 8, desenfoque 20, `primary` 30 % (elevación 6) · `fab` y 10, desenfoque 24, `primary` 35 % (elevación 8) |
| `sizes` | `touch.minSize` 44 · `control.height` 56 (campos y botones) · `control.iconBadge` 36 · `avatar` 36 · `brandTile` 40 · `tabBar.height` 68 · `thumb` 56 · `thumbLg` 72 · `pin` 36 · `sheetHandle` 40×4 |
| `motion` | `pressScale` 0.98 · `duration.fast` 120 ms |

Los valores de color y sombra literales viven **solo** en `src/theme/tokens.ts` (Art. VII.1). Cualquier valor que el diseño use y no esté aquí se propone como entrada nueva antes de usarse.

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
| `Screen` | Contenedor con área segura, fondo (`background` o un `GradientBackground`), relleno `gutter` y título opcional; permite desplazamiento y evita el teclado |
| `AppText` | Texto con variantes de `typography` (familia, tamaño, interlineado) y color por *token*; nunca usa `fontWeight` suelto |
| `Button` | Variantes: `primary` (gradiente `primaryButton`, sombra `button`), `secondary` (gradiente `secondaryButton`), `outline`, `danger` (relleno `danger`), `link`. Admite ícono final (p. ej. flecha), estado deshabilitado/cargando (indicador en lugar del ícono, no cambia el ancho), rol `button`, alto `control.height`, escala `pressScale` al pulsar |
| `LoadingState` | Indicador de actividad con texto accesible |
| `ErrorState` | Mensaje (por `ApiError.code` → `i18n`), `requestId` pequeño opcional y botón de reintento |
| `AppIcon` | Ícono por nombre de un conjunto cerrado (mapa propio sobre `@expo/vector-icons`); tamaño y color por *token*; sin `accessibilityLabel` cuando es decorativo |
| `IconBadge` | Ícono dentro de un círculo `primarySoft` (o `secondarySoft`) de `control.iconBadge`; es el adorno inicial de los campos |
| `BrandMark` | Recuadro terracota con «V» y el nombre «VaiVen»; tamaños `sm` y `md` |
| `GradientBackground` | Fondo de pantalla con degradado de `gradients`; variantes `auth` y `plain` |
| `Card` | Superficie `surface` con radio `xl` y sombra `card`; variante `muted` (`surfaceMuted`, sin sombra) |
| `Chip` | Píldora con ícono y texto (zona, «Comunidad segura»); variantes `neutral` y `success` |
| `Divider` | Línea `border` con texto central opcional |
| `BottomSheet` | Hoja inferior sobre `scrim`: asa, esquinas superiores `xl`, botón cerrar «X», se cierra tocando fuera o deslizando; contenido desplazable y pie fijo opcional. Base de filtros, solicitud, resumen, aceptar, cancelar, reportar y eliminar cuenta (sin dependencia nueva: `Modal` + `Animated`) |
| `SearchBar` | Campo en píldora con lupa, botón «borrar» y `accessibilityRole="search"`; acepta un botón final (filtros) |
| `Avatar` | Círculo con la inicial; color de fondo estable por nombre tomado de una paleta cerrada de *tokens*; tamaños 32, 40 y 72 |
| `ListRow` | Fila: ícono o `Avatar` a la izquierda, título, subtítulo opcional y elemento final (chevron, insignia o interruptor); área ≥ 56 |
| `ProgressBar` | Barra de avance `border`/`secondary`, con valor accesible |
| `SegmentedControl` | Dos a cuatro opciones en píldora; la activa en `surface` con sombra `soft`; insignia numérica opcional por opción |
| `RatingStars` | Cinco estrellas, solo lectura o táctil (≥ 44 pt cada una); lee «N de 5» a lector de pantalla |
| `Skeleton` | Bloque `surfaceMuted` con brillo suave; versiones de línea, tarjeta y círculo |
| `Banner` | Aviso de ancho completo con ícono y una línea; variantes `info`, `success`, `warning`, `danger`, `offline` |
`AppErrorBoundary` (clase) muestra `ErrorState` genérico y permite reintentar (reinicia su estado).

### 4.5.1 Fuentes e íconos
`_layout.tsx` carga con `useFonts` los pesos 400, 500, 600, 700 y 800 de Plus Jakarta Sans (`@expo-google-fonts/plus-jakarta-sans`). Los íconos salen de `Ionicons` y `MaterialCommunityIcons` de `@expo/vector-icons`; `AppIcon` es la única puerta de entrada, de modo que cambiar de conjunto no toca las pantallas.

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
| `expo-font`, `@expo-google-fonts/plus-jakarta-sans` | Tipografía del diseño |
| `expo-linear-gradient` | Degradados de fondo y botones |
| `react-native-svg` | Ilustraciones y subrayado ondulado |
| `@expo/vector-icons` | Íconos (`AppIcon`) |
| Dev: `typescript`, `eslint`, `eslint-config-expo`, `prettier` | Calidad |
| `expo-linking` | Requerida por `expo-router` (ya aprobada en P-S3) |
| Dev: `jest`, `jest-expo`, `@testing-library/react-native`, `@types/jest` | Pruebas |
| Dev: `@react-native/jest-preset`, `test-renderer` | Requeridas por `jest-expo` 58 y `@testing-library/react-native` 14 (peer) |
`package.json` fija `react-dom` a 19.3.0 con `overrides` (peer opcional de `expo-router`; no se agrega como dependencia ni se usa web).
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
| Los *tokens* se desvían del diseño de Stitch con el tiempo | Referencia en `docs/diseno/referencia/` y valores únicos en plan §4.2; cualquier valor nuevo se propone como entrada de tema |

## 9. Servicios y entorno local (movido desde la antigua spec de servicios)
Archivos: `app.config.ts` (modificar) · `.env.example` · `src/config/env.ts` (modificar) · `src/features/diagnostics/` (ampliar con versión y readyz).

| # | Decisión | Art. |
|---|---|---|
| P-S1 | Variables públicas con prefijo `EXPO_PUBLIC_`, validadas con el esquema de T005 | VI |
| P-S2 | Permisos declarados desde ahora (cámara, ubicación, fotos, notificaciones) para no tocar `app.config.ts` en cada feature | II |
| P-S3 | Módulos aprobados que se instalan aquí y funcionan en Expo Go: `expo-camera`, `expo-location`, `expo-image-picker`, `expo-image-manipulator`, `expo-image`, `expo-notifications`, `expo-device`, `expo-linking`, `react-native-svg`, `react-native-qrcode-svg`, `@react-native-community/datetimepicker`. **Sin** `expo-dev-client` ni EAS | II.4, XIV |
| P-S4 | `react-hook-form` y `@hookform/resolvers` los agrega la spec 003 | X.4 |
