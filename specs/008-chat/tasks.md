# Tareas 008 — Chat (móvil)

- **Dueño:** MO-B · **Estado:** T001–T010 completas en código y pruebas (2026-11-12); T010 cerrada (CONFORME con reservas; marcar H3 y avisar a los equipos lo hace la persona); T011 (Expo Go) abierta · `[P]` = paralelizable

- [x] **T001** [P] Tipos, claves, textos e identificador de cliente
  - Archivos: `src/features/chat/{types.ts, keys.ts, clientId.ts, clientId.test.ts}`, `src/i18n/chat.ts`, `src/i18n/index.ts` (una línea)
  - Agente: `dev-expo` · Depende de: 003-T003
  - Aceptación: `Conversation`, `Message`, `PendingMessage { clientId, body, status }`; generador de UUID v4 sin dependencia nueva (con prueba de formato)
  - Refs: P-05

- [x] **T002** [P] Mezcla de mensajes
  - Archivos: `src/features/chat/merge.ts`, `src/features/chat/merge.test.ts`
  - Agente: `dev-expo` · Depende de: T001
  - Aceptación: une servidor y pendientes, ordena por fecha/ID, deduplica por `clientId` al llegar el eco del servidor; pruebas de reintento (CA-01)
  - Refs: RF-03 · P-01

- [x] **T003** API y hooks de conversaciones y mensajes
  - Archivos: `src/features/chat/{api.ts, hooks.ts, api.test.ts}`
  - Agente: `dev-expo` · Depende de: T001, 002-T011, 008-T001 (backend, contrato)
  - Aceptación: 5 rutas; `useMessages` con `useInfiniteQuery` (`before`); `useSendMessage` optimista que conserva `clientId` al reintentar; `useMarkRead` actualiza contadores
  - Refs: RF-02, RF-03, RF-05

- [x] **T004** Consulta periódica consciente del estado de la app
  - Archivos: `src/features/chat/usePolling.ts`, `src/features/chat/usePolling.test.ts`
  - Agente: `dev-expo` · Depende de: T003
  - Aceptación: CA-02 y CA-03; pausa en segundo plano y pantalla desenfocada; reanuda con consulta inmediata; usa `after`
  - Refs: RF-04 · P-03, P-04

- [x] **T005** [P] Componentes del chat
  - Archivos: `src/features/chat/components/{MessageBubble,DaySeparator,Composer,ChatHeader,ConversationRow}.tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T001, 002-T015
  - Aceptación: burbujas propias/ajenas con hora; separadores por día; `Composer` con contador 1,000, bloqueo al enviar y estado «no enviado/reintentar»; accesible · Burbujas, separadores, composer y `QuickReplies` según spec §7.2
  - Refs: RF-02, RF-07

- [x] **T006** Lista de conversaciones e insignia
  - Archivos: `src/features/chat/screens/ConversationsScreen.tsx`, `src/app/(tabs)/mensajes/index.tsx`, `src/features/chat/useUnreadBadge.ts`, pruebas
  - Agente: `dev-expo` · Depende de: T003, T004, T005, 003-T008
  - Aceptación: lista con no leídos; vacío («Tus conversaciones aparecen cuando aceptan una solicitud»); insignia en el `MessagesButton` del encabezado de Inicio mediante su *prop* `badgeCount` (de 003-T014; **una línea** acordada con MO-A) · Diseño: spec §7.1; la insignia va en el `MessagesButton`
  - Refs: RF-01

- [x] **T007** Pantalla de chat
  - Archivos: `src/features/chat/screens/ChatScreen.tsx`, `src/app/chat/[id].tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T002, T003, T004, T005
  - Aceptación: CA-01, CA-04, CA-05, CA-06; lista invertida con carga de anteriores; marca leído al abrir; aviso si `canWrite` es falso · Diseño: spec §7.2
  - Refs: RF-02, RF-05…RF-08

- [x] **T008** Botón «Abrir chat» en el detalle de la reserva
  - Archivos: `src/features/chat/components/OpenChatButton.tsx`, `src/features/chat/index.ts` (registro del *slot* `chat`), prueba
  - Agente: `dev-expo` · Depende de: T007, 007-T010
  - Aceptación: aparece solo si `conversationId` existe; muestra no leídos
  - Refs: RF-09, RF-10 · P-07

- [x] **T009** Prueba de integración de mensajería
  - Archivos: `src/features/chat/chat.integration.test.tsx`
  - Agente: `qa-mobile` · Depende de: T006, T007
  - Aceptación: abrir chat → enviar → eco → mensaje de la otra persona por consulta periódica → no leídos baja; cobertura ≥ 80 % de `features/chat`
  - Refs: CA-01…CA-06

- [x] **T010** Memoria y revisión
  - Archivos: `memoria.md` (solo anexar)
  - Agente: `revisor-constitucion` · Depende de: T009
  - Aceptación: **CONFORME**; hito H3 (móvil) marcado
  - Refs: DoD

- [x] **T011** Verificación en Expo Go contra staging
  - Archivos: `memoria.md` (solo anexar), `docs/evidencia/008/` (capturas)
  - Agente: `probador-expo` · Depende de: T010 (y todas las anteriores `[x]`) y backend 008-T010 **desplegada**
  - Aceptación: `npm run typecheck && npm run lint && npm test` en verde; con `EXPO_PUBLIC_API_URL` de staging y `EXPO_UNSTABLE_MCP_SERVER=1`, la app abre en Expo Go y se recorren los criterios de aceptación (CA-xx) de esta spec, con capturas tomadas por el MCP `expo`; lo que Expo Go no permita probar (p. ej. push remoto en Android) se anota en `memoria.md` como no verificable. **La spec siguiente no empieza hasta que esta tarea pase.** · **MCP de Expo opcional (decisión 9 nov):** se verifica a mano o con Claude en Expo Go contra el **backend local**; el staging queda para cuando exista
  - Refs: Art. XIV.4

| Total | 11 tareas |
|---|---|
