# Tareas 011 — Notificaciones y moderación (móvil)

- **Dueño:** MO-B · **Estado:** sin ejecutar · `[P]` = paralelizable
- **Línea de corte:** se recorta primero el push (T006–T007). **No se recortan** los reportes y el aviso de moderación (T008–T010): Google Play los exige para apps con contenido de usuarios. El centro de avisos (T001–T005) es P1.

- [ ] **T001** [P] Tipos, claves, textos y ruteo de avisos
  - Archivos: `src/features/notifications/{types.ts, keys.ts, routing.ts, routing.test.ts}`, `src/i18n/notifications.ts`, `src/i18n/index.ts` (una línea)
  - Agente: `dev-expo` · Depende de: 003-T003
  - Aceptación: `routing.ts` devuelve ruta para cada `data` (reserva, chat, incidencia, objeto) y `null` si falta; prueba por cada tipo
  - Refs: RF-05 · P-01

- [ ] **T002** API y hooks de avisos
  - Archivos: `src/features/notifications/{api.ts, hooks.ts, api.test.ts}`
  - Agente: `dev-expo` · Depende de: T001, 002-T011, 011-T001 (backend, contrato)
  - Aceptación: lista paginada; `unread-count` con `refetchInterval` 60 s solo en primer plano; marcar leídas (ids o todas) actualiza caché
  - Refs: RF-01, RF-02 · P-05

- [ ] **T003** Componentes de avisos
  - Archivos: `src/features/notifications/components/{NotificationRow,UnreadBadge}.tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T001, 002-T015
  - Aceptación: no leídos destacados con texto además de color; hora relativa; accesibles · `NotificationRow` e `IconBadge` por tipo según spec §7.1
  - Refs: RF-01, RF-02

- [ ] **T004** Pantalla del centro de notificaciones
  - Archivos: `src/features/notifications/screens/NotificationsScreen.tsx`, `src/app/notificaciones.tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T002, T003, 003-T008
  - Aceptación: CA-01; tocar abre destino y marca leída; «Marcar todas»; vacío y error · Diseño: spec §7.1 (agrupado por día, interruptor y «Marcar todas»)
  - Refs: RF-01, RF-05, RF-08

- [ ] **T005** Fila «Notificaciones» en el Perfil
  - Archivos: `src/features/notifications/index.ts` (registra `renderExtraRows`), prueba
  - Agente: `dev-expo` · Depende de: T004, 003-T009
  - Aceptación: fila con insignia de no leídos
  - Refs: RF-02 · P-06

- [ ] **T006** Permisos y registro del token de push
  - Archivos: `src/features/notifications/{push.ts, usePushRegistration.ts, push.test.ts}`, `src/features/notifications/components/{PushPrimer,PushToggle}.tsx`
  - Agente: `dev-expo` · Depende de: T002, 002-T024
  - Aceptación: pantalla previa; permiso; token de Expo con `projectId`; registro/baja en servidor (CA-06); canal Android; emulador omitido (P-08); CA-03 · Pantalla previa según spec §7.2
  - Refs: RF-03, RF-04, RF-09

- [ ] **T007** Toques de notificación y arranque en frío
  - Archivos: `src/features/notifications/{useNotificationResponse.ts, NotificationsBootstrap.tsx}`, pruebas, `src/app/_layout.tsx` (**una línea**, acordada con MO-A)
  - Agente: `dev-expo` · Depende de: T001, T006
  - Aceptación: CA-02 con dobles; si el destino es nulo abre el centro de avisos; no interrumpe el escaneo QR (banner en primer plano)
  - Refs: RF-04, RF-05 · P-04

- [ ] **T008** [P] Reportes: API, esquema y hoja
  - Archivos: `src/features/reports/{api.ts, types.ts, keys.ts, schemas.ts, hooks.ts}`, `src/features/reports/components/{ReportSheet,ReportButton}.tsx`, `src/i18n/reports.ts`, `src/i18n/index.ts` (una línea), pruebas
  - Agente: `dev-expo` · Depende de: 003-T003, 011-T001 (backend, contrato)
  - Aceptación: motivo y detalles ≤ 500; CA-05 (duplicado → «Ya lo reportaste»); confirmación de envío · `ReportSheet` según spec §7.4
  - Refs: RF-06

- [ ] **T009** [P] Conectar «Reportar» a objeto, mensaje y perfil
  - Archivos: `src/features/reports/index.ts` (registra los *slots*), prueba
  - Agente: `dev-expo` · Depende de: T008, 005-T008, 008-T007, 003-T010
  - Aceptación: «Reportar» en detalle del objeto (`renderOwnerExtras`), pulsación larga en mensajes ajenos y perfil público; cada conexión es una línea en el archivo del dueño, acordada con él
  - Refs: RF-06 · P-06

- [ ] **T010** [P] Aviso de moderación reutilizable
  - Archivos: `src/features/reports/components/ModerationNotice.tsx`, `ModerationNotice.test.tsx`, `src/lib/api/moderation.ts` (reconoce `content_not_allowed`)
  - Agente: `dev-expo` · Depende de: T008
  - Aceptación: CA-04; muestra categoría y motivo; «Reportar esta decisión» (`moderation_decision`); exportado para 005 (formulario de objetos) y 008 (compositor) que lo adoptan con una línea · `ModerationNotice` según spec §7.5
  - Refs: RF-07

- [ ] **T011** Prueba de integración
  - Archivos: `src/features/notifications/notifications.integration.test.tsx`
  - Agente: `qa-mobile` · Depende de: T005, T007, T009
  - Aceptación: aviso → destino; registro y baja de token; reportar un objeto; cobertura ≥ 80 % de ambas features
  - Refs: CA-01…CA-06

- [ ] **T012** Memoria y revisión
  - Archivos: `memoria.md` (solo anexar)
  - Agente: `revisor-constitucion` · Depende de: T011
  - Aceptación: **CONFORME**; hito H5 (móvil) marcado
  - Refs: DoD

- [ ] **T013** Verificación en Expo Go contra staging
  - Archivos: `memoria.md` (solo anexar), `docs/evidencia/011/` (capturas)
  - Agente: `probador-expo` · Depende de: T012 (y todas las anteriores `[x]`) y backend 011-T014 **desplegada**
  - Aceptación: `npm run typecheck && npm run lint && npm test` en verde; con `EXPO_PUBLIC_API_URL` de staging y `EXPO_UNSTABLE_MCP_SERVER=1`, la app abre en Expo Go y se recorren los criterios de aceptación (CA-xx) de esta spec, con capturas tomadas por el MCP `expo`; lo que Expo Go no permita probar (p. ej. push remoto en Android) se anota en `memoria.md` como no verificable. **La spec siguiente no empieza hasta que esta tarea pase.** · **MCP de Expo opcional (decisión 9 nov):** se verifica a mano o con Claude en Expo Go contra el **backend local**; el staging queda para cuando exista
  - Refs: Art. XIV.4

| Total | 13 tareas |
|---|---|
