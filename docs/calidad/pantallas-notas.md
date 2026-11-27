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
