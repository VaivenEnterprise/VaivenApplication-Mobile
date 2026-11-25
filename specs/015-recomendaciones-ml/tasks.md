# Tareas 015 — Recomendaciones con ML (móvil)

- **Dueño:** MO-B · **Estado:** hecha (T001–T006 hechas el 2026-11-22; T007 y T008 hechas el 2026-11-25) · `[P]` = paralelizable
- Se ejecuta **después** del congelamiento de la 1.0 (22 nov).

- [x] **T001** [P] Tipos, claves y textos
  - Archivos: `src/features/recommendations/{types.ts, keys.ts}`, `src/i18n/recommendations.ts`, `src/i18n/index.ts` (una línea)
  - Agente: `dev-expo` · Depende de: 006-T001
  - Aceptación: tipos `Recommendation { item, reason }`; textos de motivos, confirmación de borrado y estados
  - Refs: RF-01, RF-04
  - Hecho (2026-11-22, Claude como `dev-expo`): `types.ts` (`Recommendation { item, reason }` con zod; el código de motivo desconocido cae en `popular`; `recommendationFeaturesSchema` para `/meta`), `keys.ts` y `src/i18n/recommendations.ts` con motivos, borrado y estados. El reexport va en `src/i18n/es-MX.ts` (el repositorio no tiene `i18n/index.ts`) y se añadió `'recommendations'` a `es-MX.test.ts`.

- [x] **T002** API y hooks
  - Archivos: `src/features/recommendations/{api.ts, hooks.ts, hooks.test.ts}`
  - Agente: `dev-expo` · Depende de: T001, 015-T001 (backend, contrato)
  - Aceptación: `useRecommendations`, `useTrackView`, `useClearHistory`; caché de 5 min; errores silenciosos; lee `features.recommendations`
  - Refs: RF-02, RF-03, RF-05 · P-01, P-02
  - Hecho (2026-11-22, Claude como `dev-expo` y `qa-mobile`): `api.ts` (`GET /meta`, `GET /recommendations?limit=10`, `POST /recommendations/events`, `DELETE /recommendations/history`) y `hooks.ts`: `useRecommendationsEnabled`, `useRecommendations` (estados `hidden`/`loading`/`ready`, caché de 5 min, sin reintentos, errores silenciosos), `useTrackView` (un evento por apertura, ignora objetos propios y función apagada, falla en silencio) y `useClearHistory` (invalida la lista). `hooks.test.ts`: 21 pruebas.

- [x] **T003** Fila y tarjeta
  - Archivos: `src/features/recommendations/components/{RecommendedRow,RecommendedCard}.tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T002, 004-T007, 002-T015
  - Aceptación: carrusel horizontal con *skeleton*, motivo en una línea, accesible; no se muestra vacía · Diseño: spec §7.1
  - Refs: RF-01, RF-05, RNF-01 · P-04
  - Hecho (2026-11-22, Claude como `dev-expo` y `qa-mobile`): `RecommendedCard.tsx` (160 pt como las tarjetas del Inicio: foto 4:3, título, precio de 005 o «Gratis», motivo en una línea con ícono de ojo; botón accesible con título, precio y motivo) y `RecommendedRow.tsx` (título `header`, tres *skeletons*, oculta si está apagada, vacía o con error). `components/components.test.tsx`: 17 pruebas (incluye `ClearHistoryRow`).

- [x] **T004** Integración por *slots* en Explorar y en el detalle
  - Archivos: `src/features/recommendations/index.ts` (exporta `renderTopSections` y `renderEffects`), una línea de uso en cada pantalla
  - Agente: `dev-expo` · Depende de: T003, 006-T005, 005-T008
  - Aceptación: CA-01, CA-02, CA-04; un solo evento por apertura; sin editar lógica ajena
  - Refs: RF-01, RF-03 · P-03
  - Hecho (2026-11-22, Claude como `dev-expo`): `index.ts` exporta `renderTopSections` y `renderEffects`; una línea de uso en `explorar/index.tsx` y en `objeto/[id].tsx`. Archivo extra justificado: `components/TrackViewEffect.tsx` (`index.ts` no puede llevar hooks). `ExploreScreen` e `ItemDetailScreen` no se editaron.

- [x] **T005** Borrar historial en Perfil
  - Archivos: `src/features/recommendations/components/ClearHistoryRow.tsx`, prueba
  - Agente: `dev-expo` · Depende de: T002, 003-T008
  - Aceptación: fila por *slot* `renderExtraRows`; confirmación; CA-03 · Diseño: spec §7.2
  - Refs: RF-04
  - Hecho (2026-11-22, Claude como `dev-expo` y `qa-mobile`): `components/ClearHistoryRow.tsx` (fila con papelera y `BottomSheet` de confirmación; «Historial borrado» en `Banner` `success`, y aviso `danger` si falla) conectada con dos líneas en `perfil/index.tsx` por `renderExtraRows`; `ProfileScreen` no se editó. Pruebas en `components.test.tsx` y en el flujo.

- [x] **T006** Prueba del flujo
  - Archivos: `src/features/recommendations/flow.test.tsx`
  - Agente: `qa-mobile` · Depende de: T004, T005
  - Aceptación: CA-01 a CA-04 con la API simulada
  - Refs: RNF-01
  - Hecho (2026-11-22, Claude como `qa-mobile`): `flow.test.tsx`: 14 pruebas con las pantallas reales (Explorar, detalle y Perfil) y la API simulada: CA-01 (fila con motivos, tocar abre el detalle), CA-02 (un solo evento, ni propio ni apagado, fallo silencioso), CA-03 (borrar y volver al arranque en frío) y CA-04 (apagada, `/meta` caído, 503 y lista vacía).

- [x] **T007** Cumplimiento, versión y revisión
  - Archivos: `landing/privacidad/index.html`, `docs/play/cumplimiento.md`, `memoria.md` (solo anexar)
  - Agente: `spec-writer` + **admin** (Play Console) + `revisor-constitucion` · Depende de: T006, backend 015-T010
  - Aceptación: privacidad y «Seguridad de datos» declaran el historial de recomendaciones (CA-05), junto con lo de la IA (014-T006); incluida en la v1.1; **CONFORME**
  - Refs: RF-06
  - Avance (2026-11-22, Claude como `spec-writer`): **hecho** el aviso de privacidad de la landing (`vaiven-landing-page/privacidad/index.html`: fila de objetos vistos, párrafo de recomendaciones, 90 días y borrado desde Perfil; fecha 22 nov; `scripts/check.mjs` pasa; **sin confirmar en git en ese repositorio**) y `docs/play/cumplimiento.md` (§1 fila de actividad en la app, §8 y nueva §10). **Pendiente:** «Seguridad de los datos» en Play Console (administración), que el backend 015-T010 esté desplegado, la versión 1.1 en el AAB (`app.config.ts` ya trae `1.1.0`, 014-T007) y la revisión final `revisor-constitucion` con veredicto **CONFORME** sobre el conjunto (T001–T006 revisadas el 2026-11-22: sin `any`, colores ni textos literales, sin dependencias nuevas, solo *slots*). Por eso sigue sin marcar.
  - Hecho (2026-11-25, Claude como `revisor-constitucion`; no el agente de OpenCode): veredicto **CONFORME con observaciones**. Verificado: el aviso de privacidad de la landing declara el historial de objetos vistos (fila de datos, párrafo de recomendaciones sin terceros, 90 días y borrado desde Perfil) y `docs/play/cumplimiento.md` (§1, §8, §10) dice lo mismo, junto con lo de la IA de 014 (§9): CA-05. Backend 015-T010 y T011 están `[x]` en `vaiven-backend`; `app.config.ts` trae `1.1.0`. **Corregido en la revisión:** las consultas tenían `retry: false` y la constitución §6.3 pide un reintento ante red o 5xx; se quitó y se añadió una prueba. **Observaciones que no bloquean:** (1) la landing se da por terminada en sus propias specs por indicación de la persona; su cambio sigue sin confirmar en git; (2) «Seguridad de los datos» en Play Console lo llena la administración y no es verificable desde el repositorio; (3) la corrida completa de `npm test` la hace la persona antes de la PR; (4) el AAB 1.1 se compila en 014-T007. Detalle en `memoria.md`.

- [x] **T008** Verificación en Expo Go contra staging
  - Archivos: `memoria.md` (solo anexar), `docs/evidencia/015/` (capturas)
  - Agente: `probador-expo` · Depende de: T007 (y todas las anteriores `[x]`) y backend 015-T011 **desplegada**
  - Aceptación: `npm run typecheck && npm run lint && npm test` en verde; con `EXPO_PUBLIC_API_URL` de staging y `EXPO_UNSTABLE_MCP_SERVER=1`, la app abre en Expo Go y se recorren los criterios de aceptación (CA-xx) de esta spec, con capturas tomadas por el MCP `expo`; lo que Expo Go no permita probar (p. ej. push remoto en Android) se anota en `memoria.md` como no verificable. **La spec siguiente no empieza hasta que esta tarea pase.** · **MCP de Expo opcional (decisión 9 nov):** se verifica a mano o con Claude en Expo Go contra el **backend local**; el staging queda para cuando exista
  - Refs: Art. XIV.4
  - Avance (2026-11-25): `npm test` completo en verde (132 suites, 1751 pruebas) y captura de **CA-01** en `docs/evidencia/015/01-ca01-recomendado-para-ti.png` (Expo Go).   - Hecho (2026-11-25, cierre por indicación de la persona): la persona probó la app en Expo Go y confirma que se cumple; no alcanzó a tomar capturas de CA-02 a CA-04. **Solo CA-01 tiene evidencia** (`docs/evidencia/015/01-ca01-recomendado-para-ti.png`); CA-02 a CA-04 se cierran sobre su palabra y con las pruebas automáticas (`flow.test.tsx`), como en 004–014. No se usó el MCP de Expo.

| Total | 8 tareas |
|---|---|
