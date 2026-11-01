# Tareas 006 — Búsqueda y exploración (móvil)

- **Dueño:** MO-B · **Estado:** sin ejecutar · `[P]` = paralelizable
- **Línea de corte:** T001–T006 (texto + categoría + lista) son P0; fechas y distancia (T007–T008) son P1.

- [ ] **T001** [P] Tipos, claves, textos y conversión de filtros
  - Archivos: `src/features/search/{types.ts, keys.ts, filters.ts, filters.test.ts}`, `src/i18n/search.ts`, `src/i18n/index.ts` (una línea)
  - Agente: `dev-expo` · Depende de: 003-T003
  - Aceptación: `SearchFilters`; conversión filtros ↔ *search params* ↔ query string, con pruebas de ida y vuelta; valores vacíos omitidos
  - Refs: P-01

- [ ] **T002** API y hook de búsqueda
  - Archivos: `src/features/search/{api.ts, hooks.ts, hooks.test.ts}`
  - Agente: `dev-expo` · Depende de: T001, 002-T011, 006-T001 (backend, contrato)
  - Aceptación: `useSearchItems` con `useInfiniteQuery`; `signal` para cancelar (RF-08); `useDebouncedValue` 400 ms (CA-02)
  - Refs: RF-01, RF-02, RF-08

- [ ] **T003** [P] Barra de búsqueda y chips de categoría
  - Archivos: `src/features/search/components/{SearchBar,CategoryChips}.tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T001, 005-T001
  - Aceptación: usa `useCategories`; chips con selección única y «Todas»; accesibles
  - Refs: RF-01

- [ ] **T004** [P] Lista de resultados
  - Archivos: `src/features/search/components/ResultsList.tsx`, `ResultsList.test.tsx`
  - Agente: `dev-expo` · Depende de: T002, 005-T005
  - Aceptación: `FlatList` con `ItemCard`, esqueleto de carga, «cargando más», vacío con «Limpiar filtros» (CA-06), error con reintento
  - Refs: RF-06, RNF-01

- [ ] **T005** Pantalla Explorar
  - Archivos: `src/features/search/screens/ExploreScreen.tsx`, `src/app/(tabs)/explorar/index.tsx`, pruebas
  - Nota: expone el *slot* `renderTopSections()` sobre la lista (lo usa la spec 015 para «Recomendado para ti»)
  - Agente: `dev-expo` · Depende de: T003, T004, 003-T008
  - Aceptación: CA-01, CA-02, CA-05; estado en *search params*; tocar tarjeta abre `objeto/[id]`
  - Refs: RF-01, RF-05, RF-07

- [ ] **T006** Prueba de integración de búsqueda por texto y categoría
  - Archivos: `src/features/search/search.integration.test.tsx`
  - Agente: `qa-mobile` · Depende de: T005
  - Aceptación: escribir → una petición → resultados → abrir detalle → volver conserva estado
  - Refs: CA-01, CA-02, CA-05

- [ ] **T007** [P] Hoja de filtros y selector de fechas
  - Archivos: `src/features/search/components/{FilterSheet,DateRangeField}.tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T005
  - Aceptación: modalidad, municipio, fechas (`from ≤ to`, sin pasadas); contador de filtros activos; «Limpiar»; CA-03
  - Refs: RF-03 · P-04

- [ ] **T008** [P] Distancia y ubicación
  - Archivos: `src/features/search/components/DistanceField.tsx`, `src/features/search/useLocation.ts`, pruebas
  - Agente: `dev-expo` · Depende de: T007
  - Aceptación: permiso al usarse; negado → se oculta el filtro (CA-04); radios 1/3/5/10 km; distancia mostrada «a ~N km»
  - Refs: RF-04 · P-06

- [ ] **T009** Memoria y revisión
  - Archivos: `memoria.md` (solo anexar)
  - Agente: `revisor-constitucion` · Depende de: T006, T008
  - Aceptación: **CONFORME**; hito H2 (móvil) marcado
  - Refs: DoD

- [ ] **T010** Verificación en Expo Go contra staging
  - Archivos: `memoria.md` (solo anexar), `docs/evidencia/006/` (capturas)
  - Agente: `probador-expo` · Depende de: T009 (y todas las anteriores `[x]`) y backend 006-T010 **desplegada**
  - Aceptación: `npm run typecheck && npm run lint && npm test` en verde; con `EXPO_PUBLIC_API_URL` de staging y `EXPO_UNSTABLE_MCP_SERVER=1`, la app abre en Expo Go y se recorren los criterios de aceptación (CA-xx) de esta spec, con capturas tomadas por el MCP `expo`; lo que Expo Go no permita probar (p. ej. push remoto en Android) se anota en `memoria.md` como no verificable. **La spec siguiente no empieza hasta que esta tarea pase.**
  - Refs: Art. XIV.4

| Total | 10 tareas |
|---|---|
