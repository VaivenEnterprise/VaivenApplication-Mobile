# Tareas 005 — Objetos (móvil)

- **Dueño:** MO-A · **Estado:** T001–T011 hechas y verificadas en copia de trabajo; T012 cerrada (veredicto CONFORME con reservas); T013 pendiente (evidencia en Expo Go) · `[P]` = paralelizable
- **Línea de corte:** T001–T008 son P0 (publicar, listar, detalle). T009–T010 (editar/pausar/sugerencia) son P1.

- [x] **T001** [P] Tipos, claves, textos y constantes de política
  - Archivos: `src/features/items/{types.ts, keys.ts}`, `src/i18n/items.ts`, `src/i18n/es-MX.ts` (reexportación, D-137), `src/lib/policy.ts`
  - Agente: `dev-expo` · Depende de: 003-T003
  - Aceptación: `Item`, `ItemInput`, `ItemStatus`, `Condition`, `Modality`; límites (fotos 1–5, título 3–80…) en `policy.ts`; textos de condición y modalidad en español
  - Refs: Art. XIII

- [x] **T002** [P] Componente `MoneyInput`
  - Archivos: `src/features/items/components/MoneyInput.tsx`, `MoneyInput.test.tsx`
  - Agente: `dev-expo` · Depende de: 002-T008, 003-T002
  - Aceptación: captura en pesos, devuelve centavos enteros; no admite más de 2 decimales; accesible; pruebas de redondeo
  - Refs: P-01 · Art. V

- [x] **T003** [P] Esquema del formulario
  - Archivos: `src/features/items/schemas.ts`, `src/features/items/schemas.test.ts`
  - Agente: `dev-expo` · Depende de: T001
  - Aceptación: reglas del backend 005 RF-01/RF-02 (préstamo = $0; renta entre $10 y valor declarado; valor $50–$100,000); mensajes en español
  - Refs: P-02

- [x] **T004** API y hooks de objetos
  - Archivos: `src/features/items/{api.ts, hooks.ts, api.test.ts}`
  - Agente: `dev-expo` · Depende de: T001, 002-T011, 005-T001 (backend, contrato)
  - Aceptación: funciones para las 9 rutas; `useMyItems` con `useInfiniteQuery`; mutaciones invalidan claves (P-03)
  - Refs: plan §2

- [x] **T005** Componentes de presentación
  - Archivos: `src/features/items/components/{ItemCard,ItemStatusBadge,PhotoGallery,OwnerCard,ConditionPicker,ModalityPicker}.tsx`, pruebas, `src/features/items/index.ts`
  - Agente: `dev-expo` · Depende de: T001, 004-T007
  - Aceptación: `ItemCard` (foto, título, precio, estado); `PhotoGallery` paginada; `OwnerCard` enlaza a `usuario/[id]`; todo con tokens y accesible; `index.ts` exporta lo que 006 reutiliza · `ItemCard` con variantes `grid` y `row` según spec §7.1 y §7.3; `OwnerCard` con `Avatar` y `RatingStars`
  - Refs: RF-06 · P-05

- [x] **T006** Mis objetos
  - Archivos: `src/features/items/screens/MyItemsScreen.tsx`, `src/app/(tabs)/mis-objetos/index.tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T004, T005, 003-T008
  - Aceptación: lista paginada con filtro por estado; vacío con acción; error con reintento; refresco manual · Diseño: spec §7.1
  - Refs: RF-01

- [x] **T007** Formulario de publicar
  - Archivos: `src/features/items/screens/ItemFormScreen.tsx`, `src/features/items/components/LocationField.tsx`, `src/app/(tabs)/mis-objetos/nuevo.tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T002, T003, T004, 004-T008
  - Aceptación: CA-01, CA-02, CA-04; `PhotoPicker` con `item_photo`; ubicación opcional con `expo-location`; conserva lo escrito si falla una foto (RNF-01); expone el *slot* `renderFormExtras({ photos, setValues })` para que la spec 014 (IA) agregue su banner sin editar el formulario · Diseño: spec §7.2 (secciones, casillas de foto, chips, hoja de moderación)
  - Refs: RF-02, RF-03, RF-05, RF-09

- [x] **T008** Detalle del objeto
  - Archivos: `src/features/items/screens/ItemDetailScreen.tsx`, `src/app/objeto/[id].tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T004, T005
  - Aceptación: CA-05; *slots* `renderActions`, `renderOwnerExtras` y `renderEffects(item)` (para efectos sin interfaz, como registrar la vista de la spec 015) documentados; estados de carga, error y no encontrado · Diseño: spec §7.3
  - Refs: RF-06, RF-08

- [x] **T009** [P] Editar, pausar, reanudar y eliminar
  - Archivos: `src/app/(tabs)/mis-objetos/[id]/editar.tsx`, `src/features/items/components/OwnerActions.tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T007, T008
  - Aceptación: CA-06; reutiliza `ItemFormScreen` en modo edición; eliminar con confirmación; errores 403/409 con mensaje · Confirmación de eliminar en `BottomSheet` según spec §7.3
  - Refs: RF-07

- [x] **T010** [P] Sugerencia de precio
  - Archivos: `src/features/items/components/PriceSuggestion.tsx`, prueba
  - Agente: `dev-expo` · Depende de: T007
  - Aceptación: CA-03; `suggested` pasa a `manual` si se edita
  - Refs: RF-04

- [x] **T011** Prueba de integración del flujo de publicación
  - Archivos: `src/features/items/items.integration.test.tsx`
  - Agente: `qa-mobile` · Depende de: T007, T008
  - Aceptación: llenar formulario → publicar → aparece en la lista → abrir detalle; cobertura ≥ 80 % de `features/items`
  - Refs: CA-01…CA-06

- [x] **T012** Memoria y revisión
  - Archivos: `memoria.md` (solo anexar)
  - Agente: `revisor-constitucion` · Depende de: T011
  - Aceptación: **CONFORME**; se avisa a MO-B que `ItemCard` está disponible para 006 y a MO-A (007) que el detalle tiene *slots*
  - Refs: DoD

- [x] **T013** Verificación en Expo Go contra staging
  - Archivos: `memoria.md` (solo anexar), `docs/evidencia/005/` (capturas)
  - Agente: `probador-expo` · Depende de: T012 (y todas las anteriores `[x]`) y backend 005-T010 **desplegada**
  - Aceptación: `npm run typecheck && npm run lint && npm test` en verde; con `EXPO_PUBLIC_API_URL` de staging y `EXPO_UNSTABLE_MCP_SERVER=1`, la app abre en Expo Go y se recorren los criterios de aceptación (CA-xx) de esta spec, con capturas tomadas por el MCP `expo`; lo que Expo Go no permita probar (p. ej. push remoto en Android) se anota en `memoria.md` como no verificable. **La spec siguiente no empieza hasta que esta tarea pase.** · **MCP de Expo opcional (decisión 9 nov):** se verifica a mano o con Claude en Expo Go contra el **backend local**; el staging queda para cuando exista
  - Refs: Art. XIV.4

| Total | 13 tareas |
|---|---|
