# Plan 011 — Notificaciones y moderación (móvil)

- **Spec:** `spec.md` · **Dueño:** MO-B · **Contrato:** `backend/api/paths/notifications.yaml`, `reports.yaml`

## 1. Estructura
```
src/features/notifications/
  api.ts · types.ts · keys.ts · hooks.ts
  routing.ts (data → ruta) · push.ts (permiso, token, canal) · usePushRegistration.ts · useNotificationResponse.ts
  components/{NotificationRow, UnreadBadge, PushPrimer, PushToggle}.tsx
  screens/NotificationsScreen.tsx
src/features/reports/
  api.ts · types.ts · keys.ts · schemas.ts · hooks.ts
  components/{ReportSheet, ReportButton, ModerationNotice}.tsx
src/app/notificaciones.tsx
src/i18n/{notifications,reports}.ts (+ reexport)
```
La registración de push y la respuesta a toques se montan en un componente `NotificationsBootstrap` que se agrega al proveedor raíz con **una línea** (acordada con MO-A, `src/app/_layout.tsx`).

## 2. Contrato consumido
`GET /me/notifications`, `GET /me/notifications/unread-count`, `POST /me/notifications/read`, `POST|DELETE /me/push-tokens`, `POST /reports`. Tipo `Notification` con `data { bookingId?, itemId?, conversationId?, incidentId? }`.

## 3. Decisiones
| # | Decisión | Art. |
|---|---|---|
| P-01 | `routing.ts` es una función pura `(data) → Href | null`, con prueba por cada tipo | III |
| P-02 | Token de Expo con `getExpoPushTokenAsync({ projectId })` (el `projectId` viene de la configuración de EAS, no es secreto) | VI |
| P-03 | Pantalla previa (`PushPrimer`) antes del diálogo del sistema; si se rechaza, se recuerda en `SecureStore` para no insistir | — |
| P-04 | Toques de notificación: `addNotificationResponseReceivedListener` y `getLastNotificationResponseAsync` para el arranque en frío | — |
| P-05 | Insignia de no leídos con `refetchInterval` 60 s solo en primer plano (hook de 008 reutilizado desde `usePolling`) | IX |
| P-06 | `ReportButton` y `ModerationNotice` se registran en los *slots* de 005 (`renderOwnerExtras`), 008 (acciones de mensaje) y 003 (perfil público) con una línea cada uno | XIII |
| P-07 | Android: canal por defecto «Vaivén» con importancia alta | — |
| P-08 | En emulador (`Device.isDevice` falso) se omite el registro sin error | — |

## 4. Pruebas
`routing.ts` (todos los tipos, datos faltantes), permisos (concedido, negado, emulador) con dobles de `expo-notifications`, `NotificationsScreen` (paginación, marcar leída), `ReportSheet` (validaciones, duplicado), `ModerationNotice`.

## 5. Verificación de constitución
| Art. | Cumple |
|---|---|
| II.4 | `expo-notifications`, `expo-device`, `expo-linking` aprobadas |
| III | Ruteo como función pura |
| VI | Sin secretos; datos mínimos |
| IX | Sin consultas en segundo plano |
| XIII | Una línea por punto de conexión, acordada con la dueña del archivo |
