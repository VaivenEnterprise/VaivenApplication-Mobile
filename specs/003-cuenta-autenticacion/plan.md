# Plan 003 — Cuenta, autenticación y navegación (móvil)

- **Spec:** `spec.md` · **Dueño:** MO-A · **Contrato:** `backend/api/paths/auth.yaml`

## 1. Estructura (la crea esta spec; las demás solo agregan dentro de su carpeta)
```
src/app/
  _layout.tsx                    # providers + auth gate
  (auth)/{_layout,login,register}.tsx
  (tabs)/
    _layout.tsx                  # barra de 5 pestañas (TabBar propia) + Mensajes oculta (href: null)
    inicio/{_layout,index}.tsx             # 003: pantalla estática con marcadores
    explorar/{_layout,index}.tsx           # 006 (MO-B) lo llena
    mis-objetos/{_layout,index}.tsx        # 005 (MO-A)
    actividad/{_layout,index}.tsx          # 007 (MO-A)
    mensajes/{_layout,index}.tsx           # 008 (MO-B)
    perfil/{_layout,index,editar}.tsx      # 003 (MO-A)
  objeto/[id].tsx · reserva/[id].tsx · chat/[id].tsx · usuario/[id].tsx · incidencia/[id].tsx · proyecto/[id].tsx   # rutas vacías fuera de pestañas, cada spec llena la suya
src/features/auth/{api.ts, session.tsx, schemas.ts, keys.ts, useSession.ts, screens/*}
src/features/profile/{api.ts, schemas.ts, keys.ts, screens/*}
src/features/home/{api.ts, schemas.ts, hooks.ts, screens/HomeScreen.tsx, components/HomeItemTile.tsx}   # funcional; recibe render… por marcador
src/i18n/{auth.ts, profile.ts, tabs.ts, inicio.ts} + reexport (una línea) en src/i18n/index.ts
src/components/{EmptyState,FormField,TextField,PasswordField,Checkbox,SlotPlaceholder}.tsx
src/components/navigation/{TabBar,MessagesButton}.tsx
src/components/illustrations/NeighborhoodIllustration.tsx
```
Rutas fuera de pestañas (`objeto/[id]` etc.) se crean aquí como **archivos marcador** para que ninguna otra spec edite el layout raíz; cada dueño reemplaza el contenido de su archivo.

## 2. Contrato consumido
`POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /me`, `PATCH /me`, `DELETE /me`, `GET /users/{id}`. Respuesta de sesión: `{ user, tokens:{ accessToken, refreshToken, expiresIn } }`.

## 3. Decisiones
| # | Decisión | Art. |
|---|---|---|
| P-01 | `react-hook-form` + `@hookform/resolvers` con esquemas propios; mensajes de validación desde `i18n/auth.ts` | II.4, XIII |
| P-02 | Access token solo en memoria (no persistente); refresh token en `SecureStore` | VI |
| P-03 | *Single-flight*: una promesa de renovación compartida; las peticiones que reciben 401 esperan y reintentan una vez | IV |
| P-04 | Auth gate con `Stack.Protected`/`Redirect` de Expo Router según `status`; pantalla de carga mientras `loading` | X |
| P-05 | Claves de consulta por feature en `keys.ts` (`authKeys.me`); la sesión limpia la caché al salir | XIII |
| P-06 | Textos por feature en `src/i18n/<f>.ts`; `index.ts` solo reexporta (una línea por feature) | XIII.2 |
| P-07 | La pestaña **Perfil** incluye acciones: editar, cerrar sesión, eliminar cuenta | — |
| P-08 | Inicio es la primera pestaña y es **funcional**: consume `GET /me` y `GET /items?limit=6` con TanStack Query mediante un `api.ts` mínimo en `features/home` (contrato `search.yaml` del backend, spec 006 §2). Cuando 006 exista, `useRecentItems` puede apoyarse en `useSearchItems` sin cambiar la pantalla. Los bloques sin API son `SlotPlaceholder` que cada spec sustituye mediante *props* `renderKit`, `renderHistory` y `renderHeaderExtra` | XIII.3, IV |
| P-09 | **Mensajes** se conserva como ruta de pestaña oculta (`options={{ href: null }}`): su ruta `(tabs)/mensajes/index.tsx` y los archivos de la spec 008 no cambian de lugar. El acceso es el `MessagesButton` del encabezado de Inicio, que recibe `badgeCount` (la llena 008 con `useUnreadBadge`) | XIII.3 |
| P-10 | `TabBar` propia pasada a `tabBar={...}` de `Tabs`, para la píldora de pestaña activa del diseño; usa solo *tokens* y `AppIcon` | VII |
| P-11 | Visualmente se sigue el diseño de Stitch (spec §7). Lo que el diseño no trae (estados de error, suspensión, Perfil, marcadores) es decisión propia y está anotado en spec §7.14 | VII |
| P-12 | Pantallas de autenticación en un `Screen` desplazable que evita el teclado; la ilustración del pie se oculta si la altura útil es menor a 700 pt | X |

## 4. Pruebas
Esquemas (válidos/ inválidos), `session` (restaurar, firmar, salir, refresco concurrente con doble de `fetch`), formularios (RNTL: errores, envío, estados de carga, ojo de contraseña), auth gate (redirecciones), pestañas (5 etiquetas, sin «Mensajes», estado seleccionado), Inicio (saludo con primer nombre, marcadores presentes, cero peticiones) y `MessagesButton` (abre Mensajes; insignia).

## 5. Verificación de constitución
| Art. | Cumple |
|---|---|
| II.4 | Solo `react-hook-form` y `@hookform/resolvers` nuevas (aprobadas) |
| VI | Tokens correctamente almacenados; sin PII en logs |
| X | Rutas con Expo Router; componentes base reutilizados |
| XIII | Navegación creada una vez; i18n y claves por feature |


## Notas de implementación (2026-11-10)

- Mensajes está oculta por la barra propia, no con `href: null` (memoria D-136).
- Textos por feature reexportados en `es-MX.ts` (D-137); `FormNotice` y `Screen.refreshControl` añadidos (D-138).
- Enlaces legales: `EXPO_PUBLIC_LEGAL_URL` opcional (D-139). Fecha de suspensión solo si el servidor la manda (D-140).
- Restauración de sesión única y política de borrado del token de refresco (D-141).
- `006-T011` se adelantó por la dependencia de T014 (D-134).
