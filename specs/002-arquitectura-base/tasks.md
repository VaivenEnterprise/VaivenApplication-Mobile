# Tareas 002 — Arquitectura base de la app móvil

- **Spec:** `spec.md` · **Plan:** `plan.md`
- **Estado:** Redactadas, **sin ejecutar**. No empezar hasta que la persona apruebe spec y plan.
- Leyenda: `[P]` = puede hacerse en paralelo con otras `[P]` de la misma fase (no comparten archivos). Una tarea = un cambio pequeño y verificable.
- Agentes: `dev-expo`, `qa-mobile`, `spec-writer`, `revisor-constitucion`.

## Fase 0 — Preparación

- [x] **T001** Crear el proyecto Expo con TypeScript y reorganizarlo a `src/`
  - Archivos: `package.json`, `app.config.ts`, `tsconfig.json`, `.gitignore`, estructura `src/` vacía según plan §2 (con `.gitkeep`)
  - Agente: `dev-expo`
  - Depende de: —
  - Aceptación: `npx expo start` arranca sin errores; `npx expo-doctor` sin problemas críticos; versión del SDK anotada en `memoria.md`; el contenido de ejemplo de la plantilla fue eliminado
  - Refs: plan P-01 · Art. VI, X

- [x] **T002** TypeScript estricto y alias `@/`
  - Archivos: `tsconfig.json`
  - Agente: `dev-expo`
  - Depende de: T001
  - Aceptación: `strict: true`, `noUncheckedIndexedAccess: true`, alias `@/*` → `src/*`; `npx tsc --noEmit` pasa
  - Refs: plan P-02 · Art. III

- [x] **T003** [P] ESLint, Prettier y scripts de calidad
  - Archivos: `eslint.config.js`, `.prettierrc`, `package.json` (scripts)
  - Agente: `dev-expo`
  - Depende de: T002
  - Aceptación: existen `typecheck`, `lint`, `format`; `eslint` prohíbe `any` explícito y `@ts-ignore`; `npm run lint` pasa
  - Refs: RF-13 · Art. III, IX

- [x] **T004** [P] Jest, jest-expo y React Native Testing Library
  - Archivos: `jest.config.js`, `jest.setup.ts`, `package.json` (script `test`), `src/lib/smoke.test.ts`
  - Agente: `qa-mobile`
  - Depende de: T002
  - Aceptación: `npm test` ejecuta la prueba de humo y genera cobertura; el alias `@/` funciona en pruebas
  - Refs: RF-13 · Art. IX

## Fase 1 — Fundamentos

- [x] **T005** Configuración validada
  - Archivos: `src/lib/config.ts`, `src/lib/config.test.ts`, `.env.example`
  - Agente: `dev-expo`
  - Depende de: T003, T004
  - Aceptación: `loadConfig(env)` valida con `zod`; URL inválida o faltante → error con mensaje claro; `appEnv` por defecto `development`; `.env.example` sin secretos; pruebas de tabla
  - Refs: plan §4.1 · RF-02 · Art. II, VIII

- [x] **T006** [P] Tokens de diseño
  - Archivos: `src/theme/tokens.ts`, `src/theme/index.ts`, `package.json`, `package-lock.json`
  - Agente: `dev-expo`
  - Depende de: T003
  - Aceptación: exporta `colors`, `gradients`, `spacing`, `radius`, `fontFamily`, `typography`, `shadows`, `sizes`, `motion` con los valores de plan §4.2 como `as const`; instala con `npx expo install` solo `expo-font`, `@expo-google-fonts/plus-jakarta-sans`, `expo-linear-gradient`, `react-native-svg` y `@expo/vector-icons` (plan §5); `typecheck` pasa
  - Refs: plan §4.2, §5 · RF-04 · Art. II.4, VII

- [x] **T007** [P] Textos es-MX
  - Archivos: `src/i18n/es-MX.ts`
  - Agente: `dev-expo`
  - Depende de: T003
  - Aceptación: exporta `es` con las secciones de plan §4.3; incluye un mensaje por cada `ApiErrorCode` (incl. `network_error`, `timeout`, `invalid_response`), `unexpected` y `config`
  - Refs: RF-05, RF-07 · Art. V

- [x] **T008** [P] Formato de dinero y fechas
  - Archivos: `src/lib/format/money.ts`, `src/lib/format/date.ts`, `src/lib/format/format.test.ts`
  - Agente: `dev-expo`
  - Depende de: T004
  - Aceptación: `formatMXN(12345)` → `$123.45`; `formatMXN(0)` → `$0.00`; `formatDate`/`formatDateTime` reciben ISO UTC y formatean en `es-MX`; entrada inválida no lanza excepción (devuelve cadena vacía); cobertura ≥ 80 %
  - Refs: RF-11 · Art. V

- [x] **T009** [P] Almacenamiento seguro
  - Archivos: `src/lib/storage/secureStorage.ts`, `src/lib/storage/secureStorage.test.ts`
  - Agente: `dev-expo`
  - Depende de: T004
  - Aceptación: `get`, `set`, `remove` sobre `expo-secure-store`; errores del módulo devuelven `null`/`false` sin lanzar; pruebas con el módulo simulado
  - Refs: RF-12 · Art. VIII

## Fase 2 — Datos y errores

- [x] **T010** Errores de API y generador de `requestId`
  - Archivos: `src/lib/api/errors.ts`, `src/lib/api/request-id.ts`, `src/lib/api/errors.test.ts`
  - Agente: `dev-expo`
  - Depende de: T007
  - Aceptación: `ApiError` y `ApiErrorCode` según skill `react-query-api-client`; `fromServerError` toma el envoltorio del backend y, si el cuerpo no lo cumple, deriva el `code` del estado HTTP; `newRequestId()` devuelve 32 caracteres hex; pruebas de tabla por código
  - Refs: plan §4.4 · RF-06, RF-07 · Art. IV

- [x] **T011** Cliente de API
  - Archivos: `src/lib/api/client.ts`, `src/lib/api/client.test.ts`
  - Agente: `dev-expo`
  - Depende de: T005, T010
  - Aceptación: `request(path, schema, init)` usa `config.apiBaseUrl`, envía `X-Request-Id`, aplica tiempo máximo de 10 s, valida con `zod`; casos probados: éxito, 400 con detalles, 404, 500, esquema inválido (`invalid_response`), fallo de red (`network_error`), vencimiento (`timeout`); cobertura ≥ 80 %
  - Refs: RF-06 · CA-05, CA-06, CA-07 · Art. II, IV

- [x] **T012** Caché de consultas y proveedores
  - Archivos: `src/lib/query/queryClient.ts`, `src/lib/query/queryClient.test.ts`, `src/providers/AppProviders.tsx`
  - Agente: `dev-expo`
  - Depende de: T010
  - Aceptación: `staleTime` 30 s; `retry` devuelve true una sola vez para `network_error`, `timeout` y 5xx, y false para 4xx (probado); `AppProviders` envuelve con `QueryClientProvider`
  - Refs: RF-08 · plan P-06 · Art. X

- [x] **T013** Feature `diagnostics`
  - Archivos: `src/features/diagnostics/types.ts`, `src/features/diagnostics/api/getMeta.ts`, `src/features/diagnostics/hooks/useMeta.ts`, `src/features/diagnostics/hooks/useMeta.test.tsx`
  - Agente: `dev-expo`
  - Depende de: T011, T012
  - Aceptación: `useMeta` devuelve `name`, `version`, `environment`, `serverTime` con `fetch` simulado; maneja error de red; clave `['meta']` en constante
  - Refs: plan §4.7 · RF-09 · Art. VI

## Fase 3 — UI y rutas

- [x] **T014** Componentes base: `Screen` y `AppText`
  - Archivos: `src/components/ui/{Screen,AppText,AppIcon,GradientBackground,BrandMark}.tsx`, `src/components/ui/ui.test.tsx`
  - Agente: `dev-expo`
  - Depende de: T006
  - Aceptación: solo usan *tokens* (sin valores literales); `Screen` respeta área segura, admite fondo con degradado y evita el teclado; `AppText` admite todas las variantes de `typography` con su familia de fuente (sin `fontWeight` suelto); `AppIcon` solo acepta nombres de su conjunto cerrado; `BrandMark` en tamaños `sm` y `md`; pruebas de renderizado
  - Refs: plan §4.5 · RF-04 · Art. VII

- [x] **T015** Componentes base: `Button`, `LoadingState`, `ErrorState`
  - Archivos: `src/components/ui/{Button,LoadingState,ErrorState,Card,Chip,IconBadge,Divider}.tsx`, `src/components/ui/states.test.tsx`
  - Agente: `dev-expo`
  - Depende de: T007, T010, T014
  - Aceptación: `Button` con rol `button`, alto 56, variantes `primary`/`secondary`/`outline`/`link`, ícono final opcional, estado cargando/deshabilitado sin cambiar de ancho y escala al pulsar; `ErrorState` muestra el mensaje de `i18n` según `ApiError.code` y llama `onRetry` al pulsar; `LoadingState` con texto accesible; `Card`, `Chip`, `IconBadge` y `Divider` solo con *tokens*; pruebas por rol y texto · Diseño de estados: spec §9.1 (ErrorState y LoadingState con `Skeleton`)
  - Refs: plan §4.5 · RF-04 · RNF-07 · Art. VII

- [x] **T016** Manejador global de errores de renderizado
  - Archivos: `src/components/AppErrorBoundary.tsx`, `src/components/AppErrorBoundary.test.tsx`
  - Agente: `dev-expo`
  - Depende de: T015
  - Aceptación: captura un error de render, muestra mensaje en español y permite reintentar; no registra datos personales; prueba con componente que lanza (CA-08)
  - Refs: RF-10 · Art. VIII

- [x] **T017** Rutas, layout raíz y pantalla base
  - Archivos: `src/app/_layout.tsx`, `src/app/index.tsx`, `src/app/+not-found.tsx`
  - Agente: `dev-expo`
  - Depende de: T005, T012, T015, T016
  - Aceptación: `_layout` carga las fuentes (`useFonts`) y mantiene el *splash* hasta que estén listas, o continúa con la fuente del sistema si fallan (RF-15); envuelve con `AppErrorBoundary` y `AppProviders`; si la configuración es inválida muestra pantalla de error de configuración; `index` y `+not-found` usan solo componentes de `ui/` y textos de `i18n`; la app abre en emulador (CA-01, CA-02) · `+not-found` y pantalla de error de configuración según spec §9.1
  - Refs: plan §4.6 · RF-02, RF-03 · Art. VI

- [x] **T018** Pantalla de diagnóstico (solo desarrollo)
  - Archivos: `src/app/(dev)/_layout.tsx`, `src/app/(dev)/diagnostico.tsx`
  - Agente: `dev-expo`
  - Depende de: T013, T015, T017
  - Aceptación: `(dev)/_layout` redirige a `/` si `config.appEnv !== 'development'`; la pantalla muestra nombre, versión, entorno y hora (con `formatDateTime`) y los estados cargando y error con reintento; con el backend en marcha se ven los datos reales (CA-03) y sin él, el error de conexión (CA-04)
  - Refs: plan §4.6, P-10 · RF-09 · CA-10 · Art. VI, VII

## Fase 4 — Cierre

- [x] **T019** Prueba de convención de diseño y textos
  - Archivos: `src/conventions.test.ts`
  - Agente: `qa-mobile`
  - Depende de: T018
  - Aceptación: la prueba falla si en `src/` (excepto `theme/` e `i18n/`) aparece un color literal `#hex` o un texto visible literal dentro de JSX; pasa en el estado actual
  - Refs: plan P-11 · RNF-04 · Art. V, VII

- [x] **T020** [P] Verificación local de calidad
  - Archivos: `package.json` (scripts `typecheck`, `lint`, `format`, `test`), `package-lock.json`
  - Agente: `dev-expo`
  - Depende de: T003, T004
  - Aceptación: en local pasan `npm run typecheck`, `npm run lint`, `npm run format -- --check` y `npm test` (sin `--passWithNoTests`, cobertura ≥ 80 % en `src/lib/` y `src/features/*/hooks/`)
  - Refs: H-10 · Art. IX

- [x] **T021** [P] README de la app
  - Archivos: `README.md`
  - Agente: `spec-writer`
  - Depende de: T018
  - Aceptación: explica requisitos (Node, emulador o Expo Go), instalación, variables de entorno con tabla de URLs por plataforma (Android `10.0.2.2`, simulador iOS `localhost`, dispositivo físico IP local), comandos y estructura; un compañero puede seguirlo sin ayuda (CA-01)
  - Refs: RF-14 · H-01

- [x] **T022** Actualizar memoria y verificar criterios de aceptación
  - Archivos: `memoria.md`
  - Agente: `spec-writer`
  - Depende de: T019, T020, T021
  - Aceptación: estado de la spec 002 actualizado; versión real del SDK y dependencias registradas; CA-01…CA-11 comprobados y anotados
  - Refs: Art. XII

- [x] **T023** Revisión de conformidad con la constitución
  - Archivos: ninguno (solo informe)
  - Agente: `revisor-constitucion`
  - Depende de: T022
  - Aceptación: veredicto **CONFORME** o hallazgos corregidos y revisados de nuevo
  - Refs: DoD de la constitución §7

## Fase 5 — Servicios y entorno local (antes spec «servicios externos y compilación»)

- [ ] **T024** Instalar dependencias nativas aprobadas
  - Archivos: `package.json`, `package-lock.json`
  - Agente: `dev-expo` · Depende de: T023
  - Aceptación: instaladas con `npx expo install` las de plan P-S3 (**sin** `expo-dev-client`); `npx expo-doctor` sin errores; ninguna dependencia fuera de la constitución · Para la ruta crítica (docs/ruta-critica-login-inicio.md) bastan `expo-secure-store`, `expo-font`, `expo-linear-gradient` y `react-native-svg`; cámara, ubicación, imágenes y notificaciones se instalan cuando su spec los necesite
  - Refs: Art. X.4, XIV

- [ ] **T025** Configuración de la app y permisos
  - Archivos: `app.config.ts`
  - Agente: `dev-expo` · Depende de: T024
  - Aceptación: nombre «Vaivén», `slug`, `scheme: vaiven`, identificadores de paquete (provisional `mx.vaiven.app`), permisos con textos en español; plugins de `expo-camera`, `expo-location`, `expo-image-picker`, `expo-notifications`
  - Refs: RF-S1, P-S2

- [ ] **T026** [P] Variables públicas de entorno
  - Archivos: `.env.example`
  - Agente: `dev-expo` · Depende de: T025
  - Aceptación: `EXPO_PUBLIC_API_URL` y las demás variables públicas documentadas sin secretos; `.env*` ignorado excepto `.env.example`
  - Refs: RF-S2

- [ ] **T027** Validación de la URL del backend
  - Archivos: `src/config/env.ts`, `src/config/env.test.ts`
  - Agente: `dev-expo` · Depende de: T026
  - Aceptación: `EXPO_PUBLIC_API_URL` obligatoria y con formato de URL; mensaje claro en español si falta; pruebas de ambos casos
  - Refs: RF-S2 · T005

- [ ] **T028** Diagnóstico ampliado
  - Archivos: `src/features/diagnostics/{api.ts, useDiagnostics.ts, DiagnosticsScreen.tsx}`, pruebas
  - Agente: `dev-expo` · Depende de: T027
  - Aceptación: muestra URL activa, `/healthz`, `/readyz` y versión y entorno (de `GET /api/v1/meta`); estados de carga y error con `LoadingState`/`ErrorState` · Diagnóstico según spec §9.1 (`Card` clave–valor, `Chip` «DEV»)
  - Refs: RF-S3

- [ ] **T029** Verificación en Expo Go contra staging (**la hace una persona** con `probador-expo`)
  - Archivos: `memoria.md` (solo anexar), `docs/evidencia/002/` (capturas)
  - Agente: `probador-expo` · Depende de: T028, backend 002-T031
  - Aceptación: con `EXPO_PUBLIC_API_URL` de staging y `EXPO_UNSTABLE_MCP_SERVER=1`, la app abre en Expo Go en un teléfono Android real; el diagnóstico muestra `/readyz` en verde; el MCP `expo` toma una captura; `docs/entorno-local.md` se sigue sin ayuda (001-CA-03). **La spec 003 no empieza hasta que esta tarea pase.** · **MCP de Expo opcional (decisión 9 nov):** se verifica a mano o con Claude en Expo Go contra el **backend local**; el staging queda para cuando exista
  - Refs: RF-S4 · Art. XIV.4

- [ ] **T030** [P] Componentes de interacción
  - Archivos: `src/components/ui/{BottomSheet,SearchBar,Avatar,ListRow,ProgressBar,SegmentedControl,RatingStars,Skeleton,Banner}.tsx`, `src/components/ui/interaction.test.tsx`
  - Agente: `dev-expo` · Depende de: T015
  - Aceptación: solo *tokens*; `BottomSheet` se cierra con «X», tocando fuera y deslizando, y es utilizable con lector de pantalla; `SearchBar` con botón de borrar y rol de búsqueda; `RatingStars` táctil con área ≥ 44 y valor leído; `SegmentedControl` con insignia opcional; `Skeleton` sin animación si el sistema pide reducir movimiento; `Banner` con las cinco variantes de §9.1; `Button` gana la variante `danger`; pruebas por rol y texto · Puede entregarse en dos partes: primero `Skeleton`, `Avatar` y `Banner` (los necesita el Inicio) y después el resto
  - Refs: RF-16 · Art. VII, XIII.5

## Resumen

| Fase | Tareas | Total |
|---|---|---|
| 0 Preparación | T001–T004 | 4 |
| 1 Fundamentos | T005–T009 | 5 |
| 2 Datos y errores | T010–T013 | 4 |
| 3 UI y rutas | T014–T018 | 5 |
| 6 Componentes de interacción | T030 | 1 |
| 4 Cierre | T019–T023 | 5 |
| 5 Servicios y entorno local | T024–T029 | 6 |
| **Total** | | **30** |
