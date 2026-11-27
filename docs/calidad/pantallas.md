# Matriz de pantallas, endpoints y pruebas

Generada por `node scripts/screens-report.mjs` el 2026-11-27. Solo lectura del código.

Endpoints = rutas literales de `request(...)` en los archivos que alimentan la pantalla: todo su feature (hooks y `api.ts`) y, de otros features que monta, solo el archivo importado y sus `api`/`hooks`; la sesión (`auth`) no cuenta. Es una cota superior: un hook de feature puede traer endpoints que esa pantalla no llama; no cuenta los accesos directos a servicios de terceros (p. ej. la subida de imágenes a Cloudinary). Pruebas = archivos de prueba cuyo cierre de importaciones incluye la pantalla; el tipo sale del nombre del archivo (spec 016, P-02).

## Pantallas

| Pantalla | Ruta(s) | Endpoints | Unitaria | Integración | Seguridad |
|---|---|---|---|---|---|
| `LoginScreen.tsx` | `(auth)/login.tsx` | `DELETE /me`<br>`GET /me`<br>`GET /users/{}`<br>`PATCH /me`<br>`POST /auth/login`<br>`POST /auth/logout`<br>`POST /auth/refresh`<br>`POST /auth/register` | `a11y.test.tsx`, `LoginScreen.test.tsx` | `session.integration.test.tsx`, `profile.integration.test.tsx`, `navigation.integration.test.tsx` | `LoginScreen.security.test.tsx` |
| `RegisterScreen.tsx` | `(auth)/register.tsx` | `DELETE /me`<br>`GET /me`<br>`GET /users/{}`<br>`PATCH /me`<br>`POST /auth/login`<br>`POST /auth/logout`<br>`POST /auth/refresh`<br>`POST /auth/register` | `RegisterScreen.test.tsx` | **sin prueba** | `RegisterScreen.security.test.tsx` |
| `RestoringScreen.tsx` | — | — | `RestoringScreen.test.tsx` | **sin prueba** | **sin prueba** |
| `SuspendedScreen.tsx` | — | — | `SuspendedScreen.test.tsx` | **sin prueba** | **sin prueba** |
| `ActivityScreen.tsx` | `(tabs)/actividad/index.tsx` | `GET /bookings/{}`<br>`GET /items/{}/quote`<br>`GET /me/bookings`<br>`POST /bookings`<br>`POST /bookings/{}/accept`<br>`POST /bookings/{}/cancel`<br>`POST /bookings/{}/meeting-point`<br>`POST /bookings/{}/reject` | `ActivityScreen.test.tsx` | `bookings.integration.test.tsx`, `navigation.integration.test.tsx` | **sin prueba** |
| `BookingDetailScreen.tsx` | `reserva/[id].tsx` | `GET /bookings/{}`<br>`GET /items/{}/quote`<br>`GET /me/bookings`<br>`POST /bookings`<br>`POST /bookings/{}/accept`<br>`POST /bookings/{}/cancel`<br>`POST /bookings/{}/meeting-point`<br>`POST /bookings/{}/reject`<br>`GET /bookings/{}/rating-status` *(slot)*<br>`GET /bookings/{}/{}` *(slot)*<br>`GET /conversations` *(slot)*<br>`GET /conversations/unread-count` *(slot)*<br>`GET /conversations/{}/messages` *(slot)*<br>`GET /incidents/{}` *(slot)*<br>`GET /me/incidents` *(slot)*<br>`GET /users/{}/ratings` *(slot)*<br>`POST /bookings/{}/incidents` *(slot)*<br>`POST /bookings/{}/payments/{}/confirm` *(slot)*<br>`POST /bookings/{}/payments/{}/report` *(slot)*<br>`POST /bookings/{}/ratings` *(slot)*<br>`POST /bookings/{}/{}/confirm` *(slot)*<br>`POST /bookings/{}/{}/qr` *(slot)*<br>`POST /conversations/{}/messages` *(slot)*<br>`POST /conversations/{}/read` *(slot)*<br>`PUT /bookings/{}/{}/evidence` *(slot)* | `BookingDetailScreen.test.tsx` | `journey.integration.test.tsx`, `bookings.integration.test.tsx`, `chat.integration.test.tsx`, `handover.integration.test.tsx`, `trust.integration.test.tsx`, `navigation.integration.test.tsx` | **sin prueba** |
| `RequestScreen.tsx` | `solicitar/[itemId].tsx` | `GET /bookings/{}`<br>`GET /items/{}/quote`<br>`GET /me/bookings`<br>`POST /bookings`<br>`POST /bookings/{}/accept`<br>`POST /bookings/{}/cancel`<br>`POST /bookings/{}/meeting-point`<br>`POST /bookings/{}/reject` | `a11y.test.tsx`, `RequestScreen.test.tsx` | `journey.integration.test.tsx`, `bookings.integration.test.tsx` | **sin prueba** |
| `ChatScreen.tsx` | `chat/[id].tsx` | `GET /conversations`<br>`GET /conversations/unread-count`<br>`GET /conversations/{}/messages`<br>`POST /conversations/{}/messages`<br>`POST /conversations/{}/read`<br>`POST /reports` *(slot)* | `a11y.test.tsx`, `ChatScreen.test.tsx` | `chat.integration.test.tsx`, `reports.wiring.test.tsx`, `navigation.integration.test.tsx` | `ChatScreen.security.test.tsx` |
| `ConversationsScreen.tsx` | `(tabs)/mensajes/index.tsx` | `GET /conversations`<br>`GET /conversations/unread-count`<br>`GET /conversations/{}/messages`<br>`POST /conversations/{}/messages`<br>`POST /conversations/{}/read` | `ConversationsScreen.test.tsx` | `chat.integration.test.tsx`, `navigation.integration.test.tsx` | **sin prueba** |
| `EvidenceScreen.tsx` | `entrega/[bookingId]/evidencia.tsx` | `GET /bookings/{}/{}`<br>`POST /bookings/{}/payments/{}/confirm`<br>`POST /bookings/{}/payments/{}/report`<br>`POST /bookings/{}/{}/confirm`<br>`POST /bookings/{}/{}/qr`<br>`PUT /bookings/{}/{}/evidence` | `EvidenceScreen.test.tsx` | `journey.integration.test.tsx`, `handover.integration.test.tsx` | **sin prueba** |
| `QrScreen.tsx` | `entrega/[bookingId]/qr.tsx` | `GET /bookings/{}/{}`<br>`POST /bookings/{}/payments/{}/confirm`<br>`POST /bookings/{}/payments/{}/report`<br>`POST /bookings/{}/{}/confirm`<br>`POST /bookings/{}/{}/qr`<br>`PUT /bookings/{}/{}/evidence` | `QrScreen.test.tsx` | `journey.integration.test.tsx`, `handover.integration.test.tsx` | **sin prueba** |
| `ScanScreen.tsx` | `entrega/[bookingId]/escanear.tsx` | `GET /bookings/{}/{}`<br>`POST /bookings/{}/payments/{}/confirm`<br>`POST /bookings/{}/payments/{}/report`<br>`POST /bookings/{}/{}/confirm`<br>`POST /bookings/{}/{}/qr`<br>`PUT /bookings/{}/{}/evidence` | `ScanScreen.test.tsx` | `journey.integration.test.tsx`, `handover.integration.test.tsx` | **sin prueba** |
| `HomeScreen.tsx` | `(tabs)/inicio/index.tsx` | `DELETE /me`<br>`GET /items`<br>`GET /me`<br>`GET /users/{}`<br>`PATCH /me` | `home.test.tsx` | `session.integration.test.tsx`, `chat.integration.test.tsx`, `navigation.integration.test.tsx` | **sin prueba** |
| `IncidentDetailScreen.tsx` | `incidencia/[id].tsx` | `GET /incidents/{}`<br>`GET /me/incidents`<br>`POST /bookings/{}/incidents` | `screens.test.tsx` | `trust.integration.test.tsx` | `screens.security.test.tsx` |
| `MyIncidentsScreen.tsx` | `incidencias.tsx` | `GET /incidents/{}`<br>`GET /me/incidents`<br>`POST /bookings/{}/incidents` | `screens.test.tsx` | `trust.integration.test.tsx` | `screens.security.test.tsx` |
| `ReportIncidentScreen.tsx` | `incidencia/nueva/[bookingId].tsx` | `GET /incidents/{}`<br>`GET /me/incidents`<br>`POST /bookings/{}/incidents` | `screens.test.tsx` | `trust.integration.test.tsx` | `screens.security.test.tsx` |
| `EditItemScreen.tsx` | `(tabs)/mis-objetos/[id]/editar.tsx` | `DELETE /items/{}`<br>`GET /categories`<br>`GET /items/price-suggestion`<br>`GET /items/{}`<br>`GET /me/items`<br>`PATCH /items/{}`<br>`POST /items`<br>`POST /items/{}/pause`<br>`POST /items/{}/resume` | `ItemFormScreen.test.tsx` | `navigation.integration.test.tsx` | **sin prueba** |
| `ItemDetailScreen.tsx` | `objeto/[id].tsx` | `DELETE /items/{}`<br>`GET /categories`<br>`GET /items/price-suggestion`<br>`GET /items/{}`<br>`GET /me/items`<br>`PATCH /items/{}`<br>`POST /items`<br>`POST /items/{}/pause`<br>`POST /items/{}/resume`<br>`DELETE /recommendations/history` *(slot)*<br>`GET /bookings/{}` *(slot)*<br>`GET /items/{}/quote` *(slot)*<br>`GET /me/bookings` *(slot)*<br>`GET /meta` *(slot)*<br>`GET /recommendations` *(slot)*<br>`POST /bookings` *(slot)*<br>`POST /bookings/{}/accept` *(slot)*<br>`POST /bookings/{}/cancel` *(slot)*<br>`POST /bookings/{}/meeting-point` *(slot)*<br>`POST /bookings/{}/reject` *(slot)*<br>`POST /recommendations/events` *(slot)*<br>`POST /reports` *(slot)* | `a11y.test.tsx`, `ItemDetailScreen.test.tsx` | `bookings.integration.test.tsx`, `items.integration.test.tsx`, `notifications.integration.test.tsx`, `flow.test.tsx`, `reports.wiring.test.tsx`, `search.integration.test.tsx`, `navigation.integration.test.tsx` | **sin prueba** |
| `ItemFormScreen.tsx` | `(tabs)/mis-objetos/nuevo.tsx` | `DELETE /items/{}`<br>`GET /categories`<br>`GET /items/price-suggestion`<br>`GET /items/{}`<br>`GET /me/items`<br>`PATCH /items/{}`<br>`POST /items`<br>`POST /items/{}/pause`<br>`POST /items/{}/resume`<br>`GET /meta` *(slot)*<br>`POST /ai/listing-suggestions` *(slot)* | `ItemFormScreen.test.tsx` | `flow.test.tsx`, `items.integration.test.tsx`, `navigation.integration.test.tsx` | **sin prueba** |
| `MyItemsScreen.tsx` | `(tabs)/mis-objetos/index.tsx` | `DELETE /items/{}`<br>`GET /categories`<br>`GET /items/price-suggestion`<br>`GET /items/{}`<br>`GET /me/items`<br>`PATCH /items/{}`<br>`POST /items`<br>`POST /items/{}/pause`<br>`POST /items/{}/resume` | `MyItemsScreen.test.tsx` | `items.integration.test.tsx`, `navigation.integration.test.tsx` | **sin prueba** |
| `NotificationsScreen.tsx` | `notificaciones.tsx` | `DELETE /me/push-tokens`<br>`GET /me/notifications`<br>`GET /me/notifications/unread-count`<br>`POST /me/notifications/read`<br>`POST /me/push-tokens` | `NotificationsScreen.test.tsx` | `notifications.integration.test.tsx` | **sin prueba** |
| `EditProfileScreen.tsx` | `(tabs)/perfil/editar.tsx` | `DELETE /me`<br>`GET /me`<br>`GET /users/{}`<br>`PATCH /me` | `EditProfileScreen.test.tsx` | `profile.integration.test.tsx` | `EditProfileScreen.security.test.tsx` |
| `ProfileScreen.tsx` | `(tabs)/perfil/index.tsx` | `DELETE /me`<br>`GET /me`<br>`GET /users/{}`<br>`PATCH /me`<br>`DELETE /me/push-tokens` *(slot)*<br>`DELETE /recommendations/history` *(slot)*<br>`GET /bookings/{}/rating-status` *(slot)*<br>`GET /incidents/{}` *(slot)*<br>`GET /me/incidents` *(slot)*<br>`GET /me/notifications` *(slot)*<br>`GET /me/notifications/unread-count` *(slot)*<br>`GET /meta` *(slot)*<br>`GET /recommendations` *(slot)*<br>`GET /users/{}/ratings` *(slot)*<br>`POST /bookings/{}/incidents` *(slot)*<br>`POST /bookings/{}/ratings` *(slot)*<br>`POST /me/notifications/read` *(slot)*<br>`POST /me/push-tokens` *(slot)*<br>`POST /recommendations/events` *(slot)* | `a11y.test.tsx`, `ProfileScreen.test.tsx` | `profile.integration.test.tsx`, `trust.integration.test.tsx`, `flow.test.tsx`, `navigation.integration.test.tsx` | **sin prueba** |
| `PublicProfileScreen.tsx` | `usuario/[id].tsx` | `DELETE /me`<br>`GET /me`<br>`GET /users/{}`<br>`PATCH /me`<br>`GET /bookings/{}/rating-status` *(slot)*<br>`GET /users/{}/ratings` *(slot)*<br>`POST /bookings/{}/ratings` *(slot)*<br>`POST /reports` *(slot)* | `PublicProfileScreen.test.tsx` | `trust.integration.test.tsx`, `reports.wiring.test.tsx` | **sin prueba** |
| `ProjectScreen.tsx` | `proyecto/[id].tsx` | `GET /items` | `ProjectScreen.test.tsx` | `search.integration.test.tsx`, `navigation.integration.test.tsx` | **sin prueba** |
| `ExploreScreen.tsx` | `(tabs)/explorar/index.tsx` | `GET /items`<br>`DELETE /recommendations/history` *(slot)*<br>`GET /meta` *(slot)*<br>`GET /recommendations` *(slot)*<br>`POST /recommendations/events` *(slot)* | `a11y.test.tsx`, `ExploreScreen.test.tsx` | `flow.test.tsx`, `search.integration.test.tsx`, `navigation.integration.test.tsx` | **sin prueba** |

## Rutas

| Ruta | Pantalla |
|---|---|
| `(auth)/login.tsx` | `LoginScreen.tsx` |
| `(auth)/register.tsx` | `RegisterScreen.tsx` |
| `(dev)/diagnostico.tsx` | — (sin pantalla propia) |
| `(tabs)/actividad/index.tsx` | `ActivityScreen.tsx` |
| `(tabs)/explorar/index.tsx` | `ExploreScreen.tsx` |
| `(tabs)/inicio/index.tsx` | `HomeScreen.tsx` |
| `(tabs)/mensajes/index.tsx` | `ConversationsScreen.tsx` |
| `(tabs)/mis-objetos/[id]/editar.tsx` | `EditItemScreen.tsx` |
| `(tabs)/mis-objetos/index.tsx` | `MyItemsScreen.tsx` |
| `(tabs)/mis-objetos/nuevo.tsx` | `ItemFormScreen.tsx` |
| `(tabs)/perfil/editar.tsx` | `EditProfileScreen.tsx` |
| `(tabs)/perfil/index.tsx` | `ProfileScreen.tsx` |
| `+not-found.tsx` | — (sin pantalla propia) |
| `chat/[id].tsx` | `ChatScreen.tsx` |
| `entrega/[bookingId]/escanear.tsx` | `ScanScreen.tsx` |
| `entrega/[bookingId]/evidencia.tsx` | `EvidenceScreen.tsx` |
| `entrega/[bookingId]/qr.tsx` | `QrScreen.tsx` |
| `incidencia/[id].tsx` | `IncidentDetailScreen.tsx` |
| `incidencia/nueva/[bookingId].tsx` | `ReportIncidentScreen.tsx` |
| `incidencias.tsx` | `MyIncidentsScreen.tsx` |
| `index.tsx` | — (sin pantalla propia) |
| `notificaciones.tsx` | `NotificationsScreen.tsx` |
| `objeto/[id].tsx` | `ItemDetailScreen.tsx` |
| `proyecto/[id].tsx` | `ProjectScreen.tsx` |
| `reserva/[id].tsx` | `BookingDetailScreen.tsx` |
| `solicitar/[itemId].tsx` | `RequestScreen.tsx` |
| `usuario/[id].tsx` | `PublicProfileScreen.tsx` |

## Huecos (pantallas con endpoints)

- **unitarias:** ninguna sin prueba
- **integración:** 1 sin prueba — RegisterScreen
- **seguridad:** 17 sin prueba — ActivityScreen, BookingDetailScreen, RequestScreen, ConversationsScreen, EvidenceScreen, QrScreen, ScanScreen, HomeScreen, EditItemScreen, ItemDetailScreen, ItemFormScreen, MyItemsScreen, NotificationsScreen, ProfileScreen, PublicProfileScreen, ProjectScreen, ExploreScreen
- **Sin endpoints y sin prueba unitaria:** ninguna

## Slots y asistente de proyectos (spec 021-T009)

Los endpoints marcados *(slot)* llegan por los puntos de extensión: lo que otras features registran con `slots.register(...)` en el detalle de la reserva y lo que la ruta que monta la pantalla le conecta (`renderActions`, `renderOwnerExtras`, `renderFormExtras`…). Es una cota superior.

Registros de *slots*:

- `chat ← OpenChatButton`
- `deliveryAndPayments ← HandoverSection`
- `ratingsAndIncidents ← RateBookingCard`
- `ratingsAndIncidents ← TrustSection`

Asistente de proyectos (`/ai/assistant/*`):

- `POST /ai/assistant/messages`: **no consumido**; está en el contrato pero la app no lo llama. Decisión pendiente (spec 021, T020 y T032): implementarlo o declararlo fuera de alcance de la 014.
- `DELETE /ai/assistant/conversations/{}`: **no consumido**; está en el contrato pero la app no lo llama. Decisión pendiente (spec 021, T020 y T032): implementarlo o declararlo fuera de alcance de la 014.

## Contraste con el contrato del backend

No ejecutado: no se encontró `../vaiven-backend/api/openapi.yaml`.

## Notas de revisión manual

Revisión manual hecha el 2026-11-25 al leer las pruebas que el script no atribuye por sí solo. Se anexa tal cual al final de `pantallas.md` cada vez que se regenera.

**Pruebas que el script no ve por importación**

- `RegisterScreen` · integración: la cubre `features/auth/session.integration.test.tsx` («registro → pestañas → cerrar sesión → inicio de sesión → pestañas»), que navega por la interfaz y no por una URL.
- Incidencias (`MyIncidentsScreen`, `IncidentDetailScreen`, `ReportIncidentScreen`): las pruebas unitarias son tres bloques `describe` propios dentro de `incidents/screens/screens.test.tsx`; `HomeScreen` en `home/home.test.tsx` y `EditItemScreen` en `items/screens/ItemFormScreen.test.tsx`. Son archivos compartidos con bloques propios por pantalla, no pruebas ausentes.
- `RestoringScreen` y `SuspendedScreen` no consumen endpoints (las alimenta la sesión). Tienen prueba unitaria propia desde esta spec; la restauración y la suspensión reales se prueban en `session.test.tsx`, `session.integration.test.tsx` y `S-04`.

**Columna «Seguridad»**

Las pruebas de seguridad son **transversales** (cliente de API, sesión, configuración, imágenes, push y reglas estáticas) y, desde 021-T009, las cinco pantallas con entradas sensibles (inicio de sesión, registro, editar perfil, chat e incidencias) tienen además suite propia (`*.security.test.tsx`). «Sin prueba» en esa columna significa «sin suite de seguridad propia de la pantalla», justificado así:

| Pantallas | Controles que las cubren por capa |
|---|---|
| `LoginScreen`, `RegisterScreen`, `RestoringScreen`, `SuspendedScreen` | S-02, S-03, S-04, S-06, S-09 |
| `ProfileScreen`, `EditProfileScreen` | S-03, S-05, S-06 |
| `PublicProfileScreen`, `HomeScreen`, `ExploreScreen`, `ProjectScreen`, `MyItemsScreen` | S-02, S-06, S-08 |
| `ItemFormScreen`, `EditItemScreen`, `ItemDetailScreen` | S-02, S-08, S-10, S-11 |
| `ActivityScreen`, `BookingDetailScreen`, `RequestScreen`, `ConversationsScreen`, `ChatScreen` | S-02, S-06, S-10 |
| `EvidenceScreen`, `QrScreen`, `ScanScreen`, pantallas de incidencias | S-02, S-06, S-11 |
| `NotificationsScreen` | S-02, S-13 |

**Asignación de huecos a tareas (verificación del 2026-11-25)**

- **Unitarias → T003:** ninguna pantalla con endpoints se quedó sin unitaria. `RestoringScreen` y `SuspendedScreen` ya tienen prueba propia, aunque no consumen endpoints; `HomeScreen`, las tres de incidencias y `EditItemScreen` se apoyan en archivos compartidos con bloques propios.
- **Integración → T006:** el único hueco detectado por importación es `RegisterScreen`, cubierto por navegación en `session.integration.test.tsx`. Incidencias, inicio y proyecto usan integraciones compartidas (`trust`, `session` y `search`); perfil tiene `profile.integration.test.tsx` propia.
- **Seguridad → T005 y T009:** las pantallas con endpoints sin suite `*.security.test.*` propia quedan cubiertas por capa con S-01…S-13 según la tabla anterior; «sin prueba» no significa «sin control».

**No medido en esta matriz:** la suite de dispositivo (`.maestro/`) y la verificación manual en Expo Go.

**Alcance de la matriz (spec 021-T004, ampliado en 021-T009)**

La matriz incluye los endpoints que llegan por *slots* (marcados *(slot)*): los registrados con `slots.register(...)` en el detalle de la reserva y los que la ruta conecta con props `render…`. Los endpoints `/ai/assistant/*` (asistente de proyectos) figuran en su sección y se marcan «no consumido» mientras ninguna pantalla los use.
