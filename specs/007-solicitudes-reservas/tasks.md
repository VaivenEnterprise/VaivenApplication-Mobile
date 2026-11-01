# Tareas 007 — Solicitudes y reservas (móvil)

- **Dueño:** MO-A · **Estado:** sin ejecutar · `[P]` = paralelizable
- Hito: al terminar T010 ya existe el detalle con *slots* que 008, 009 y 010 necesitan. Terminarlo el **6 nov**.

- [ ] **T001** [P] Tipos, claves, textos y utilidades de fechas
  - Archivos: `src/features/bookings/{types.ts, keys.ts, dates.ts, dates.test.ts}`, `src/i18n/bookings.ts`, `src/i18n/index.ts` (una línea)
  - Agente: `dev-expo` · Depende de: 003-T003, 002-T008
  - Aceptación: `Booking`, `Quote`, `BookingStatus`; `addDays`, `diffDaysInclusive`, `isPast` sobre `YYYY-MM-DD` sin `Date` local; textos de estados
  - Refs: P-01 · Art. V

- [ ] **T002** [P] Reglas de acciones por rol y estado
  - Archivos: `src/features/bookings/rules.ts`, `src/features/bookings/rules.test.ts`
  - Agente: `dev-expo` · Depende de: T001
  - Aceptación: matriz `viewerRole × status` → acciones permitidas (aceptar, rechazar, cancelar, proponer punto); máx. 7 días; prueba exhaustiva de la matriz
  - Refs: RF-07, RF-08 · P-02

- [ ] **T003** API y hooks
  - Archivos: `src/features/bookings/{api.ts, hooks.ts, api.test.ts}`
  - Agente: `dev-expo` · Depende de: T001, 002-T011, 007-T001 (backend, contrato)
  - Aceptación: 8 rutas; `useMyBookings` con `useInfiniteQuery`; mutaciones actualizan el detalle con la respuesta e invalidan listas (P-06); 409 `quote_changed` mapeado
  - Refs: plan §2

- [ ] **T004** [P] Componentes de presentación
  - Archivos: `src/features/bookings/components/{StatusBadge,QuoteSummary,BookingCard,ExpiryCountdown,MeetingPointCard}.tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T001
  - Aceptación: `StatusBadge` con color de tokens y texto (no solo color); `QuoteSummary` con desglose y política; cuenta regresiva con reloj falso en pruebas
  - Refs: RF-03, RF-09

- [ ] **T005** [P] Selectores de fechas y modo de pago
  - Archivos: `src/features/bookings/components/{DateRangePicker,PaymentModePicker}.tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T001, 002-T024
  - Aceptación: `@react-native-community/datetimepicker` en Android e iOS; bloquea pasadas y > 7 días (CA-02)
  - Refs: RF-02

- [ ] **T006** Pantalla Solicitar
  - Archivos: `src/features/bookings/screens/RequestScreen.tsx`, `src/app/solicitar/[itemId].tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T003, T004, T005
  - Aceptación: CA-01, CA-03; casilla «Entiendo»; envío con `acceptedTotalCents`; errores de conflicto y cambio de precio; al éxito navega al detalle de la reserva
  - Refs: RF-02…RF-04

- [ ] **T007** Botón «Solicitar» en el detalle del objeto
  - Archivos: `src/features/bookings/components/RequestButton.tsx`, `src/features/bookings/index.ts`, prueba (se conecta al *slot* `renderActions` con **una línea** en `src/app/objeto/[id].tsx`, acordada con MO-A/005)
  - Agente: `dev-expo` · Depende de: T006, 005-T008
  - Aceptación: oculto si soy dueño o el objeto no está activo
  - Refs: RF-01

- [ ] **T008** Pestaña Actividad
  - Archivos: `src/features/bookings/screens/ActivityScreen.tsx`, `src/app/(tabs)/actividad/index.tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T003, T004, 003-T008
  - Aceptación: CA-04; segmentos propietario/solicitante; filtro de estado; paginación; vacío; error
  - Refs: RF-05

- [ ] **T009** Acciones de la reserva
  - Archivos: `src/features/bookings/components/BookingActions.tsx`, `src/features/bookings/components/CancelSheet.tsx`, `src/features/bookings/components/AcceptSheet.tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T002, T003
  - Aceptación: CA-05, CA-07; aceptar con punto de encuentro opcional; cancelar con motivo y confirmación con consecuencias; punto de encuentro editable en `accepted`
  - Refs: RF-07, RF-08

- [ ] **T010** Detalle de reserva con *slots*
  - Archivos: `src/features/bookings/slots.ts`, `src/features/bookings/screens/BookingDetailScreen.tsx`, `src/app/reserva/[id].tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T004, T009
  - Aceptación: CA-06; secciones `chat`, `deliveryAndPayments`, `ratingsAndIncidents` que se pintan si hay componente registrado; documentación del registro en `slots.ts`
  - Refs: RF-06, RF-10 · P-04

- [ ] **T011** Prueba de integración del flujo de solicitud
  - Archivos: `src/features/bookings/bookings.integration.test.tsx`
  - Agente: `qa-mobile` · Depende de: T008, T010
  - Aceptación: detalle del objeto → solicitar → ver en Actividad → (como propietario) aceptar → estado aceptada; cobertura ≥ 80 % de `features/bookings`
  - Refs: CA-01…CA-07

- [ ] **T012** Memoria y revisión
  - Archivos: `memoria.md` (solo anexar)
  - Agente: `revisor-constitucion` · Depende de: T011
  - Aceptación: **CONFORME**; hito H3 (móvil) marcado; se avisa a MO-B (008, 010, 011) y a MO-A (009) cómo registrar *slots*
  - Refs: DoD

- [ ] **T013** Verificación en Expo Go contra staging
  - Archivos: `memoria.md` (solo anexar), `docs/evidencia/007/` (capturas)
  - Agente: `probador-expo` · Depende de: T012 (y todas las anteriores `[x]`) y backend 007-T013 **desplegada**
  - Aceptación: `npm run typecheck && npm run lint && npm test` en verde; con `EXPO_PUBLIC_API_URL` de staging y `EXPO_UNSTABLE_MCP_SERVER=1`, la app abre en Expo Go y se recorren los criterios de aceptación (CA-xx) de esta spec, con capturas tomadas por el MCP `expo`; lo que Expo Go no permita probar (p. ej. push remoto en Android) se anota en `memoria.md` como no verificable. **La spec siguiente no empieza hasta que esta tarea pase.**
  - Refs: Art. XIV.4

| Total | 13 tareas |
|---|---|
