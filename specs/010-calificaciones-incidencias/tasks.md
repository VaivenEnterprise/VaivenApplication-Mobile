# Tareas 010 — Calificaciones e incidencias (móvil)

- **Dueño:** MO-B · **Estado:** sin ejecutar · `[P]` = paralelizable
- **Prioridad:** primero calificaciones (T001–T006); después incidencias (T007–T011).

- [ ] **T001** [P] Calificaciones: tipos, claves, textos y esquema
  - Archivos: `src/features/ratings/{types.ts, keys.ts, schemas.ts, schemas.test.ts}`, `src/i18n/ratings.ts`, `src/i18n/index.ts` (una línea)
  - Agente: `dev-expo` · Depende de: 003-T003
  - Aceptación: `Rating`, `RatingStatus`; esquema (1–5, comentario ≤ 300); textos en español
  - Refs: RF-02

- [ ] **T002** [P] Componentes de estrellas y resumen
  - Archivos: `src/features/ratings/components/{StarRating,RatingSummary,RatingCard}.tsx`, pruebas
  - Agente: `dev-expo` · Depende de: 002-T015
  - Aceptación: `StarRating` editable y de solo lectura, accesible (valor leído); `RatingSummary` con 1 decimal o «Sin calificaciones» (P-05)
  - Refs: RF-03 · P-01

- [ ] **T003** API y hooks de calificaciones
  - Archivos: `src/features/ratings/{api.ts, hooks.ts, api.test.ts}`
  - Agente: `dev-expo` · Depende de: T001, 002-T011, 010-T001 (backend, contrato)
  - Aceptación: 3 rutas; `useUserRatings` con `useInfiniteQuery`; crear invalida `rating-status`, la reserva y el perfil
  - Refs: plan §2

- [ ] **T004** Formulario y tarjeta «Calificar» en la reserva
  - Archivos: `src/features/ratings/components/RatingForm.tsx`, `src/features/ratings/components/RateBookingCard.tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T002, T003
  - Aceptación: CA-01, CA-02; estados: puede calificar / ya calificó / ventana vencida / no aplica
  - Refs: RF-01, RF-02, RF-08

- [ ] **T005** Reputación en perfiles y tarjetas
  - Archivos: `src/features/ratings/components/{ReputationSection,RatingsList}.tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T002, T003, 003-T010
  - Aceptación: CA-03; lista paginada; vacío «Aún sin calificaciones»
  - Refs: RF-03, RF-04

- [ ] **T006** Registro de *slots* de calificaciones
  - Archivos: `src/features/ratings/index.ts`, `src/features/ratings/README.md`
  - Agente: `dev-expo` · Depende de: T004, T005, 007-T010
  - Aceptación: registra `ratingsAndIncidents` (parte de calificar) y `renderReputation`; exporta `RatingSummary` para 005
  - Refs: P-03 · Art. XIII

- [ ] **T007** [P] Incidencias: tipos, claves, textos, esquema y reglas
  - Archivos: `src/features/incidents/{types.ts, keys.ts, schemas.ts, rules.ts, rules.test.ts, schemas.test.ts}`, `src/i18n/incidents.ts`, `src/i18n/index.ts` (una línea)
  - Agente: `dev-expo` · Depende de: 007-T001
  - Aceptación: motivos (6); descripción 10–1000; `canReport(booking, now)` por estado y ventana de 72 h (CA-06)
  - Refs: RF-05 · P-02

- [ ] **T008** API y hooks de incidencias
  - Archivos: `src/features/incidents/{api.ts, hooks.ts, api.test.ts}`
  - Agente: `dev-expo` · Depende de: T007, 002-T011, 010-T001 (backend, contrato)
  - Aceptación: 3 rutas; `useMyIncidents` paginado; crear invalida lista y reserva; errores 409 mapeados
  - Refs: plan §2

- [ ] **T009** Formulario para reportar una incidencia
  - Archivos: `src/features/incidents/components/{IncidentForm,ReasonPicker}.tsx`, `src/features/incidents/screens/ReportIncidentScreen.tsx`, `src/app/incidencia/nueva/[bookingId].tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T008, 004-T008
  - Aceptación: motivo, descripción, hasta 5 fotos `evidence`; texto de qué ocurrirá (RF-06); éxito lleva al detalle
  - Refs: RF-05, RF-06

- [ ] **T010** Mis incidencias y detalle
  - Archivos: `src/features/incidents/components/{IncidentCard,IncidentSection}.tsx`, `src/features/incidents/screens/{MyIncidentsScreen,IncidentDetailScreen}.tsx`, `src/app/incidencias.tsx`, `src/app/incidencia/[id].tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T008
  - Aceptación: CA-04, CA-05; evidencia con URL firmada; notas visibles y respuesta final
  - Refs: RF-07

- [ ] **T011** Registro de *slots* de incidencias
  - Archivos: `src/features/incidents/index.ts`
  - Agente: `dev-expo` · Depende de: T009, T010, 003-T009
  - Aceptación: «Reportar incidencia» en `ratingsAndIncidents` (según `canReport`); fila «Mis incidencias» en `renderExtraRows` del perfil
  - Refs: Art. XIII

- [ ] **T012** Prueba de integración
  - Archivos: `src/features/ratings/trust.integration.test.tsx`
  - Agente: `qa-mobile` · Depende de: T006, T011
  - Aceptación: reserva concluida → calificar → ver reputación; reportar incidencia → aparece abierta; cobertura ≥ 80 % de ambas features
  - Refs: CA-01…CA-06

- [ ] **T013** Memoria y revisión
  - Archivos: `memoria.md` (solo anexar)
  - Agente: `revisor-constitucion` · Depende de: T012
  - Aceptación: **CONFORME**; hito H4 (móvil) marcado
  - Refs: DoD

- [ ] **T014** Verificación en Expo Go contra staging
  - Archivos: `memoria.md` (solo anexar), `docs/evidencia/010/` (capturas)
  - Agente: `probador-expo` · Depende de: T013 (y todas las anteriores `[x]`) y backend 010-T012 **desplegada**
  - Aceptación: `npm run typecheck && npm run lint && npm test` en verde; con `EXPO_PUBLIC_API_URL` de staging y `EXPO_UNSTABLE_MCP_SERVER=1`, la app abre en Expo Go y se recorren los criterios de aceptación (CA-xx) de esta spec, con capturas tomadas por el MCP `expo`; lo que Expo Go no permita probar (p. ej. push remoto en Android) se anota en `memoria.md` como no verificable. **La spec siguiente no empieza hasta que esta tarea pase.**
  - Refs: Art. XIV.4

| Total | 14 tareas |
|---|---|
