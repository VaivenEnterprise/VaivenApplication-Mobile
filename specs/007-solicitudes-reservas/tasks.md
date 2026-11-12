# Tareas 007 — Solicitudes y reservas (móvil)

- **Dueño:** MO-A · **Estado:** T001–T011, T014 y T015 hechas y verificadas en copia de trabajo; T012 cerrada (CONFORME con reservas; marcar H3 y avisar a MO-B y MO-A los hace la persona); T013 cerrada sobre la palabra de la persona (Expo Go, sin capturas) · `[P]` = paralelizable
- Hito: al terminar T010 ya existe el detalle con *slots* que 008, 009 y 010 necesitan. Terminarlo el **11 nov**.

- [x] **T001** [P] Tipos, claves, textos y utilidades de fechas
  - Archivos: `src/features/bookings/{types.ts, keys.ts, dates.ts, dates.test.ts}`, `src/i18n/bookings.ts`, `src/i18n/index.ts` (una línea)
  - Agente: `dev-expo` · Depende de: 003-T003, 002-T008
  - Aceptación: `Booking`, `Quote`, `BookingStatus`; `addDays`, `diffDaysInclusive`, `isPast` sobre `YYYY-MM-DD` sin `Date` local; textos de estados
  - Refs: P-01 · Art. V

- [x] **T002** [P] Reglas de acciones por rol y estado
  - Archivos: `src/features/bookings/rules.ts`, `src/features/bookings/rules.test.ts`
  - Agente: `dev-expo` · Depende de: T001
  - Aceptación: matriz `viewerRole × status` → acciones permitidas (aceptar, rechazar, cancelar, proponer punto); máx. 7 días; prueba exhaustiva de la matriz
  - Refs: RF-07, RF-08 · P-02

- [x] **T003** API y hooks
  - Archivos: `src/features/bookings/{api.ts, hooks.ts, api.test.ts}`
  - Agente: `dev-expo` · Depende de: T001, 002-T011, 007-T001 (backend, contrato)
  - Aceptación: 8 rutas; `useMyBookings` con `useInfiniteQuery`; mutaciones actualizan el detalle con la respuesta e invalidan listas (P-06); 409 `quote_changed` mapeado
  - Refs: plan §2

- [x] **T004** [P] Componentes de presentación
  - Archivos: `src/features/bookings/components/{StatusBadge,QuoteSummary,BookingCard,ExpiryCountdown,MeetingPointCard}.tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T001
  - Aceptación: `StatusBadge` con color de tokens y texto (no solo color); `QuoteSummary` con desglose y política; cuenta regresiva con reloj falso en pruebas · `StatusBadge` con los colores de spec 002 §9.2; `BookingCard` según spec §7.4
  - Refs: RF-03, RF-09

- [x] **T005** [P] Selectores de fechas y modo de pago
  - Archivos: `src/features/bookings/components/{DateRangePicker,PaymentModePicker}.tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T001, 002-T024
  - Aceptación: `@react-native-community/datetimepicker` en Android e iOS; bloquea pasadas y > 7 días (CA-02) · `PaymentModePicker` como dos tarjetas seleccionables (spec §7.3)
  - Refs: RF-02

- [x] **T006** Pantalla Solicitar
  - Archivos: `src/features/bookings/screens/RequestScreen.tsx`, `src/app/solicitar/[itemId].tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T003, T004, T005
  - Aceptación: CA-01, CA-03; casilla «Entiendo»; envío con `acceptedTotalCents`; errores de conflicto y cambio de precio; al éxito navega al detalle de la reserva · `RequestScreen` como `BottomSheet` según spec §7.3, con estados de éxito y errores `quote_changed` y fechas ocupadas
  - Refs: RF-02…RF-04

- [x] **T007** Botón «Solicitar» en el detalle del objeto
  - Archivos: `src/features/bookings/components/RequestButton.tsx`, `src/features/bookings/index.ts`, prueba (se conecta al *slot* `renderActions` con **una línea** en `src/app/objeto/[id].tsx`, acordada con MO-A/005)
  - Agente: `dev-expo` · Depende de: T006, 005-T008
  - Aceptación: oculto si soy dueño o el objeto no está activo
  - Refs: RF-01

- [x] **T008** Pestaña Actividad
  - Archivos: `src/features/bookings/screens/ActivityScreen.tsx`, `src/app/(tabs)/actividad/index.tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T003, T004, 003-T008
  - Aceptación: CA-04; segmentos propietario/solicitante; filtro de estado; paginación; vacío; error · Diseño: spec §7.4
  - Refs: RF-05

- [x] **T009** Acciones de la reserva
  - Archivos: `src/features/bookings/components/BookingActions.tsx`, `src/features/bookings/components/CancelSheet.tsx`, `src/features/bookings/components/AcceptSheet.tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T002, T003
  - Aceptación: CA-05, CA-07; aceptar con punto de encuentro opcional; cancelar con motivo y confirmación con consecuencias; punto de encuentro editable en `accepted` · `AcceptSheet`, `CancelSheet` y hoja de rechazo según spec §7.5
  - Refs: RF-07, RF-08

- [x] **T010** Detalle de reserva con *slots*
  - Archivos: `src/features/bookings/slots.ts`, `src/features/bookings/screens/BookingDetailScreen.tsx`, `src/app/reserva/[id].tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T004, T009
  - Aceptación: CA-06; secciones `chat`, `deliveryAndPayments`, `ratingsAndIncidents` que se pintan si hay componente registrado; documentación del registro en `slots.ts` · Diseño: spec §7.5 (línea de avance, tarjetas y barra inferior por rol)
  - Refs: RF-06, RF-10 · P-04

- [x] **T011** Prueba de integración del flujo de solicitud
  - Archivos: `src/features/bookings/bookings.integration.test.tsx`
  - Agente: `qa-mobile` · Depende de: T008, T010
  - Aceptación: detalle del objeto → solicitar → ver en Actividad → (como propietario) aceptar → estado aceptada; cobertura ≥ 80 % de `features/bookings`
  - Refs: CA-01…CA-07

- [x] **T012** Memoria y revisión
  - Archivos: `memoria.md` (solo anexar)
  - Agente: `revisor-constitucion` · Depende de: T011, T015
  - Aceptación: **CONFORME**; hito H3 (móvil) marcado; se avisa a MO-B (008, 010, 011) y a MO-A (009) cómo registrar *slots*
  - Refs: DoD

- [x] **T013** Verificación en Expo Go contra staging
  - Archivos: `memoria.md` (solo anexar), `docs/evidencia/007/` (capturas)
  - Agente: `probador-expo` · Depende de: T012 (y todas las anteriores `[x]`) y backend 007-T013 **desplegada**
  - Aceptación: `npm run typecheck && npm run lint && npm test` en verde; con `EXPO_PUBLIC_API_URL` de staging y `EXPO_UNSTABLE_MCP_SERVER=1`, la app abre en Expo Go y se recorren los criterios de aceptación (CA-xx) de esta spec, con capturas tomadas por el MCP `expo`; lo que Expo Go no permita probar (p. ej. push remoto en Android) se anota en `memoria.md` como no verificable. **La spec siguiente no empieza hasta que esta tarea pase.** · **MCP de Expo opcional (decisión 9 nov):** se verifica a mano o con Claude en Expo Go contra el **backend local**; el staging queda para cuando exista
  - Refs: Art. XIV.4

- [x] **T014** [P] Mapa del vecindario
  - Archivos: `src/components/map/NeighborhoodMap.tsx`, `src/features/project-guide/geometry.ts`, pruebas
  - Agente: `dev-expo` · Depende de: T001, 002-T006
  - Aceptación: dibuja el esquema con `react-native-svg` y solo *tokens* de mapa; `geometry.ts` convierte ubicaciones aproximadas en posiciones relativas y escala al 80 % del radio (prueba de tabla: un pin a 300 m, otro a 800 m, uno sin ubicación → no se dibuja); cada pin con etiqueta accesible; sin dependencias nuevas
  - Refs: RF-14 · P-08

- [x] **T015** Pantalla de proyecto
  - Archivos: `src/features/project-guide/{hooks.ts,screens/ProjectScreen.tsx}`, `src/features/project-guide/components/{ToolRow,StepCard,PinCard,ProjectDoneSheet}.tsx`, `src/app/proyecto/[id].tsx`, `src/features/project-guide/index.ts`, pruebas
  - Agente: `dev-expo` · Depende de: T006, T014, 006-T002, 006-T011, 002-T030
  - Aceptación: CA-08 a CA-13; reproduce spec §7.1 y no muestra nada de §7.6; una consulta por herramienta (`useQueries`) y «Ampliar» a 10 km; fila y pin se sincronizan; «Terminé mi proyecto» según avance; ubicación negada → invitación a activarla; pruebas con doble de red y de ubicación
  - Refs: RF-12 a RF-15 · P-09, P-10, P-11

| Total | 15 tareas |
|---|---|
