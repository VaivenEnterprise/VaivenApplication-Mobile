# Validación de la app móvil (spec 012)

Qué se comprobó, cómo y con qué resultado. Cada fila dice si **se ejecutó** (con el comando) o si **queda pendiente de una persona** (teléfono, Expo Go, staging). Nada se marca como comprobado sin haberse ejecutado.

## 1. Pruebas automatizadas

| Qué | Comando | Estado |
|---|---|---|
| Tipos | `npm run typecheck` | Ejecutado: sin errores |
| Lint + formato de lo cambiado en 012 | `npx eslint src/__e2e__ src/features/connectivity src/i18n src/app/_layout.tsx` y `npx prettier --check` | Ejecutado: limpio |
| Conectividad (T001) | `npx jest src/features/connectivity` | Ejecutado: 12 pruebas pasan |
| Recorrido de punta a punta (T002) | `npx jest src/__e2e__` | Ejecutado: 2 pruebas pasan (≈ 2 min en equipos lentos) |
| Suite completa y cobertura (≥ 70 %) | `npm test` | **Pendiente en la máquina de quien integra**: la suite completa no cabe en el entorno donde se escribió esta fase |

### Recorrido de punta a punta (CA-01, parte automatizada)

`src/__e2e__/journey.integration.test.tsx` recorre, con dos «teléfonos» (cada uno con su caché) contra un servidor falso con estado (`src/__e2e__/fakeApi.ts`): solicitud → aceptación → entrega con QR → devolución con QR → calificación.

- El servidor falso valida cada cuerpo que envía la app con un esquema **estricto** del contrato (campos de más, de menos o de otro tipo → 400 y queda anotado en `violations`). La prueba exige `violations` vacío; una segunda prueba comprueba que un cuerpo con un campo extra sí se rechaza.
- Los escáneres de cámara, el selector de fotos y el selector de fechas están sustituidos por dobles; esas piezas tienen sus propias pruebas (specs 004, 008 y 009).
- No sustituye el recorrido real con dos teléfonos (§5).

## 2. Lista de estados por pantalla (CA-03)

Revisión **por búsqueda de patrones** en el código de cada pantalla (carga, vacío, error/reintento: `isPending`, `EmptyState`, `isError/refetch`…); no es una lectura completa ni se ejecutó en un teléfono. «✓» = el código de la pantalla tiene el patrón. La cobertura de cada estado por pruebas se confirma con `npm test` (pendiente).

| Pantalla | Carga | Vacío | Error + reintentar | Sin conexión |
|---|---|---|---|---|
| Actividad (reservas) | ✓ | ✓ | ✓ | ✓ banner global |
| Detalle de reserva | ✓ | n/a | ✓ | ✓ |
| Solicitar | ✓ | n/a | ✓ | ✓ |
| Chat / conversaciones | ✓ | ✓ | ✓ | ✓ |
| Entrega: evidencia / QR / escaneo | ✓ | n/a | ✓ | ✓ |
| Inicio | ✓ | ✓ | ✓ | ✓ |
| Incidencias (lista, detalle, reportar) | ✓ | ✓ | ✓ | ✓ |
| Mis objetos / detalle / edición / alta | ✓ | ✓ | ✓ | ✓ |
| Notificaciones | ✓ | ✓ | ✓ | ✓ |
| Perfil público | ✓ | ✓ | ✓ | ✓ |
| Explorar y resultados | ✓ | ✓ (`ResultsList`) | ✓ | ✓ |
| Perfil propio | usa la sesión (sin consulta propia) | n/a | n/a | n/a |
| Inicio de sesión, registro, edición de perfil | formularios: sin lista remota | n/a | error del envío en el propio formulario | ✓ |

Hallazgos: ninguna pantalla con datos remotos carece de los patrones de carga, vacío o error con reintento. **Pendiente:** confirmar visualmente cada fila en un teléfono (T003 y T007), por eso T003 no se marca completa.

## 3. Sin conexión (RF-02)

`OfflineBanner` (en `src/app/_layout.tsx`, bajo los proveedores) aparece al fallar la red de cualquier consulta o mutación, sondea `GET /healthz` con espera creciente (2, 4, 8, 16 y 30 s) y sondea de inmediato al volver la app a primer plano. Al volver el servidor muestra «De vuelta en línea» 2 s y recarga las consultas activas. Cubierto por pruebas de `useOnline` y `OfflineBanner`; **pendiente de comprobar en un teléfono** (modo avión).

## 4. Rendimiento (RF-08, T009)

- **Paginación**: las cinco listas largas (Actividad, Chat, Conversaciones, Mis objetos, Resultados de búsqueda) usan `FlatList` con `keyExtractor` y `onEndReached`; Notificaciones pagina con un botón «Cargar más» (`limit` fijo). Revisión por lectura: **ejecutada**.
- **Arranque en teléfono de gama media (< 3 s)**: **no medido** (requiere un teléfono). Procedimiento: cerrar la app por completo, abrir una compilación de desarrollo o Expo Go sin caché y medir desde el toque hasta la primera pantalla utilizable, tres veces; anotar la mediana y el modelo aquí.

| Teléfono | Mediana (s) | Fecha | Quién |
|---|---|---|---|
| _pendiente_ | _pendiente_ | | |

## 5. Recorrido manual con 2 teléfonos (CA-01, T007) — repetido tras D-206, sin fallos

**Hallazgo (2026-11-17):** en ambos teléfonos la reserva no se actualizaba en tiempo real al avanzar el flujo. Causa: el detalle y la lista de reservas solo cambiaban tras una acción propia y el backend no usa *websockets*. Corrección en el frontend (D-206): sondeo cada 10 s con la pantalla enfocada. **Repetido el 2026-11-17 con 2 teléfonos: los 10 pasos pasaron** (cierre por palabra de la persona, sin capturas).

Cuentas del `seed` en `docs/demo.md`. Anotar cada fallo con pasos, causa y corrección o decisión de dejarlo; ninguno bloqueante pendiente el 22 nov.

Teléfono A = Ana (dueña, `ana.demo@vaiven.example`); teléfono B = Carla (`carla.demo@vaiven.example`). Las contraseñas están en `SEED_CREDENTIALS_FILE`, fuera del repositorio. Resultado: `pasó`, `falló` o `no verificable`.

| # | Paso | Teléfono A | Teléfono B | Qué observar | Resultado | Fallo (pasos / causa / corrección) |
|---|---|---|---|---|---|---|
| 1 | Registro e inicio de sesión | Iniciar sesión (o registrar cuenta nueva) | Iniciar sesión (o registrar cuenta nueva) | Sesión abierta; al cerrar y reabrir la app sigue abierta | pasó (palabra de la persona, 2026-11-17) | — |
| 2 | Publicar objeto con fotos | Publicar un objeto con 2 fotos | — | Las fotos suben y se ven en el detalle | pasó (palabra de la persona, 2026-11-17) | — |
| 3 | Buscar y abrir detalle | — | Buscar «taladro» y abrir el detalle | Resultados, fotos y precio en MXN | pasó (palabra de la persona, 2026-11-17) | — |
| 4 | Solicitar la reserva | — | Elegir «mañana», aceptar el total y enviar | A ve la solicitud en Actividad | pasó (palabra de la persona, 2026-11-17) | — |
| 5 | Aceptar (D-206) | Abrir la solicitud y aceptar | Dejar abierto el detalle de la reserva sin tocar nada | **B ve «Aceptada» sola en ≈ 10 s**, sin salir ni recargar | pasó (palabra de la persona, 2026-11-17) | — |
| 6 | Entrega con QR | Registrar estado y mostrar el QR | Escanear el QR | Ambos en «En curso» (A, sola en ≈ 10 s si no escanea) | pasó (palabra de la persona, 2026-11-17) | — |
| 7 | Chat | Enviar un mensaje | Recibirlo y responder | Mensajes en ambos sentidos sin errores | pasó (palabra de la persona, 2026-11-17) | — |
| 8 | Devolución con QR | Escanear el QR | Registrar estado de devolución y mostrar el QR | Reserva concluida en ambos (B, sola en ≈ 10 s si no escanea) | pasó (palabra de la persona, 2026-11-17) | — |
| 9 | Calificar | Calificar a B (opcional) | Calificar a Ana | Se envía y aparece «Gracias»; no deja calificar dos veces | pasó (palabra de la persona, 2026-11-17) | — |
| 10 | Modo avión: banner y recuperación | — | Activar modo avión unos segundos y desactivarlo | «Sin conexión»; al volver, «De vuelta en línea» y los datos se recargan | pasó (palabra de la persona, 2026-11-17) | — |

Cierre de T007: tabla sin filas `_pendiente_` y sin fallos bloqueantes abiertos (CA-01). **Cumplido.**

## 6. Identidad: ícono y *splash* (T005)

- Se conserva el ícono actual (`assets/icon.png`, 1024×1024) y el ícono adaptable de Android (primer plano, fondo y monocromo), como pide RF-05.
- **Pantalla de inicio:** con tu autorización (2026-11-15) se añadió la dependencia `expo-splash-screen@~58.0.13` (instalada la 58.0.14; la clave `splash` ya no existe en el tipo de SDK 58) y se configuró como plugin en `app.config.ts` con `assets/splash-icon.png`, ancho 200, fondo `#FAF6F0` (el del ícono adaptable). `npx expo config` la resuelve y `tsc`/`eslint`/`prettier` pasan. La instalación también subió de parche tres dependencias transitivas en `package-lock.json`.
- **No verificado:** cómo se ve en un teléfono (Expo Go no muestra el splash propio; hace falta una compilación de desarrollo) ni si `assets/splash-icon.png` es el arte definitivo. Es el ícono provisional, sin elementos de terceros hasta donde se pudo ver por nombre y tamaño; la revisión visual es tuya.
- Pendiente: arte definitivo y la prueba `npm audit` del CI con el lockfile nuevo.

## 7. Revisión final (rol `revisor-constitucion`, T011) — provisional

Revisión estática del repositorio, 2026-11-15, rama `spec/SPEC-12` (la única dependencia nueva es `expo-splash-screen`, autorizada por la persona responsable):

| Artículo | Comprobación | Resultado |
|---|---|---|
| II | `fetch` solo en `lib/api/client.ts`; sin axios; única dependencia nueva `expo-splash-screen`, autorizada | Conforme. Observación previa a 012: `XMLHttpRequest` en `features/images/cloudinary.ts` para subir con progreso (spec 004) |
| III | Sin `any`, sin `@ts-ignore`; un único `eslint-disable` (`usePickImages`) anterior a 012 | Conforme |
| V | Textos nuevos en `src/i18n/connectivity.ts` | Conforme |
| VII | Sin colores literales fuera de `src/theme`; `OfflineBanner` usa tokens | Conforme |
| VIII | Tokens solo en SecureStore; sin PII en logs; permisos mínimos (ver `docs/seguridad.md`) | Conforme |
| XIII | `_layout.tsx` y `es-MX.ts` tocados de forma aditiva; `memoria.md` solo anexado; `constitution.md` intacta | Conforme |

**Veredicto provisional: CONFORME con observaciones.** No es el veredicto final de RNF-01: faltan T003 (confirmación visual), T005 (verificación visual del splash), T006/T007/T012 (manuales) y la corrida completa de `npm test`. T011 queda sin marcar.

## 8. Revisión final de conformidad (T011) — 2026-11-17

Rol `revisor-constitucion` (Claude, no el agente de OpenCode). Revisión por búsqueda en todo `src/` más `npm run check`.

| Art. | Comprobación | Resultado |
|---|---|---|
| II | Sin conexión a MongoDB; único `fetch` en `lib/api/client.ts` | Conforme |
| III | Sin `any` ni `@ts-ignore`; un `eslint-disable-next-line react-hooks/exhaustive-deps` justificado con comentario en `images/usePickImages.ts:64` | Conforme |
| V, VII | Sin colores literales fuera de `theme/`; texto visible cubierto por `conventions.test.ts` | Conforme |
| VI.4 | Sin rutas `../../..` | Conforme |
| VIII | Único `console.error` (`AppErrorBoundary`) escribe solo el nombre del error; sin `AsyncStorage`; `EXPO_PUBLIC_*` solo públicas | Conforme |
| IX | `npm run check`: `tsc` y `eslint` limpios; Jest 126 suites / 1647 pruebas; cobertura global 99,65 % sentencias / 97,68 % ramas / 100 % funciones | Conforme |
| X | Dependencia nueva `expo-splash-screen` autorizada por la persona (D-205) y registrada en `memoria.md` | Conforme con observación 3 |
| XII | `constitution.md` sin cambios | Conforme |

**Veredicto: CONFORME con observaciones.**

Observaciones:
1. *Menor, Art. VI.2:* `bookings` importa `usePolling` de `chat` (D-206), igual que `notifications`. Conviene moverlo a `lib/` en una limpieza posterior.
2. *Menor:* el script `npm run check` que exige T011 no existía; se añadió a `package.json` (`typecheck && lint && test`).
3. *Menor, Art. X:* el plan 012 no menciona `expo-splash-screen`; solo `memoria.md` (D-205).
4. *Informativa:* `npm audit` reporta 80 avisos (70 altos) por `picomatch` (ReDoS) en herramientas de compilación y pruebas transitivas; el arreglo propuesto es un retroceso mayor (`expo@52`), no se aplica. No se evaluó si afecta al paquete que se publica. Decidir con el equipo antes del congelamiento.
5. *Informativa:* gitleaks no está instalado en esta máquina; la búsqueda de secretos fue por patrones (sin coincidencias) y la persona confirmó su revisión (T008).
6. *Informativa:* los puntos manuales descansan en la palabra de la persona, sin capturas.

Pendiente humano para cerrar T011: congelar el código y crear la etiqueta `v1.0.0-mobile`.
