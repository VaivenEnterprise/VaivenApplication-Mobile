# Spec 003 — Cuenta, autenticación y estructura de navegación (móvil)

- **Dueño:** MO-A · **Prioridad:** P0 · **Ventana:** 5–7 nov · **Depende de:** 001, 002 (móvil) y contrato 003 (backend)
- **Constitución:** v1.2.0 (Art. XIII) · **Estado:** Borrador

## 1. Objetivo y por qué
Que una persona pueda crear su cuenta, entrar, salir y administrar su perfil, y que la app quede con la **estructura de navegación definitiva** (cinco pestañas) para que las demás specs agreguen pantallas sin editar archivos de otras personas.

## 2. Historias
| # | Prio. | Historia |
|---|---|---|
| H-01 | P0 | Como persona nueva, quiero registrarme con nombre, correo y contraseña, para usar Vaivén. |
| H-02 | P0 | Como persona registrada, quiero iniciar sesión y mantenerla abierta, para no escribir mis datos cada vez. |
| H-03 | P0 | Como persona usuaria, quiero ver y editar mi perfil, para que otras personas me reconozcan. |
| H-04 | P1 | Como persona usuaria, quiero cerrar sesión y borrar mi cuenta, para controlar mis datos. |
| H-05 | P0 | Como equipo, queremos una estructura de pestañas y rutas ya creada, para trabajar en paralelo sin conflictos. |

## 3. Requisitos
| ID | Requisito |
|---|---|
| RF-01 | Pantallas de **registro** (nombre, correo, contraseña ≥ 8, confirmación, casillas «Soy mayor de edad» y «Acepto los términos»: `isAdult`, `acceptTerms`; los enlaces «Términos» y «Privacidad» abren las páginas públicas de la landing con `Linking.openURL`) e **inicio de sesión**, con validación (react-hook-form + esquemas) y mensajes en español; errores de API (409 correo usado, 401 credenciales, 429) se muestran en el formulario o en un aviso. |
| RF-02 | `SessionProvider`: guarda `accessToken` en memoria y `refreshToken` en `SecureStore`; expone `user`, `status` (`loading`/`signedOut`/`signedIn`), `signIn`, `signUp`, `signOut`. |
| RF-03 | El cliente de API (002-T011) adjunta `Authorization` y, ante **401**, hace **una sola** renovación con `POST /auth/refresh` aunque haya varias peticiones simultáneas (*single-flight*) y reintenta; si falla, cierra sesión. |
| RF-04 | *Auth gate* en el layout raíz: sin sesión solo se ven las rutas `(auth)`; con sesión, las rutas `(tabs)`. Al arrancar se restaura la sesión sin parpadeo (pantalla de carga). |
| RF-05 | Estructura de pestañas **definitiva**: Explorar, Mis objetos, Actividad, Mensajes, Perfil, cada una con su grupo de rutas y una pantalla marcador con `EmptyState` que las specs posteriores reemplazan. |
| RF-06 | Perfil: ver (`GET /me`), editar nombre y teléfono opcional mediante `PATCH /me`; ver reputación (la conecta 010). |
| RF-07 | Cerrar sesión (`POST /auth/logout`) borra tokens y limpia la caché de consultas. |
| RF-08 | Eliminar cuenta con confirmación y contraseña (`DELETE /me {password}`); tras éxito, vuelve a inicio de sesión. |
| RF-09 | Componente `EmptyState` y `FormField` reutilizables en `src/components`. |
| RF-10 | Persona suspendida (`403 account_suspended`): aviso claro con fecha de fin. |
| RNF-01 | Contraseñas nunca en logs ni en caché de consultas. |
| RNF-02 | Cobertura ≥ 80 % en lógica de sesión y formularios. |

## 4. Criterios de aceptación
| ID | Dado / Cuando / Entonces |
|---|---|
| CA-01 | Dado un registro válido, entonces entro directo a las pestañas. |
| CA-02 | Dada la app reiniciada con sesión válida, entonces vuelvo a las pestañas sin pedir datos. |
| CA-03 | Dado un token vencido y 3 peticiones simultáneas, entonces solo ocurre una renovación. |
| CA-04 | Dada una renovación fallida, entonces la app vuelve a inicio de sesión. |
| CA-05 | Dada una contraseña corta, entonces el formulario muestra el error sin llamar a la API. |
| CA-06 | Dadas las 5 pestañas, entonces cada una abre su pantalla marcador. |

## 5. Fuera de alcance
Foto de perfil, inicio con redes sociales, verificación de correo, recuperación de contraseña, biometría, cambio de correo.

## 6. Preguntas abiertas
- [NEEDS CLARIFICATION: ¿Se necesita recuperar contraseña antes del 23 nov? Provisional: no.]
- [NEEDS CLARIFICATION: nombre del campo teléfono (¿se mostrará a la contraparte?). Provisional: privado.]
