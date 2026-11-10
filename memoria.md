# Memoria de la App Móvil — VAIVÉN

Memoria viva del proyecto. Los agentes la leen después de `constitution.md` y la **actualizan** al cerrar cada tarea relevante. No contradice la constitución: si hay conflicto, gana la constitución.

_Última actualización: 2026-10-28_

## 1. Estado actual

| Elemento | Estado |
|---|---|
| Constitución | v1.1.0 (enmendada 2026-10-28) |
| Spec 001 — Servicios y entorno local (MCP de Expo) | Redactada (reescrita el 2026-11-01), pendiente de aprobación humana |
| Spec 002 — Arquitectura base | Redactada, pendiente de aprobación humana |
| Specs 002–013 | Redactadas (spec, plan, tasks), pendientes de aprobación; ver `ROADMAP.md` |
| Tareas | **Sin ejecutar**; arranque planeado 2026-10-29 |
| Código | Ninguno todavía |
| Versión de Expo SDK | **58** (`expo` ~58.0.23, `react-native` 0.88.1, `react` 19.3.0; fijado en 002-T001, 2026-11-10) |

## 2. Decisiones (registro tipo ADR)

| # | Fecha | Decisión | Motivo | Constitución |
|---|---|---|---|---|
| D-001 | 2026-10-26 | Expo + TypeScript estricto + Expo Router | Estándar actual de Expo; rutas por archivos | Art. III, VI |
| D-002 | 2026-10-26 | La app solo consume la API del backend | Backend con MongoDB es la fuente de verdad | Art. II |
| D-003 | 2026-10-26 | TanStack Query para datos del servidor; sin almacén global por ahora | Menos código y menos estado | Art. X |
| D-004 | 2026-10-26 | `StyleSheet` + tokens propios, sin librería de UI | Menos dependencias; consistencia por tokens | Art. VII, X |
| D-005 | 2026-10-26 | Dinero en centavos; `formatMXN` para mostrar | Igual que el backend | Art. V |
| D-006 | 2026-10-26 | Errores normalizados en `lib/api` con códigos del servidor + `network_error` y `timeout` | Un solo punto de manejo | Art. IV |
| D-007 | 2026-10-26 | Solo OpenCode + modelos gratuitos de Zen | Requisito del curso | Art. XI |
| D-008 | 2026-10-26 | Documentos y prompts de agentes en español | Preferencia del equipo | Art. XI |
| D-009 | 2026-10-26 | `task.md` se nombra `tasks.md` | Convención estándar de SDD | Art. I |
| D-010 | 2026-10-26 | Gestor de paquetes `npm` | Simplicidad; sin herramientas extra | Art. X |
| D-011 | 2026-10-28 | Fotos: redimensionar y subir directo a Cloudinary con firma del backend | Servicio gratuito; la app nunca ve el secreto | Art. II.4 (enmienda 1.1.0) |
| D-012 | 2026-10-28 | Trabajo en paralelo: dueño por spec, concha de navegación en spec 003, i18n y claves por funcionalidad | 4 personas con OpenCode propio sin pisarse | Art. XIII (enmienda 1.1.0) |
| D-013 | 2026-10-28 | Formularios con `react-hook-form` + `zod`; sesión con contexto de React (sin Zustand) | Menos código y dependencias | Art. X.3, X.4 |
| D-014 | 2026-10-28 | Alcance: núcleo completo sin IA ni página pública; código congelado 15-nov | Plazo 20-nov con colchón de 5 días | `ROADMAP.md` |

## 3. Modelos gratuitos asignados (OpenCode Zen)

Fuente de verdad: `opencode.json`. Verificados en septiembre de 2026; **los IDs gratuitos rotan**.

| Rol | Modelo | Agentes |
|---|---|---|
| Razonamiento / planeación | `opencode/nemotron-3-ultra-free` | `plan`, `spec-writer` |
| Revisión | `opencode/big-pickle` | `revisor-constitucion` (modelo por defecto) |
| Implementación | `opencode/nemotron-3-lightning-free` | `build`, `dev-expo` |
| Pruebas / tareas rápidas | `opencode/ling-flash-free` | `qa-mobile`, `small_model` |
| Alternos | `opencode/mimo-free`, `opencode/muse-spark-free` | — |

**Cómo validar y cambiar:**
1. Ejecutar `opencode models` y confirmar que cada ID existe.
2. Editar solo `opencode.json` (sección `agent`, `model`, `small_model`).
3. Registrar el cambio en esta tabla y en la sección 2.

**Compatibilidad de versión:** los agentes usan el formato estable de OpenCode (`permission:` como mapa, carpeta `.opencode/agents/`). Si tu versión de OpenCode es la V2 y reporta campos obsoletos, cambia `permission:` por la lista `permissions:` (`action`, `resource`, `effect`) en cada agente.

## 4. Convenciones aprendidas

_(Los agentes agregan aquí hallazgos útiles y breves, uno por línea, con fecha.)_

- 2026-10-26 — Los modelos gratuitos rinden mejor con tareas de 1–3 archivos y criterios de aceptación explícitos.
- 2026-10-26 — En emulador Android, el equipo anfitrión es `10.0.2.2`; en dispositivo físico, la IP local de la red.

## 5. Dependencias registradas

| Dependencia | Para qué | Spec |
|---|---|---|
| `expo`, `react`, `react-native` | Base de la app | 002 |
| `expo-router` (+ `react-native-safe-area-context`, `react-native-screens`) | Navegación | 002 |
| `expo-constants` | Leer configuración | 002 |
| `expo-secure-store` | Almacenamiento seguro | 002 |
| `expo-status-bar` | Barra de estado | 002 |
| `@tanstack/react-query` | Datos del servidor | 002 |
| `zod` | Validación de configuración y respuestas | 002 |
| `typescript`, `eslint`, `eslint-config-expo`, `prettier` | Calidad | 002 |
| `jest`, `jest-expo`, `@testing-library/react-native`, `@types/jest` | Pruebas | 002 |
| `expo-font`, `@expo-google-fonts/plus-jakarta-sans` | Tipografía del diseño (instaladas en 002-T006) | 002 |
| `expo-linear-gradient` | Degradados (002-T006) | 002 |
| `react-native-svg` | Ilustraciones SVG; fijada en 15.16.0, versión del SDK 58 (002-T006) | 002 |
| `@expo/vector-icons` | Íconos tras `AppIcon` (002-T006) | 002 |

## 6. Pendientes y preguntas abiertas

- [ ] Aprobación humana de `specs/002-arquitectura-base/`.
- [ ] Paleta oficial y tipografía de VAIVÉN (los *tokens* de la spec 002 son provisionales).
- [ ] Mecanismo de autenticación: se define en la primera spec funcional (coordinado con el backend).
- [ ] Estrategia de compilación y distribución (EAS): fuera de alcance salvo la spec 013 (Art. XIV).

## 7. Riesgos conocidos

- Los modelos gratuitos pueden desaparecer o limitar el uso sin aviso → mantener alternos listados en la sección 3.
- Algunos modelos gratuitos pueden usar los datos enviados para mejorarse → **no pegar secretos ni datos personales reales** en las conversaciones con agentes.
- Los modelos pueden proponer APIs obsoletas de Expo/React Native → verificar con `npx expo install --check` y la documentación de la versión fijada.

## 8. Decisiones de producto del 28 de oct (noche)

| # | Decisión | Efecto |
|---|---|---|
| D-101 | Políticas POL-01…17 **confirmadas**; POL-02 pasa a **máximo 7 días** | Specs 006, 007 (backend y móvil) actualizadas |
| D-102 | Categorías (POL-14): herramientas manuales, herramientas eléctricas, construcción y jardinería, movilidad (patines, patinetas, bicicletas), deportes, hogar, otros | Spec 005 |
| D-103 | Valor declarado **no** visible a terceros | Spec 005 |
| D-104 | **[REEMPLAZADA por D-115]** Hosting gratuito: Render (`vaiven-staging` y `vaiven-prod`) | Specs 001 y 013 |
| D-105 | Identificador de paquete `mx.vaiven.app` (permanente tras publicar) | Spec móvil 002 y 013 |
| D-106 | Meta original: primera versión pública en Google Play el 20 de nov (ver D-110). Solo Google Play; sin App Store | Specs 013; ROADMAP §1 |
| D-107 | Reportes de contenido y filtro de texto pasan a **P1 no recortables** (política de contenido de usuarios de Google Play) | Spec 011 |
| D-108 | Se agrega el proyecto `landing/` (sitio informativo estático, gratuito) con las páginas legales que exige Play | `vaiven-landing-page/`, ROADMAP |
| D-109 | La baja de cuenta **anonimiza** los datos personales (POL-17) | Spec backend 003 |
| D-110 | La cuenta de Google Play se compra el 29–30 oct: prueba cerrada 1–14 nov, solicitud 15 nov, publicación 1.0 (sin IA) meta 20 nov / estimada 22–25 nov. La IA va en la spec 014 como v1.1 posterior, detrás de un interruptor | ROADMAP §1 y §3; specs 013 |
| D-111 | **Entrega oficial: 1–4 dic con todos los specs completos.** Se agrega la spec 014 (IA: sugerir título y categoría por foto) como P1, v1.1, del 16 al 24 nov detrás del interruptor `AI_ENABLED`; proveedor gratuito y alcance académico por confirmar | ROADMAP §1 y §3; specs 014 |
| D-112 | ML = **recomendaciones** (spec 015): recomendador híbrido propio (coseno objeto-objeto + contenido) evaluado contra popularidad; IA = Gemini (spec 014). Ambas v1.1, 16–24 nov, con interruptores | ROADMAP §3; specs 014 y 015 |
| D-113 | Se separa el monorepo en repositorios independientes (`vaiven-backend`, `vaiven-frontend` y `vaiven-landing-page`): las rutas `../` pasan a ser locales o a apuntar al repositorio hermano; ROADMAP.md y docs/ se copian en cada repositorio; enmienda PATCH, sin cambios de principios; constitución móvil **v1.1.1** | Constitución; AGENTS.md; specs |
| D-114 | Se elimina todo lo relativo a repositorio, ramas, PR y pipeline: se integrará de cero. Todo va por OpenCode y MCP: la spec **001 pasa a ser «Servicios por MCP»** (MCP de Expo) y la arquitectura base es la 002. **La app no se despliega**: cada spec termina con «Verificación en Expo Go» contra el staging del backend (agente `probador-expo`, único con permiso para el MCP); la siguiente no empieza hasta que pase. Constitución **v1.2.0** (Art. XIV). Pendiente de revisión: la spec 013 (Google Play/EAS) | ROADMAP; constitution Art. XIV; specs 001 y 002; `.opencode/agents/probador-expo.md` |
| D-115 | El backend pasa a **Azure** (VM con la API, Redis y MongoDB, sin nginx; D-116 y D-118 del backend). La app apunta con `EXPO_PUBLIC_API_URL` a `https://<host>:8443` (staging) y `https://<host>` (producción), siempre HTTPS con certificado válido; ya no hay arranque en frío de ~1 min, pero la VM puede estar caída o reiniciándose, así que se mantienen los estados de carga y reintento. Sin cambios en la app ni en el contrato | ROADMAP; backend constitution Art. XIII y XIV |
| D-116 | La app **sí se compila y se publica**: EAS Build genera un **APK** (`preview`, instalación directa y demostración) y un **AAB** (`production`, Google Play). Lo que no existe es un servidor que desplegar. Las specs 002–012 se siguen cerrando con verificación en Expo Go; la compilación y la publicación son de la spec 013. Constitución 1.2.1 (PATCH) | constitution XIV.1; spec 013 |
| D-117 | **Calendario fijado el 2 nov (el desarrollo arranca hoy):** 001–002 del 2 al 5 nov; primer AAB y día 1 de la prueba cerrada el 9 nov; día 14 el 22 nov; congelar la 1.0 el 22 nov y solicitar producción el 23 nov; publicación estimada 30 nov–7 dic (puede quedar después de la entrega); IA y ML (v1.1) del 23 nov al 1 dic; entrega 1–4 dic. Sustituye al plan del 28 oct | ROADMAP §1 y §3; specs 003–015 |
| D-118 | **Repositorio en GitHub con MCP de GitHub:** una rama y una PR por spec, `main` protegida; solo el agente `gestor-repo` usa el MCP (token `GITHUB_PERSONAL_ACCESS_TOKEN`) y nunca fusiona ni borra; una persona revisa y fusiona. Sin pipeline automatizado. Constitución con el Art. XV. Tarea nueva en la spec 001 | constitution Art. XV; spec 001 |

## Integracion DevSecOps — 2026-11-02

- [CI] Por solicitud expresa del responsable se prepara la integracion de ramas, PRs y seguridad que habia quedado fuera el 2026-11-01. Spec independiente: specs/017-devsecops/. No se modifica constitution.md ni se ejecutan specs funcionales.
- [CI] Herramientas exclusivas de CI: GitHub Actions fijadas por SHA, Gitleaks v8.30.1 (checksum verificado), CodeQL v4. Sin dependencias nuevas de aplicacion.
- [CI] Revisores indicados: JesusTrz (escritura) y JosephYanez27 (lectura al preparar el cambio). El segundo necesita escritura para aprobaciones obligatorias y CODEOWNERS. Ruleset y ajustes administrativos quedan pendientes hasta que se apliquen y verifiquen.
- [CI] Estado inicial: documentacion sin aplicacion; CI informa las pruebas no aplicables y ejecuta politica/secretos. Despliegue Render por MCP y pruebas en Expo Go se conservan.

## Rediseño visual — 2026-11-09

- [DISEÑO] Se adopta el diseño de Stitch (inicio de sesión, registro, inicio) como lenguaje visual de la app. Referencia en `docs/diseno/referencia/`. Cambia solo presentación: no se altera ningún contrato ni regla de negocio.
- [DISEÑO] **D-119** Tokens v1 (terracota `#C24E24`, verde `#1B7A57`, crema `#FAF6F0`, Plus Jakarta Sans) en spec 002 plan §4.2; reemplazan a los provisionales y resuelven la pregunta abierta de paleta y tipografía. Se unifican los dos tonos de marca que mostraban las capturas (coral en inicio de sesión, café en registro).
- [DISEÑO] **D-120** Navegación: la barra muestra Inicio, Explorar, Mis objetos, Actividad y Perfil. **Mensajes** queda como ruta de pestaña oculta (`href: null`) con acceso desde el encabezado de Inicio; sus archivos de la spec 008 no cambian de ruta. Requiere enmienda PATCH al Art. XIII.3 de la constitución: propuesta en `docs/propuesta-enmienda-xiii3.md` (la constitución no se tocó).
- [DISEÑO] **D-121** Inicio es estático con marcadores (`SlotPlaceholder`); el botón de asistente (✦) queda reservado para la spec 014.
- [DISEÑO] **D-122** No se agrega cambio ni recuperación de contraseña. No se muestran «Compartir», «¿Olvidaste tu contraseña?», «Explorar la app» ni el campo Teléfono del registro (spec 003 §5).
- [DISEÑO] Dependencias visuales registradas (spec 002 plan §5): `expo-font`, `@expo-google-fonts/plus-jakarta-sans`, `expo-linear-gradient`, `react-native-svg`, `@expo/vector-icons`. Instalar con `npx expo install`; se instalan en 002-T006.
- [DISEÑO] Archivos tocados: specs 002 (spec, plan, tasks), 003 (spec, plan, tasks) y 008 (spec, tasks); ROADMAP §4 (una fila). Tarea nueva: 003-T014 (Inicio estático).

## Diseño de las demás vistas — 2026-11-09

- [DISEÑO] Se agrega una sección «Diseño de pantallas» (§7) en las specs 003 a 015 con el mismo lenguaje de Stitch (spec 002 §9). Regla general: poco texto, una acción principal por pantalla, hojas inferiores para decisiones cortas.
- [DISEÑO] **D-123** Búsqueda por problema («necesito colgar un cuadro»): el catálogo de proyectos (herramientas y pasos) va **empaquetado en la app**, provisional (spec 006 §6): sin contrato nuevo. `matchProjects` es local y puro. Alternativa pendiente: llevarlo al backend.
- [DISEÑO] **D-124** Flujo de proyecto (spec 007 §7.1): herramientas → persona más cercana (API de 006) → mapa → solicitar → paso a paso. El avance vive solo en memoria de la sesión (pregunta abierta en 007 §6).
- [DISEÑO] **D-125** Mapa **esquemático** (sin teselas, sin claves, sin dependencia nueva): solo zonas aproximadas. Un mapa real queda fuera de alcance.
- [DISEÑO] **D-126** Del diseño de Stitch **no se muestra** lo que contradice el documento de idea: depósito reembolsable y «total a pagar hoy», entrega a domicilio con envío, «identidad verificada», «Rentar ahora/Confirmar renta» (se usa «Solicitar»), «Enviar mensaje» antes de solicitar y calles con nombre (007 §7.6). Si el equipo decide incluir alguno, requiere cambio de política y de contrato, no solo de diseño.
- [DISEÑO] **D-127** Calificación estilo apps de viajes (010 §7.1): chips rápidos que se agregan al comentario; sin cambios de contrato. Motivos de incidencia provisionales (010 §6).
- [DISEÑO] **D-128** Chat: respuestas rápidas que solo rellenan el campo (008 RF-11). Entrega: la pantalla del QR consulta la reserva cada 5 s en primer plano (009 RF-12).
- [DISEÑO] **D-129** Marca (013 §7): el ícono actual se conserva como provisional; se fija dirección para mejorarlo sin tocar la ficha.
- [DISEÑO] Componentes de interacción nuevos en `ui` (002-T030): `BottomSheet`, `SearchBar`, `Avatar`, `ListRow`, `ProgressBar`, `SegmentedControl`, `RatingStars`, `Skeleton`, `Banner`. Tareas nuevas: 002-T030, 006-T011, 007-T014 y 007-T015. Sin dependencias nuevas de paquetes.
- [DISEÑO] Referencias de pantalla del flujo de proyecto en `docs/diseno/referencia/` (04 a 08).
- [DISEÑO] **D-130** (9 nov, por delegación de la persona responsable: libertad siempre que no afecte el objetivo ni el desarrollo) Se adoptan como **definitivas** las recomendaciones de D-123 a D-126: catálogo de proyectos empaquetado, mapa esquemático, avance en memoria y exclusión de lo que contradice el documento de idea. Razón: no dependen del backend, no agregan dependencias y se pueden cambiar sin rehacer pantallas.
- [DISEÑO] Siguen **pendientes** solo dos puntos que dependen de otros: los 6 motivos de incidencia (se alinean con el contrato 010 del backend cuando se publique) y la aprobación de la enmienda PATCH al Art. XIII.3 (`docs/propuesta-enmienda-xiii3.md`; la constitución no se modifica sin aprobación humana).

## Prioridad: login e Inicio funcionales — 2026-11-09

- [DISEÑO] **D-131** La spec 001 pasa a **opcional**: la app corre solo en local y no se usa el MCP de Expo (el equipo trabaja con Claude). Nadie depende de ella; se quita `001-T002` de las dependencias de 002-T024. Omitidas 001-T001 y 001-T004.
- [DISEÑO] **D-132** Las tareas «Verificación en Expo Go» de las specs 002 a 015 se hacen **a mano o con Claude contra el backend local**; `probador-expo` y el MCP quedan opcionales. El Art. XIV de la constitución dice otra cosa: propuesta de enmienda en `docs/propuesta-enmienda-xiv-local.md` (la constitución no se tocó).
- [DISEÑO] **D-133** **Inicio es funcional** desde la primera entrega: `GET /me` y `GET /items?limit=6` con su propio `api.ts` en `features/home`, proyectos del catálogo local y marcadores para lo que aún no tiene API (003 §7.3, T014). La ruta mínima está en `docs/ruta-critica-login-inicio.md`.
- [DISEÑO] **D-134** `006-T011` (catálogo y `PopularProjects`) ya no depende de `006-T001` para poder adelantarse. `002-T030` puede entregarse en dos partes (primero `Skeleton`, `Avatar`, `Banner`).

## Spec 002 — Fase 0 (Preparación) — 2026-11-10

- [002] Rama de trabajo `spec/SPEC-02` (creada desde `develop`). Completadas **T001–T004**; `Fase 0` lista para revisión y PR por una persona.
- [002] **SDK fijado:** Expo 58 (`expo` ~58.0.23, `react-native` 0.88.1, `react` 19.3.0), plantilla `blank-typescript` reorganizada a `src/` (sin `App.tsx` ni `index.ts`; `main` = `expo-router/entry`). `assets/` conserva los íconos de la plantilla como **provisionales** (D-129).
- [002] Dependencias instaladas: `expo-router`, `react-native-safe-area-context`, `react-native-screens`, `expo-constants`, `expo-status-bar`, `expo-linking` (peer de `expo-router`, ya aprobada); dev: `typescript` ~6.0.3, `@types/react`, `eslint` ~9.39 (v9 por compatibilidad con `eslint-config-expo`), `eslint-config-expo`, `prettier`, `jest` 30, `jest-expo`, `@testing-library/react-native` 14, `@types/jest`, `@react-native/jest-preset` y `test-renderer` (peers exigidos por `jest-expo` 58 / RNTL 14). `react-dom` se fija en 19.3.0 con `overrides` solo para resolver el peer de `expo-router`; no se usa web.
- [002] `package.json` fija `react` y `react-native` en versión exacta (las que pide el SDK 58).
- [002] **Aprendizaje TS 6:** `baseUrl` está obsoleto (error TS5101); el alias `@/*` va solo en `paths` con ruta relativa `./src/*`. TS 6 ya no incluye `@types/*` solos: `tsconfig.json` declara `"types": ["jest"]`.
- [002] **Aprendizaje ESLint:** la config plana de `eslint-config-expo` solo registra `@typescript-eslint` para `*.ts(x)`; las reglas de `any` y `@ts-ignore` se declaran con `files: ['**/*.ts','**/*.tsx']`. `npm run lint` usa `--max-warnings 0` (RNF-02). Comprobado que un archivo con `any` y `@ts-ignore` falla.
- [002] **Jest:** preset `jest-expo`, alias `^@/(.*)$` → `src/$1`, `collectCoverageFrom` en `src/lib/**` y `src/features/*/hooks/**` (lo exige `.github/scripts/coverage.mjs`), umbral global 80 %. En RNTL 14 `render` es asíncrono (`await render(...)`).
- [002] **Pendiente de verificar en tu equipo:** `npx expo-doctor` pasó 18/20 comprobaciones en el entorno de la sesión; las 2 restantes (esquema de `app.config` y directorio de React Native) necesitan red hacia Expo y no pudieron ejecutarse. `expo install` tampoco llegó a `api.expo.dev`: las versiones se fijaron con `expo/bundledNativeModules.json` del SDK 58. Ejecutar `npx expo-doctor` y `npx expo install --check` localmente. Además, `npx expo start` solo se comprobó que arranca Metro; el empaquetado de la app requiere las rutas de T017.
- [002] `package-lock.json` generado en Linux; `npm install`/`npm ci` en Windows debería respetarlo. `node_modules` no se versiona.
- [002] Jest se limita a `roots: ['<rootDir>/src']` (el test de `.github/scripts` usa `node:test`); `.prettierignore` excluye `*.md`, `specs`, `docs`, `.github`, `.opencode` y `opencode.json` para no reformatear documentos ni configuración ajena. Validado en copia limpia con `npm ci`: typecheck, lint, `prettier --check` y `npm test` en verde; `npm audit --audit-level=high` sin hallazgos altos/críticos.
- [002] **Verificado en Windows (2026-11-10):** `npm install`, `npm run typecheck`, `npm run lint`, `npm test` (2/2), `prettier --check .` y `npx expo-doctor` (**20/20**, sin problemas) pasan en el equipo de la persona. Esto cierra la reserva anterior sobre `expo-doctor` en T001. Avisos aceptados: `@parcel/watcher` (script de instalación sin aprobar; solo aprobarlo si Metro lo pide) y 29 vulnerabilidades moderadas/bajas sin altas ni críticas (no usar `npm audit fix --force`).
- [002] **Verificado en Expo Go (2026-11-10):** la persona confirmó que `npx expo start` funciona con la app de Expo. Fase 0 (T001–T004) cerrada.
- [CI] 2026-11-10: al existir `package.json`, CodeQL empezó a analizar el repo y bloqueó `js/incomplete-multi-character-sanitization` (severidad 7.8) en `.github/scripts/policy.mjs` (quitaba comentarios HTML del PR con un `replace` de regex). Se reemplazó por `stripHtmlComments` (una pasada con `indexOf`) y se añadió una prueba en `policy.test.mjs` (15/15 pasan). El control no se debilita: sigue exigiendo contenido real en Resumen, Validación y Seguridad. Pendiente confirmar que CodeQL queda en verde tras el push.

## Spec 002 — Fase 1 (Fundamentos) — 2026-11-10

- [002] Completadas **T005–T009** en la rama `chore/SPEC-02-Fase-1`. Validado en copia limpia con `npm ci`: typecheck, lint, `prettier --check` y 82 pruebas en verde; cobertura 100 % en `config.ts`, `format/*` y `secureStorage.ts` (el script `coverage.mjs` de CI también pasa).
- [002] **T005 — configuración:** `loadConfig` valida con `zod` 4 (`EXPO_PUBLIC_API_URL` obligatoria, http/https con puerto ≤ 65535; `EXPO_PUBLIC_APP_ENV` `development` por defecto y vacío = no definido; en `production` solo `https`). Se exportan `tryLoadConfig`, `configResult` y `getConfig()` (en lugar de un único `config`): `_layout.tsx` (T017) decide con `configResult` y el resto usa `getConfig()`. **Aprendizaje:** Expo solo inlinea `process.env.EXPO_PUBLIC_X` con acceso por nombre completo; pasar `process.env` entero no funciona.
- [002] **T006 — tokens:** `src/theme/tokens.ts` con los valores de plan §4.2 como `as const`. Los degradados se guardan como `{ colors, start, end }` listos para `LinearGradient` (comprobado por tipos). `shadowRadius` usa el «desenfoque» del plan sin convertir. Una prueba calcula el contraste WCAG de los pares del plan (todos ≥ 4.5:1; `primary` sobre `background` 4.42 y sobre `primarySoft` 3.90 confirman la regla de «solo texto grande»). Dependencias nuevas, todas de plan §5: `expo-font`, `@expo-google-fonts/plus-jakarta-sans`, `expo-linear-gradient`, `react-native-svg` (exacta 15.16.0) y `@expo/vector-icons`. `expo install` no llega a `api.expo.dev` desde el entorno de la sesión: versiones tomadas de `expo/bundledNativeModules.json`.
- [002] **T007 — textos:** `src/i18n/es-MX.ts` con `common`, `home`, `diagnostics`, `errors` (11 códigos + `unexpected` + `config`) y `notFound`. La correspondencia con `ApiErrorCode` la refuerza T010 con tipos; hasta entonces la comprueba una prueba con la lista de códigos de la constitución (Art. IV).
- [002] **T008 — formato:** `formatMXN` exige entero seguro (si no, `''`); `formatDate`/`formatDateTime` aceptan una zona horaria opcional (solo para pruebas deterministas) y devuelven `''` ante entradas o zonas inválidas. Las pruebas normalizan espacios (Intl usa espacios no separables).
- [002] **T009 — almacenamiento:** `secureStorage.get/set/remove` sobre `expo-secure-store` (~58.0.2, instalada en esta tarea); nunca lanza y no registra claves ni valores.
- [002] **Aprendizaje TS 6 / CI:** `expo-env.d.ts` no se versiona, así que en un clon limpio `process` no tenía tipos y `typecheck` fallaba. Se agregó `"expo/types"` a `types` en `tsconfig.json`.
- [002] **Aprendizaje Windows:** el árbol de trabajo de Windows usa CRLF (git `autocrlf`); `prettier` con `endOfLine: "lf"` fallaba. `.prettierrc` pasa a `"endOfLine": "auto"` (el CI en Linux sigue viendo LF). El `package-lock.json` que reescribe npm en Windows difiere solo en marcas `devOptional`.
- [002] Se agregaron pruebas fuera de la lista literal de archivos de las tareas (`src/theme/tokens.test.ts`, `src/i18n/es-MX.test.ts`) para cumplir Art. IX y la regla de contraste; viven en `theme/` e `i18n/`, exentas de la prueba de convención T019.
