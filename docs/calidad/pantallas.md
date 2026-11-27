# Matriz de pantallas, endpoints y pruebas

Generada por `node scripts/screens-report.mjs` el 2026-11-25. Solo lectura del código.

Endpoints = rutas literales de `request(...)` en los archivos que alimentan la pantalla: todo su feature (hooks y `api.ts`) y, de otros features que monta, solo el archivo importado y sus `api`/`hooks`; la sesión (`auth`) no cuenta. Es una cota superior: un hook de feature puede traer endpoints que esa pantalla no llama; no cuenta los accesos directos a servicios de terceros (p. ej. la subida de imágenes a Cloudinary). Pruebas = archivos de prueba cuyo cierre de importaciones incluye la pantalla; el tipo sale del nombre del archivo (spec 016, P-02).

## Pantallas

| Pantalla | Ruta(s) | Endpoints | Unitaria | Integración | Seguridad |
|---|---|---|---|---|---|
| `LoginScreen.tsx` | `(auth)/login.tsx` | `DELETE /me`<br>`GET /me`<br>`GET /users/{}`<br>`PATCH /me`<br>`POST /auth/login`<br>`POST /auth/logout`<br>`POST /auth/refresh`<br>`POST /auth/register` | `LoginScreen.test.tsx`, `a11y.test.tsx` | `session.integration.test.tsx`, `profile.integration.test.tsx`, `navigation.integration.test.tsx` | **sin prueba** |
| `RegisterScreen.tsx` | `(auth)/register.tsx` | `DELETE /me`<br>`GET /me`<br>`GET /users/{}`<br>`PATCH /me`<br>`POST /auth/login`<br>`POST /auth/logout`<br>`POST /auth/refresh`<br>`POST /auth/register` | `RegisterScreen.test.tsx` | **sin prueba** | **sin prueba** |
| `RestoringScreen.tsx` | — | — | `RestoringScreen.test.tsx` | **sin prueba** | **sin prueba** |
| `SuspendedScreen.tsx` | — | — | `SuspendedScreen.test.tsx` | **sin prueba** | **sin prueba** |
| `ActivityScreen.tsx` | `(tabs)/actividad/index.tsx` | `GET /bookings/{}`<br>`GET /items/{}/quote`<br>`GET /me/bookings`<br>`POST /bookings`<br>`POST /bookings/{}/accept`<br>`POST /bookings/{}/cancel`<br>`POST /bookings/{}/meeting-point`<br>`POST /bookings/{}/reject` | `ActivityScreen.test.tsx` | `bookings.integration.test.tsx`, `navigation.integration.test.tsx` | **sin prueba** |
| `BookingDetailScreen.tsx` | `reserva/[id].tsx` | `GET /bookings/{}`<br>`GET /items/{}/quote`<br>`GET /me/bookings`<br>`POST /bookings`<br>`POST /bookings/{}/accept`<br>`POST /bookings/{}/cancel`<br>`POST /bookings/{}/meeting-point`<br>`POST /bookings/{}/reject` | `BookingDetailScreen.test.tsx` | `bookings.integration.test.tsx`, `chat.integration.test.tsx`, `handover.integration.test.tsx`, `trust.integration.test.tsx`, `navigation.integration.test.tsx`, `journey.integration.test.tsx` | **sin prueba** |
| `RequestScreen.tsx` | `solicitar/[itemId].tsx` | `GET /bookings/{}`<br>`GET /items/{}/quote`<br>`GET /me/bookings`<br>`POST /bookings`<br>`POST /bookings/{}/accept`<br>`POST /bookings/{}/cancel`<br>`POST /bookings/{}/meeting-point`<br>`POST /bookings/{}/reject` | `RequestScreen.test.tsx`, `a11y.test.tsx` | `bookings.integration.test.tsx`, `journey.integration.test.tsx` | **sin prueba** |
| `ChatScreen.tsx` | `chat/[id].tsx` | `GET /conversations`<br>`GET /conversations/unread-count`<br>`GET /conversations/{}/messages`<br>`POST /conversations/{}/messages`<br>`POST /conversations/{}/read` | `ChatScreen.test.tsx`, `a11y.test.tsx` | `chat.integration.test.tsx`, `reports.wiring.test.tsx`, `navigation.integration.test.tsx` | **sin prueba** |
| `ConversationsScreen.tsx` | `(tabs)/mensajes/index.tsx` | `GET /conversations`<br>`GET /conversations/unread-count`<br>`GET /conversations/{}/messages`<br>`POST /conversations/{}/messages`<br>`POST /conversations/{}/read` | `ConversationsScreen.test.tsx` | `chat.integration.test.tsx`, `navigation.integration.test.tsx` | **sin prueba** |
| `EvidenceScreen.tsx` | `entrega/[bookingId]/evidencia.tsx` | `GET /bookings/{}/{}`<br>`POST /bookings/{}/payments/{}/confirm`<br>`POST /bookings/{}/payments/{}/report`<br>`POST /bookings/{}/{}/confirm`<br>`POST /bookings/{}/{}/qr`<br>`PUT /bookings/{}/{}/evidence` | `EvidenceScreen.test.tsx` | `handover.integration.test.tsx`, `journey.integration.test.tsx` | **sin prueba** |
| `QrScreen.tsx` | `entrega/[bookingId]/qr.tsx` | `GET /bookings/{}/{}`<br>`POST /bookings/{}/payments/{}/confirm`<br>`POST /bookings/{}/payments/{}/report`<br>`POST /bookings/{}/{}/confirm`<br>`POST /bookings/{}/{}/qr`<br>`PUT /bookings/{}/{}/evidence` | `QrScreen.test.tsx` | `handover.integration.test.tsx`, `journey.integration.test.tsx` | **sin prueba** |
| `ScanScreen.tsx` | `entrega/[bookingId]/escanear.tsx` | `GET /bookings/{}/{}`<br>`POST /bookings/{}/payments/{}/confirm`<br>`POST /bookings/{}/payments/{}/report`<br>`POST /bookings/{}/{}/confirm`<br>`POST /bookings/{}/{}/qr`<br>`PUT /bookings/{}/{}/evidence` | `ScanScreen.test.tsx` | `handover.integration.test.tsx`, `journey.integration.test.tsx` | **sin prueba** |
| `HomeScreen.tsx` | `(tabs)/inicio/index.tsx` | `DELETE /me`<br>`GET /items`<br>`GET /me`<br>`GET /users/{}`<br>`PATCH /me` | `home.test.tsx` | `session.integration.test.tsx`, `chat.integration.test.tsx`, `navigation.integration.test.tsx` | **sin prueba** |
| `IncidentDetailScreen.tsx` | `incidencia/[id].tsx` | `GET /incidents/{}`<br>`GET /me/incidents`<br>`POST /bookings/{}/incidents` | `screens.test.tsx` | `trust.integration.test.tsx` | **sin prueba** |
| `MyIncidentsScreen.tsx` | `incidencias.tsx` | `GET /incidents/{}`<br>`GET /me/incidents`<br>`POST /bookings/{}/incidents` | `screens.test.tsx` | `trust.integration.test.tsx` | **sin prueba** |
| `ReportIncidentScreen.tsx` | `incidencia/nueva/[bookingId].tsx` | `GET /incidents/{}`<br>`GET /me/incidents`<br>`POST /bookings/{}/incidents` | `screens.test.tsx` | `trust.integration.test.tsx` | **sin prueba** |
| `EditItemScreen.tsx` | `(tabs)/mis-objetos/[id]/editar.tsx` | `DELETE /items/{}`<br>`GET /categories`<br>`GET /items/price-suggestion`<br>`GET /items/{}`<br>`GET /me/items`<br>`PATCH /items/{}`<br>`POST /items`<br>`POST /items/{}/pause`<br>`POST /items/{}/resume` | `ItemFormScreen.test.tsx` | `navigation.integration.test.tsx` | **sin prueba** |
| `ItemDetailScreen.tsx` | `objeto/[id].tsx` | `DELETE /items/{}`<br>`GET /categories`<br>`GET /items/price-suggestion`<br>`GET /items/{}`<br>`GET /me/items`<br>`PATCH /items/{}`<br>`POST /items`<br>`POST /items/{}/pause`<br>`POST /items/{}/resume` | `ItemDetailScreen.test.tsx`, `a11y.test.tsx` | `bookings.integration.test.tsx`, `items.integration.test.tsx`, `notifications.integration.test.tsx`, `flow.test.tsx`, `reports.wiring.test.tsx`, `search.integration.test.tsx`, `navigation.integration.test.tsx` | **sin prueba** |
| `ItemFormScreen.tsx` | `(tabs)/mis-objetos/nuevo.tsx` | `DELETE /items/{}`<br>`GET /categories`<br>`GET /items/price-suggestion`<br>`GET /items/{}`<br>`GET /me/items`<br>`PATCH /items/{}`<br>`POST /items`<br>`POST /items/{}/pause`<br>`POST /items/{}/resume` | `ItemFormScreen.test.tsx` | `flow.test.tsx`, `items.integration.test.tsx`, `navigation.integration.test.tsx` | **sin prueba** |
| `MyItemsScreen.tsx` | `(tabs)/mis-objetos/index.tsx` | `DELETE /items/{}`<br>`GET /categories`<br>`GET /items/price-suggestion`<br>`GET /items/{}`<br>`GET /me/items`<br>`PATCH /items/{}`<br>`POST /items`<br>`POST /items/{}/pause`<br>`POST /items/{}/resume` | `MyItemsScreen.test.tsx` | `items.integration.test.tsx`, `navigation.integration.test.tsx` | **sin prueba** |
| `NotificationsScreen.tsx` | `notificaciones.tsx` | `DELETE /me/push-tokens`<br>`GET /me/notifications`<br>`GET /me/notifications/unread-count`<br>`POST /me/notifications/read`<br>`POST /me/push-tokens` | `NotificationsScreen.test.tsx` | `notifications.integration.test.tsx` | **sin prueba** |
| `EditProfileScreen.tsx` | `(tabs)/perfil/editar.tsx` | `DELETE /me`<br>`GET /me`<br>`GET /users/{}`<br>`PATCH /me` | `EditProfileScreen.test.tsx` | `profile.integration.test.tsx` | **sin prueba** |
| `ProfileScreen.tsx` | `(tabs)/perfil/index.tsx` | `DELETE /me`<br>`GET /me`<br>`GET /users/{}`<br>`PATCH /me` | `ProfileScreen.test.tsx`, `a11y.test.tsx` | `profile.integration.test.tsx`, `trust.integration.test.tsx`, `flow.test.tsx`, `navigation.integration.test.tsx` | **sin prueba** |
| `PublicProfileScreen.tsx` | `usuario/[id].tsx` | `DELETE /me`<br>`GET /me`<br>`GET /users/{}`<br>`PATCH /me` | `PublicProfileScreen.test.tsx` | `trust.integration.test.tsx`, `reports.wiring.test.tsx` | **sin prueba** |
| `ProjectScreen.tsx` | `proyecto/[id].tsx` | `GET /items` | `ProjectScreen.test.tsx` | `search.integration.test.tsx`, `navigation.integration.test.tsx` | **sin prueba** |
| `ExploreScreen.tsx` | `(tabs)/explorar/index.tsx` | `GET /items` | `ExploreScreen.test.tsx`, `a11y.test.tsx` | `flow.test.tsx`, `search.integration.test.tsx`, `navigation.integration.test.tsx` | **sin prueba** |

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
- **seguridad:** 24 sin prueba — LoginScreen, RegisterScreen, ActivityScreen, BookingDetailScreen, RequestScreen, ChatScreen, ConversationsScreen, EvidenceScreen, QrScreen, ScanScreen, HomeScreen, IncidentDetailScreen, MyIncidentsScreen, ReportIncidentScreen, EditItemScreen, ItemDetailScreen, ItemFormScreen, MyItemsScreen, NotificationsScreen, EditProfileScreen, ProfileScreen, PublicProfileScreen, ProjectScreen, ExploreScreen
- **Sin endpoints y sin prueba unitaria:** ninguna

## Contraste con el contrato del backend

Todos los endpoints de la matriz existen en `api/openapi.yaml`.

## Notas de revisión manual

Revisión manual hecha el 2026-11-25 al leer las pruebas que el script no atribuye por sí solo. Se anexa tal cual al final de `pantallas.md` cada vez que se regenera.

**Pruebas que el script no ve por importación**

- `RegisterScreen` · integración: la cubre `features/auth/session.integration.test.tsx` («registro → pestañas → cerrar sesión → inicio de sesión → pestañas»), que navega por la interfaz y no por una URL.
- Incidencias (`MyIncidentsScreen`, `IncidentDetailScreen`, `ReportIncidentScreen`): las pruebas unitarias son tres bloques `describe` propios dentro de `incidents/screens/screens.test.tsx`; `HomeScreen` en `home/home.test.tsx` y `EditItemScreen` en `items/screens/ItemFormScreen.test.tsx`. Son archivos compartidos con bloques propios por pantalla, no pruebas ausentes.
- `RestoringScreen` y `SuspendedScreen` no consumen endpoints (las alimenta la sesión). Tienen prueba unitaria propia desde esta spec; la restauración y la suspensión reales se prueban en `session.test.tsx`, `session.integration.test.tsx` y `S-04`.

**Columna «Seguridad»**

Las pruebas de seguridad son **transversales** (cliente de API, sesión, configuración, imágenes, push y reglas estáticas), no una por pantalla; por eso ninguna `*.security.test.*` importa una pantalla. «Sin prueba» en esa columna significa «sin suite de seguridad propia de la pantalla», justificado así:

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
- **Seguridad → T005:** las 24 pantallas con endpoints sin suite `*.security.test.*` propia quedan cubiertas por capa con S-01…S-13 según la tabla anterior; «sin prueba» no significa «sin control».

**No medido en esta matriz:** la suite de dispositivo (`.maestro/`) y la verificación manual en Expo Go.

**Alcance de la matriz (spec 021-T004)**

La matriz inventaría los endpoints de las rutas de cada pantalla (`request(...)` literal en su feature). **No** incluye los endpoints que consumen los *slots* (puntos de extensión que otras features montan dentro de una pantalla) ni `/ai/assistant/*` (el asistente de proyectos del contrato no se consume en la app). Por eso «sin hueco» significa «sin hueco entre lo inventariado», no cobertura total del contrato. La spec 021-T009 amplía la matriz con los *slots* y el asistente, y 021-T031 inventaría las 69 operaciones de `openapi.yaml` en `docs/calidad/contrato-endpoints.md`.
