# Plan 003 — Cuenta, autenticación y navegación (móvil)

- **Spec:** `spec.md` · **Dueño:** MO-A · **Contrato:** `backend/api/paths/auth.yaml`

## 1. Estructura (la crea esta spec; las demás solo agregan dentro de su carpeta)
```
src/app/
  _layout.tsx                    # providers + auth gate
  (auth)/{_layout,login,register}.tsx
  (tabs)/
    _layout.tsx                  # 5 pestañas
    explorar/{_layout,index}.tsx           # 006 (MO-B) lo llena
    mis-objetos/{_layout,index}.tsx        # 005 (MO-A)
    actividad/{_layout,index}.tsx          # 007 (MO-A)
    mensajes/{_layout,index}.tsx           # 008 (MO-B)
    perfil/{_layout,index,editar}.tsx      # 003 (MO-A)
  objeto/[id].tsx · reserva/[id].tsx · chat/[id].tsx · usuario/[id].tsx · incidencia/[id].tsx   # rutas vacías fuera de pestañas, cada spec llena la suya
src/features/auth/{api.ts, session.tsx, schemas.ts, keys.ts, useSession.ts, screens/*}
src/features/profile/{api.ts, schemas.ts, keys.ts, screens/*}
src/i18n/{auth.ts, profile.ts, tabs.ts} + reexport (una línea) en src/i18n/index.ts
src/components/{EmptyState.tsx, FormField.tsx, TextField.tsx}
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

## 4. Pruebas
Esquemas (válidos/ inválidos), `session` (restaurar, firmar, salir, refresco concurrente con doble de `fetch`), formularios (RNTL: errores, envío, estados de carga), auth gate (redirecciones), pestañas (5 etiquetas).

## 5. Verificación de constitución
| Art. | Cumple |
|---|---|
| II.4 | Solo `react-hook-form` y `@hookform/resolvers` nuevas (aprobadas) |
| VI | Tokens correctamente almacenados; sin PII en logs |
| X | Rutas con Expo Router; componentes base reutilizados |
| XIII | Navegación creada una vez; i18n y claves por feature |
