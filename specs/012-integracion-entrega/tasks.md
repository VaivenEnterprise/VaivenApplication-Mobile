# Tareas 012 — Integración, pulido y entrega (móvil)

- **Dueños:** indicados por tarea · **Estado:** sin ejecutar · `[P]` = paralelizable
- Esta spec **no agrega funcionalidad**. Los defectos hallados se corrigen en la feature y por su dueño (Art. XIII).

- [ ] **T001** [P] Detección de conexión y banner
  - Archivos: `src/features/connectivity/{useOnline.ts, OfflineBanner.tsx, useOnline.test.ts, OfflineBanner.test.tsx}`, `src/app/_layout.tsx` (una línea)
  - Dueño: MO-B · Agente: `dev-expo` · Depende de: 003-T008
  - Aceptación: CA-02; sin dependencia nueva (P-01); reintento con *backoff*; el banner no bloquea
  - Refs: RF-02

- [ ] **T002** Prueba E2E con red simulada
  - Archivos: `src/__e2e__/journey.integration.test.tsx`, `src/__e2e__/fakeApi.ts`
  - Dueño: MO-A · Agente: `qa-mobile` · Depende de: 007-T011, 009-T008
  - Aceptación: solicitud → aceptación → entrega con QR → devolución → calificación con dobles de las rutas del contrato; falla si se rompe un contrato
  - Refs: RF-10 · P-05

- [ ] **T003** Pasada de estados por pantalla
  - Archivos: `docs/validacion.md` (lista), correcciones puntuales en las features afectadas (cada una por su dueño)
  - Dueño: MO-A y MO-B (reparten por feature) · Agente: `qa-mobile` · Depende de: 011 integradas
  - Aceptación: CA-03; cada pantalla con datos tiene carga, vacío, error y reintento; lista de comprobación completa
  - Refs: RF-03 · P-03

- [ ] **T004** [P] Accesibilidad básica
  - Archivos: `docs/accesibilidad.md`; correcciones en `src/components/*` y features
  - Dueño: MO-B · Agente: `dev-expo` · Depende de: T003
  - Aceptación: CA-04; etiquetas, roles, toque ≥ 44 dp, estados no solo por color; resultados anotados
  - Refs: RF-04 · P-04

- [ ] **T005** [P] Ícono, *splash* e identidad mínima
  - Archivos: `assets/*`, `app.config.ts`, `src/theme/tokens.ts`
  - Dueño: MO-B · Agente: `dev-expo` · Depende de: 002-T025
  - Aceptación: ícono adaptable, splash y color de marca; sin elementos con derechos de terceros
  - Refs: RF-05

- [ ] **T006** Verificación en Expo Go apuntando a staging
  - Archivos: `docs/entorno-local.md`, `memoria.md` (solo anexar)
  - Dueño: MO-B · Agente: — (manual) · Depende de: T005, 012-T009 (backend)
  - Aceptación: app abierta en Expo Go en 2 teléfonos contra staging; evidencia anotada; `/readyz` verde en diagnóstico
  - Refs: RF-01 · P-06

- [ ] **T007** Recorrido manual con 2 teléfonos
  - Archivos: `docs/validacion.md` (resultados), `memoria.md` (solo anexar)
  - Dueño: MO-A y MO-B (una persona por teléfono) · Agente: — (manual) · Depende de: T006, 012-T005 (backend, datos `seed`)
  - Aceptación: CA-01; cada fallo con pasos, causa y corrección o decisión de dejarlo; ninguno bloqueante pendiente el 22 nov
  - Refs: RF-06

- [ ] **T008** Revisión de seguridad
  - Archivos: `docs/seguridad.md`
  - Dueño: MO-A · Agente: `revisor-constitucion` · Depende de: T006
  - Aceptación: CA-05; búsqueda de secretos en el repositorio; tokens solo en `SecureStore`; permisos declarados mínimos; sin PII en logs
  - Refs: RF-07 · P-07

- [ ] **T009** [P] Rendimiento básico
  - Archivos: `docs/validacion.md` (sección rendimiento)
  - Dueño: MO-B · Agente: `qa-mobile` · Depende de: T006
  - Aceptación: tiempo de arranque medido en un teléfono de gama media (< 3 s o desviación anotada); listas con paginación; sin renders excesivos en listas largas
  - Refs: RF-08

- [ ] **T010** [P] Documentación final
  - Archivos: `README.md`, `docs/demo.md`, `docs/validacion.md` (plan de validación con personas usuarias, sin presentar expectativas como resultados)
  - Dueño: MO-B · Agente: `spec-writer` · Depende de: T007
  - Aceptación: `demo.md` sigue las cuentas de `seed`; quien no conoce el proyecto instala y recorre la app sin ayuda
  - Refs: RF-09

- [ ] **T011** Revisión final y congelamiento
  - Archivos: `memoria.md` (solo anexar), etiqueta `v1.0.0-mobile`
  - Dueño: MO-A · Agente: `revisor-constitucion` · Depende de: T002, T008, T010
  - Aceptación: veredicto **CONFORME** sobre todo el repositorio; `npm run check` pasa; cobertura global ≥ 70 %; código congelado el 22 de nov
  - Refs: RNF-01, RF-10

- [ ] **T012** Verificación en Expo Go contra staging
  - Archivos: `memoria.md` (solo anexar), `docs/evidencia/012/` (capturas)
  - Agente: `probador-expo` · Depende de: T011 (y todas las anteriores `[x]`) y backend 012-T012 **desplegada**
  - Aceptación: `npm run typecheck && npm run lint && npm test` en verde; con `EXPO_PUBLIC_API_URL` de staging y `EXPO_UNSTABLE_MCP_SERVER=1`, la app abre en Expo Go y se recorren los criterios de aceptación (CA-xx) de esta spec, con capturas tomadas por el MCP `expo`; lo que Expo Go no permita probar (p. ej. push remoto en Android) se anota en `memoria.md` como no verificable. **La spec siguiente no empieza hasta que esta tarea pase.**
  - Refs: Art. XIV.4

| Total | 12 tareas |
|---|---|
