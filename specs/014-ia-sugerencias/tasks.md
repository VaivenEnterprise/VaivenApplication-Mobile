# Tareas 014 — Sugerencias con IA (móvil)

- **Dueño:** MO-A (T006 de MO-B) · **Estado:** sin ejecutar · `[P]` = paralelizable
- Se ejecuta **después** del congelamiento de la 1.0 (15 nov).

- [ ] **T001** [P] Tipos, claves y textos
  - Archivos: `src/features/ai-suggestions/{types.ts, keys.ts}`, `src/i18n/aiSuggestions.ts`, `src/i18n/index.ts` (una línea)
  - Agente: `dev-expo` · Depende de: 005-T001
  - Aceptación: tipos `ListingSuggestion { title, category, description? }`; textos de botón, aviso, errores y límite
  - Refs: RF-01, RF-04

- [ ] **T002** API y hook `useListingSuggestion`
  - Archivos: `src/features/ai-suggestions/{api.ts, useListingSuggestion.ts, useListingSuggestion.test.ts}`
  - Agente: `dev-expo` · Depende de: T001, 014-T001 (backend, contrato)
  - Aceptación: llama al endpoint con el `publicId`; estados cargando/éxito/error/límite; cancelable; sin reintentos automáticos; lee `features.aiSuggestions` de `/meta`
  - Refs: RF-02, RF-04 · P-01

- [ ] **T003** Componente `SuggestionBanner`
  - Archivos: `src/features/ai-suggestions/components/{SuggestionBanner.tsx, SuggestionBanner.test.tsx}`, `src/features/ai-suggestions/index.ts`
  - Agente: `dev-expo` · Depende de: T002, 002-T015
  - Aceptación: botón «Sugerir con IA» con aviso; tarjeta con **Usar / Editar / Descartar**; accesible; CA-01, CA-02
  - Refs: RF-01, RF-03, RNF-01 · P-03

- [ ] **T004** Integración en el formulario por *slot*
  - Archivos: `src/features/ai-suggestions/index.ts` (exporta `renderFormExtras`), una línea de uso en el formulario de 005
  - Agente: `dev-expo` · Depende de: T003, 005-T007
  - Aceptación: aparece solo con la IA activa y al menos una foto `item_photo`; usar rellena título y categoría validada contra las categorías (P-02); CA-03
  - Refs: RF-02, RF-05 · P-02, P-04

- [ ] **T005** Prueba del flujo
  - Archivos: `src/features/ai-suggestions/flow.test.tsx`
  - Agente: `qa-mobile` · Depende de: T004
  - Aceptación: CA-01 a CA-04 con la API simulada; el formulario sigue funcionando con la IA caída
  - Refs: RNF-01

- [ ] **T006** Cumplimiento: privacidad y Seguridad de datos (**MO-B**)
  - Archivos: `landing/privacidad/index.html`, `docs/play/cumplimiento.md`, `docs/play/seguimiento.md`
  - Agente: `spec-writer` + **admin** (Play Console) · Depende de: backend 014-T008
  - Aceptación: privacidad menciona el envío de la foto al proveedor de IA a petición de la persona; Play «Seguridad de datos» actualizado antes de subir la v1.1; CA-05
  - Refs: RF-06

- [ ] **T007** Versión 1.1 y revisión
  - Archivos: `app.config.ts` (`version: 1.1.0`), `memoria.md` (solo anexar)
  - Agente: `revisor-constitucion` · Depende de: T005, T006
  - Aceptación: AAB 1.1 subido a la prueba cerrada (25 nov) y a producción cuando la 1.0 esté aprobada; **CONFORME**
  - Refs: DoD

- [ ] **T008** Verificación en Expo Go contra staging
  - Archivos: `memoria.md` (solo anexar), `docs/evidencia/014/` (capturas)
  - Agente: `probador-expo` · Depende de: T007 (y todas las anteriores `[x]`) y backend 014-T009 **desplegada**
  - Aceptación: `npm run typecheck && npm run lint && npm test` en verde; con `EXPO_PUBLIC_API_URL` de staging y `EXPO_UNSTABLE_MCP_SERVER=1`, la app abre en Expo Go y se recorren los criterios de aceptación (CA-xx) de esta spec, con capturas tomadas por el MCP `expo`; lo que Expo Go no permita probar (p. ej. push remoto en Android) se anota en `memoria.md` como no verificable. **La spec siguiente no empieza hasta que esta tarea pase.**
  - Refs: Art. XIV.4

| Total | 8 tareas |
|---|---|
