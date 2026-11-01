# Plan 008 — Chat (móvil)

- **Spec:** `spec.md` · **Dueño:** MO-B · **Contrato:** `backend/api/paths/chat.yaml`

## 1. Estructura
```
src/features/chat/
  api.ts · types.ts · keys.ts · merge.ts (mezcla servidor + optimistas) · clientId.ts
  hooks.ts (useConversations, useUnreadCount, useMessages, useSendMessage, useMarkRead)
  usePolling.ts (consulta periódica con AppState)
  components/{ConversationRow, MessageBubble, DaySeparator, Composer, ChatHeader, OpenChatButton}.tsx
  screens/{ConversationsScreen, ChatScreen}.tsx
src/app/(tabs)/mensajes/index.tsx · src/app/chat/[id].tsx (reemplazan marcadores)
src/i18n/chat.ts (+ reexport)
```

## 2. Contrato consumido
`GET /conversations`, `GET /conversations/unread-count`, `GET|POST /conversations/{id}/messages`, `POST /conversations/{id}/read`. Tipos `Conversation`, `Message` (backend plan 008 §2).

## 3. Decisiones
| # | Decisión | Art. |
|---|---|---|
| P-01 | Lista de mensajes = unión de «servidor» (caché de TanStack Query) y «pendientes» (estado local con `clientId`); `merge.ts` ordena y deduplica por `clientId`/`id` | IV |
| P-02 | `FlatList inverted`; los más antiguos se piden con `before` al llegar al final | X |
| P-03 | `usePolling` usa `AppState` y `useIsFocused`: solo consulta con la app activa y la pantalla enfocada; frecuencias 5 s (chat) y 20 s (lista) | IX |
| P-04 | Consulta periódica con `?after=<último id>` y se anexa a la caché con `setQueryData` | IV |
| P-05 | `clientId` = UUID v4 con utilidad propia (basta para idempotencia, no es secreto); sin dependencia nueva | II.4 |
| P-06 | El texto no enviado se conserva en el *composer* hasta recibir éxito | — |
| P-07 | Registro del *slot* `chat` de 007 con una línea en `src/features/chat/index.ts` | XIII |

## 4. Pruebas
`merge.ts` (orden, duplicados, reintentos), `usePolling` (primer plano, segundo plano, desenfocado, con reloj falso), `useSendMessage` (éxito, fallo, reintento mismo `clientId`), `Composer` (límite, vacío), pantalla de chat (cargar anteriores, `canWrite` falso), contador de no leídos.

## 5. Verificación de constitución
| Art. | Cumple |
|---|---|
| II.4 | Sin dependencias nuevas |
| IV | Un solo cliente; claves por feature |
| IX | Sin consultas en segundo plano |
| X | Estados vacío/carga/error; tokens |
| XIII | *Slot* sin tocar archivos de 007 |
