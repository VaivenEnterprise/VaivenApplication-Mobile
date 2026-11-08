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
| Versión de Expo SDK | _Por fijar en T001 (SDK estable vigente)_ |

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

## Prototipo 016 — 2026-11-07

- [016] T001–T002 completadas: scaffold Expo + Router, tokens, i18n `es-MX` y componentes UI base.
- [016] `LoadingState` y `ErrorState` se agregan a T002 porque el Art. X.2 los exige en `src/components/ui/`.
- [016] ESLint 10 rompe `eslint-plugin-react` de `eslint-config-expo` 58; se fijó `eslint@9.39.5`.
- [016] `jest-expo` 58 exige `@react-native/jest-preset` (instalado 0.88.1). Jest ignora `.github/` porque esas pruebas usan `node:test`.
- [016] `@testing-library/react-native` 14 hace `render` y `fireEvent` asíncronos: usar `await`.
- [016] `tsconfig` incluye `"types": ["jest"]` para que `tsc` reconozca las pruebas.
- [016] T003–T011 completadas: mocks, auth, pestañas, Inicio, Explorar, Asistente, Cuenta/solicitudes y detalle de herramienta.
- [016] `expo-asset` es peer de `expo-font`/`@expo/vector-icons`; se instaló con `expo install` para que Jest y la app resuelvan los iconos.
- [016] Pruebas de render de las cuatro pestañas y del detalle: 20 pruebas en verde, sin conexión real.
- [016] RN 0.88 tipa el ref de `ScrollView` con `ComponentRef<typeof ScrollView>`, no con el tipo del componente.
- [016] El prototipo vive en `src/app/prototipo/`; las rutas de acceso son `/prototipo/login` y `/prototipo/register`, y el detalle `/prototipo/herramienta/[id]`.
- [016] Expo Router toma todo archivo dentro de `src/app` como ruta: las pruebas de pantallas se movieron a `src/__tests__/prototipo.test.tsx` para no romper el bundle.
- [016] Verificación final: `npx expo start` arranca Metro y `npx expo export --platform android` genera el bundle sin errores.
- [016] Guía manual de smoke test en `specs/016-maqueta-mock/smoke-test.md`.
- [016] Pruebas de pantallas aíslan `@expo/vector-icons` con mock y esperan `await screen.unmount()`; `expo-asset` queda en `~58.0.20` y T011 en verde.

## Prototipo 016 — Cierre T012 (2026-11-07)

- [016] T012 completada: Inicio invitado/autenticado, 3 tabs (Inicio, Explorar, Mi Perfil), FAB naranja y Asistente apilado.
- [016] El Asistente se movió a `src/app/prototipo/asistente.tsx`; T005/T008 quedan como historial. La ruta `/prototipo/asistente` se abre desde el FAB.
- [016] Login y registro se rehacen con `TextField`/`Checkbox`/`TextLink`: Compartir, ver/ocultar contraseña, términos y CTAs terracota/verde.
- [016] Nuevos componentes: `KitItem`, `WorkCard`, `ProjectToolRow`, `NeighborMap` y `AssistantFab`; `ToolCard` usa `ToolIcon` y `ProjectCard` muestra conteo, herramientas y selección.
- [016] Nuevos datos y dominio: `CompletedWork`, `src/mocks/works.ts` y `findProjectForToolId`; el detalle resuelve id de proyecto o de herramienta.
- [016] El mapa es simulado: pines numerados para herramientas con `toolId`; los proyectos sin herramienta vinculada muestran el estado vacío.
- [016] `Pedir` cambia a `Solicitada` en memoria; aceptar/rechazar solicitudes sigue usando `useRequests`.
- [016] `sizes.avatar` reemplaza el literal 56 en Mi Perfil; se añadieron tokens terracota/naranja y tamaños de avatar/FAB/íconos/mapa/pin.
- [016] Verificación T012: `npm run typecheck`, `npm run lint` y **24 pruebas** en verde; `npx expo start --port 8089` arranca Metro y el export Android genera el bundle sin errores.

## Prototipo 016 — Validación de auth T013 (2026-11-07)

- [016] T013 completada: Login y Registro usan `react-hook-form` + `zodResolver`; no se agregaron dependencias.
- [016] Esquemas en `src/utils/schemas.ts` por solicitud explícita del responsable. Al implementar la spec 003 se consolidarán en `features/auth/schemas.ts` para respetar la frontera de feature.
- [016] Zod 4: `z.email()` reemplaza `z.string().email()`; los mensajes custom usan `ctx.addIssue({ code: 'custom', message })` y `refine(fn, mensaje)`.
- [016] El correo se normaliza con `.trim().toLowerCase()`, el nombre colapsa espacios y el teléfono se recorta; la contraseña no se altera.
- [016] `mode: 'onBlur'` + `reValidateMode: 'onChange'`: no hay errores antes de interactuar y se revalidan al corregir.
- [016] Los términos ya no deshabilitan el CTA: al enviar se muestra el error si no están aceptados.
- [016] `mockAuthRequest` simula 500 ms; `Button loading` bloquea dobles envíos con `ActivityIndicator`.
- [016] `TextField` y `Checkbox` exponen error con `accessibilityHint` y `accessibilityLiveRegion="polite"`.
- [016] Pruebas nuevas: `src/__tests__/auth-schemas.test.ts` y casos válidos/inválidos de Login/Registro en `prototipo.test.tsx`; **35 pruebas** en verde.
- [016] `jest.config.js` incluye `src/utils/**` en cobertura y `testTimeout: 10000` para el primer render bajo cobertura.
