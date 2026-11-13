# Tareas 009 — Entrega, devolución y pagos (móvil)

- **Dueño:** MO-A · **Estado:** T001–T013 hechas · `[P]` = paralelizable
- **Punto de control mínimo (entregable):** T001–T008 (evidencia + QR de entrega y devolución). Pagos, línea de tiempo y retrasos (T009–T011) son P1.

- [x] **T001** [P] Tipos, claves, textos y reglas de rol
  - Archivos: `src/features/handover/{types.ts, keys.ts, roles.ts, roles.test.ts}`, `src/i18n/handover.ts`, `src/i18n/index.ts` (una línea)
  - Agente: `dev-expo` · Depende de: 007-T001
  - Aceptación: `Stage`, `Adjustment`, `StageName`; `roles.ts` con la matriz etapa × rol; prueba exhaustiva (CA-05)
  - Refs: RF-03 · P-01

- [x] **T002** [P] Análisis del código QR
  - Archivos: `src/features/handover/qr.ts`, `src/features/handover/qr.test.ts`
  - Agente: `dev-expo` · Depende de: T001
  - Aceptación: valida esquema, `b`, `s`, `t`; errores tipados (`not_vaiven`, `wrong_booking`, `wrong_stage`, `malformed`); CA-02
  - Refs: RF-05 · P-02

- [x] **T003** API y hooks de entrega/devolución
  - Archivos: `src/features/handover/{api.ts, hooks.ts, api.test.ts}`
  - Agente: `dev-expo` · Depende de: T001, 002-T011, 009-T001 (backend, contrato)
  - Aceptación: rutas de evidencia, QR, confirmación y pagos; tras cada mutación se actualiza la reserva (RF-10); 409/410 mapeados (QR vencido/usado)
  - Refs: plan §2

- [x] **T004** Formulario de evidencia
  - Archivos: `src/features/handover/components/{EvidenceForm,EvidenceGallery}.tsx`, `src/features/handover/screens/EvidenceScreen.tsx`, `src/app/entrega/[bookingId]/evidencia.tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T003, 004-T008
  - Aceptación: notas ≤ 500 y ≤ 5 fotos `evidence`; editable hasta confirmar; fotos vistas con URL firmada sin caché persistente · Diseño: spec §7.2
  - Refs: RF-02 · P-07

- [x] **T005** Mostrar el QR
  - Archivos: `src/features/handover/components/QrDisplay.tsx`, `src/features/handover/screens/QrScreen.tsx`, `src/app/entrega/[bookingId]/qr.tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T003
  - Aceptación: dibuja `qrPayload` con `react-native-qrcode-svg`; cuenta regresiva 15 min con reloj falso en pruebas; «Generar nuevo» al expirar (CA-03); token solo en memoria · Diseño y estados de vencido y confirmado: spec §7.3; consulta cada 5 s (RF-12)
  - Refs: RF-04 · P-04, P-05

- [x] **T006** Escanear el QR
  - Archivos: `src/features/handover/components/{QrScanner,ManualCodeEntry}.tsx`, `src/features/handover/screens/ScanScreen.tsx`, `src/app/entrega/[bookingId]/escanear.tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T002, T003
  - Aceptación: `CameraView` con un solo disparo (*latch*); permiso al usarse; permiso negado → ingreso manual (CA-07); resultados y errores en español (RF-06) · Diseño, resultados, sin permiso y código manual: spec §7.4
  - Refs: RF-05, RF-06 · P-03

- [x] **T007** Sección Entrega/Devolución en el detalle de la reserva
  - Archivos: `src/features/handover/components/StageSection.tsx`, `src/features/handover/index.ts` (registro del *slot* `deliveryAndPayments`), pruebas
  - Agente: `dev-expo` · Depende de: T004, T005, T006, 007-T010
  - Aceptación: CA-01 y CA-04 de extremo a extremo con dobles; cada rol ve solo su acción (CA-05); estado de cada etapa con texto · Rastreador de dos etapas y acción única: spec §7.1
  - Refs: RF-01, RF-03 · P-06

- [x] **T008** Prueba de integración de entrega y devolución
  - Archivos: `src/features/handover/handover.integration.test.tsx`
  - Agente: `qa-mobile` · Depende de: T007
  - Aceptación: evidencia → QR → escaneo → «en curso»; devolución → «concluida»; QR de otra reserva rechazado; cobertura ≥ 80 % de `features/handover`
  - Refs: CA-01…CA-05, CA-07 · **Punto de control mínimo**

- [x] **T009** [P] Pagos por etapa
  - Archivos: `src/features/handover/components/PaymentsSection.tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T003, T007
  - Aceptación: CA-06; textos «Ya pagué» / «Recibí el pago»; leyenda de que no se procesan pagos; estado por etapa · `PaymentRow` según spec §7.1
  - Refs: RF-07

- [x] **T010** [P] Banners de retraso y reserva afectada
  - Archivos: `src/features/handover/components/LateBanner.tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T007
  - Aceptación: `isLate` con días y ajuste registrado (informativo); `affectedBy` con explicación · `Banner` según spec §7.1
  - Refs: RF-08

- [x] **T011** [P] Línea de tiempo
  - Archivos: `src/features/handover/components/Timeline.tsx`, `Timeline.test.tsx`
  - Agente: `dev-expo` · Depende de: T007
  - Aceptación: eventos ordenados desde `Booking`; sin horas falsas cuando falta un dato · Fila plegable «Ver historial» según spec §7.1
  - Refs: RF-09 · P-08

- [x] **T012** Memoria y revisión
  - Archivos: `memoria.md` (solo anexar)
  - Agente: `revisor-constitucion` · Depende de: T008, T011
  - Aceptación: **CONFORME**; hito H4 (móvil) marcado
  - Refs: DoD

- [x] **T013** Verificación en Expo Go contra staging
  - Archivos: `memoria.md` (solo anexar), `docs/evidencia/009/` (capturas)
  - Agente: `probador-expo` · Depende de: T012 (y todas las anteriores `[x]`) y backend 009-T015 **desplegada**
  - Aceptación: `npm run typecheck && npm run lint && npm test` en verde; con `EXPO_PUBLIC_API_URL` de staging y `EXPO_UNSTABLE_MCP_SERVER=1`, la app abre en Expo Go y se recorren los criterios de aceptación (CA-xx) de esta spec, con capturas tomadas por el MCP `expo`; lo que Expo Go no permita probar (p. ej. push remoto en Android) se anota en `memoria.md` como no verificable. **La spec siguiente no empieza hasta que esta tarea pase.** · **MCP de Expo opcional (decisión 9 nov):** se verifica a mano o con Claude en Expo Go contra el **backend local**; el staging queda para cuando exista
  - Refs: Art. XIV.4

| Total | 13 tareas |
|---|---|
