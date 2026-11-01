# Tareas 015 — Recomendaciones con ML (móvil)

- **Dueño:** MO-B · **Estado:** sin ejecutar · `[P]` = paralelizable
- Se ejecuta **después** del congelamiento de la 1.0 (15 nov).

- [ ] **T001** [P] Tipos, claves y textos
  - Archivos: `src/features/recommendations/{types.ts, keys.ts}`, `src/i18n/recommendations.ts`, `src/i18n/index.ts` (una línea)
  - Agente: `dev-expo` · Depende de: 006-T001
  - Aceptación: tipos `Recommendation { item, reason }`; textos de motivos, confirmación de borrado y estados
  - Refs: RF-01, RF-04

- [ ] **T002** API y hooks
  - Archivos: `src/features/recommendations/{api.ts, hooks.ts, hooks.test.ts}`
  - Agente: `dev-expo` · Depende de: T001, 015-T001 (backend, contrato)
  - Aceptación: `useRecommendations`, `useTrackView`, `useClearHistory`; caché de 5 min; errores silenciosos; lee `features.recommendations`
  - Refs: RF-02, RF-03, RF-05 · P-01, P-02

- [ ] **T003** Fila y tarjeta
  - Archivos: `src/features/recommendations/components/{RecommendedRow,RecommendedCard}.tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T002, 004-T007, 002-T015
  - Aceptación: carrusel horizontal con *skeleton*, motivo en una línea, accesible; no se muestra vacía
  - Refs: RF-01, RF-05, RNF-01 · P-04

- [ ] **T004** Integración por *slots* en Explorar y en el detalle
  - Archivos: `src/features/recommendations/index.ts` (exporta `renderTopSections` y `renderEffects`), una línea de uso en cada pantalla
  - Agente: `dev-expo` · Depende de: T003, 006-T005, 005-T008
  - Aceptación: CA-01, CA-02, CA-04; un solo evento por apertura; sin editar lógica ajena
  - Refs: RF-01, RF-03 · P-03

- [ ] **T005** Borrar historial en Perfil
  - Archivos: `src/features/recommendations/components/ClearHistoryRow.tsx`, prueba
  - Agente: `dev-expo` · Depende de: T002, 003-T008
  - Aceptación: fila por *slot* `renderExtraRows`; confirmación; CA-03
  - Refs: RF-04

- [ ] **T006** Prueba del flujo
  - Archivos: `src/features/recommendations/flow.test.tsx`
  - Agente: `qa-mobile` · Depende de: T004, T005
  - Aceptación: CA-01 a CA-04 con la API simulada
  - Refs: RNF-01

- [ ] **T007** Cumplimiento, versión y revisión
  - Archivos: `landing/privacidad/index.html`, `docs/play/cumplimiento.md`, `memoria.md` (solo anexar)
  - Agente: `spec-writer` + **admin** (Play Console) + `revisor-constitucion` · Depende de: T006, backend 015-T010
  - Aceptación: privacidad y «Seguridad de datos» declaran el historial de recomendaciones (CA-05), junto con lo de la IA (014-T006); incluida en la v1.1; **CONFORME**
  - Refs: RF-06

- [ ] **T008** Verificación en Expo Go contra staging
  - Archivos: `memoria.md` (solo anexar), `docs/evidencia/015/` (capturas)
  - Agente: `probador-expo` · Depende de: T007 (y todas las anteriores `[x]`) y backend 015-T011 **desplegada**
  - Aceptación: `npm run typecheck && npm run lint && npm test` en verde; con `EXPO_PUBLIC_API_URL` de staging y `EXPO_UNSTABLE_MCP_SERVER=1`, la app abre en Expo Go y se recorren los criterios de aceptación (CA-xx) de esta spec, con capturas tomadas por el MCP `expo`; lo que Expo Go no permita probar (p. ej. push remoto en Android) se anota en `memoria.md` como no verificable. **La spec siguiente no empieza hasta que esta tarea pase.**
  - Refs: Art. XIV.4

| Total | 8 tareas |
|---|---|
