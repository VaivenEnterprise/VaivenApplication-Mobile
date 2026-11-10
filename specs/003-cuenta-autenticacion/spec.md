# Spec 003 — Cuenta, autenticación y estructura de navegación (móvil)

- **Dueño:** MO-A · **Prioridad:** P0 · **Ventana:** 5–7 nov · **Depende de:** 001, 002 (móvil) y contrato 003 (backend)
- **Constitución:** v1.2.0 (Art. XIII) · **Estado:** Borrador · **Diseño:** actualizado el 9 nov 2026 con el diseño de Stitch (§7)

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
| RF-05 | Estructura de pestañas **definitiva**: la barra muestra cinco pestañas (Inicio, Explorar, Mis objetos, Actividad y Perfil) y **Mensajes** existe como ruta de pestaña oculta de la barra (`href: null`), accesible desde el botón de mensajes del encabezado de Inicio. Cada una con su grupo de rutas y una pantalla marcador con `EmptyState` que las specs posteriores reemplazan (Inicio trae su pantalla estática, RF-12). |
| RF-06 | Perfil: ver (`GET /me`), editar nombre y teléfono opcional mediante `PATCH /me`; ver reputación (la conecta 010). |
| RF-07 | Cerrar sesión (`POST /auth/logout`) borra tokens y limpia la caché de consultas. |
| RF-08 | Eliminar cuenta con confirmación y contraseña (`DELETE /me {password}`); tras éxito, vuelve a inicio de sesión. |
| RF-09 | Componente `EmptyState` y `FormField` reutilizables en `src/components`. |
| RF-10 | Persona suspendida (`403 account_suspended`): aviso claro con fecha de fin. |
| RF-11 | Las pantallas de inicio de sesión y registro reproducen el diseño aprobado (§7.1 y §7.2) usando solo *tokens* y componentes compartidos, y no muestran controles sin función (§5). |
| RF-12 | **Inicio** funcional (§7.3): saludo con el primer nombre de la sesión (`GET /me` lo refresca), proyectos populares del catálogo local y objetos recientes de `GET /items?limit=6`; cada sección tiene sus estados de carga, vacío y error, y un fallo de una no bloquea el resto. Los bloques que aún no tienen API (kit sugerido, trabajos realizados) son marcadores (`SlotPlaceholder`) que su spec reemplaza mediante *props* `render…`, sin editar el archivo de Inicio. |
| RF-13 | Barra de pestañas propia (§7.4): pestaña activa con píldora `primarySoft`, etiquetas siempre visibles, rol y estado accesibles. |
| RF-14 | Todo campo de formulario tiene estados de reposo, foco, error y deshabilitado, y los botones de envío tienen estado cargando (§7.5). |
| RF-15 | Perfil, Editar perfil, Eliminar cuenta, Perfil público, restauración de sesión, cuenta suspendida y marcadores de pestaña siguen el diseño de §7.8 a §7.13. |
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
| CA-07 | Dada la pantalla de inicio de sesión, entonces solo hay correo, contraseña con ojo, el botón «Iniciar sesión» y el enlace «Crea una». |
| CA-08 | Dado un registro con contraseñas distintas, entonces el error aparece bajo «Confirmar contraseña», con borde de error y sin llamar a la API. |
| CA-09 | Dada la pestaña Inicio con sesión, entonces veo «Hola, {primer nombre}», los proyectos populares y los objetos recientes traídos de `GET /items`; con la API caída veo el error con «Reintentar» solo en esa sección y el resto sigue usable. |
| CA-12 | Dado jalar la pantalla hacia abajo en Inicio, entonces se vuelven a consultar `GET /me` y los objetos recientes. |
| CA-10 | Dada la barra de pestañas, entonces hay cinco etiquetas y ninguna es «Mensajes»; al pulsar el botón de mensajes de Inicio se abre el marcador de Mensajes. |
| CA-11 | Dado Perfil, entonces veo mi inicial, mi nombre, «Editar perfil», «Cerrar sesión» y «Eliminar cuenta»; esta última abre una hoja que pide la contraseña. |

## 5. Fuera de alcance
Foto de perfil, inicio con redes sociales, verificación de correo, recuperación y cambio de contraseña, biometría, cambio de correo.

**Elementos del diseño de Stitch que NO se muestran** (no tienen función en esta versión; se agregan sin rediseñar si se aprueban):
- «Compartir» (inicio de sesión): no hay qué compartir antes de entrar.
- «¿Olvidaste tu contraseña?»: no hay recuperación ni cambio de contraseña (decisión del 9 nov).
- «Explorar la app» (inicio de sesión): no hay modo invitado; sin sesión solo existen las rutas `(auth)`.
- Campo «Teléfono» del registro: el teléfono es opcional y se edita en Perfil (RF-06); así el registro no cambia el contrato.
- Botón flotante de asistente (✦) de Inicio: pertenece a la spec 014 (IA) y solo aparecerá con `AI_ENABLED`.
- Puntos de paginación bajo el registro: decorativos.

## 6. Preguntas abiertas
- [NEEDS CLARIFICATION: ¿Se necesita recuperar contraseña antes del 23 nov? Provisional: no.]
- [NEEDS CLARIFICATION: nombre del campo teléfono (¿se mostrará a la contraparte?). Provisional: privado.]

## 7. Diseño de pantallas

Referencia visual: `docs/diseno/referencia/`. Valores (colores, medidas, fuentes) **solo** desde los *tokens* de la spec 002 §4.2; textos desde `src/i18n/` (Art. VII y V). Lenguaje general en la spec 002 §9. Cada pantalla se describe como árbol, de arriba abajo.

### 7.1 Inicio de sesión (`(auth)/login`)
- **Fondo:** `GradientBackground` `authBackground`, a pantalla completa.
- **Encabezado:** `BrandMark` `md`.
- **Título (`display`):** «Bienvenido de» y, en la línea siguiente o a continuación, «vuelta» en `primary` con un subrayado ondulado dibujado (SVG, decorativo).
- **Formulario:**
  - Correo: `TextField` con `IconBadge` de sobre; teclado de correo; sin autocapitalizar; `autoComplete` de correo.
  - Contraseña: `PasswordField` con `IconBadge` de candado y ojo para mostrar u ocultar (etiqueta accesible «Mostrar contraseña» / «Ocultar contraseña»).
  - Aviso de error del formulario (401, 429, suspensión con fecha): banner `dangerSoft` con ícono, justo encima del botón.
- **Acción:** `Button` `primary` «Iniciar sesión» con flecha; cargando mientras envía.
- **Pie:** `NeighborhoodIllustration` (casitas, árbol y regadera, decorativa, oculta si la altura útil es menor a 700 pt) y «¿No tienes cuenta? **Crea una**» (enlace a registro, texto en `primaryPressed`).
- **Mejoras respecto de la captura:** etiquetas de campo en minúscula (`label`) en vez de mayúsculas pequeñas, para leerse mejor; se retira el separador con «o» porque ya no hay segunda acción; el botón mantiene el degradado de marca.

### 7.2 Registro (`(auth)/register`)
- **Fondo:** `background` liso, con `Screen` desplazable (el teclado no tapa el campo activo).
- **Barra superior:** botón circular «Volver» (flecha, etiqueta accesible) a la izquierda y `Chip` `success` «Comunidad segura» (escudo; texto `secondaryPressed` sobre `secondarySoft`) a la derecha.
- **Cabecera:** `eyebrow` «VAIVEN · Registro vecinal»; título «Crea tu cuenta» (`title`); subtítulo `body` «Unos datos y listo: ya puedes pedir prestado o prestar lo que necesitas.»
- **Tarjeta informativa:** `Card` `muted` con `IconBadge` (apretón de manos), título «Confianza de barrio» y texto «Préstamos seguros y coordinados entre vecinos». El texto **no se trunca**: puede ocupar dos líneas.
- **Campos (`TextField`, ícono a la izquierda):** Nombre completo · Correo electrónico · Contraseña («Mínimo 8 caracteres», con ojo) · Confirmar contraseña (con ojo).
- **Casillas (`Checkbox`):** «Soy mayor de edad» y «Acepto los **términos de uso** y el **aviso de privacidad** de la comunidad» (los dos enlaces abren las páginas públicas con `Linking.openURL`). El diseño traía una sola casilla; la spec exige dos (`isAdult` y `acceptTerms`).
- **Acción:** `Button` `primary` «Crear cuenta» con flecha. Se muestra habilitado; si faltan casillas o hay errores, al pulsar se marcan los campos y se lleva el foco al primero con error.
- **Pie:** «¿Ya tienes cuenta? **Inicia sesión**» (enlace en `primaryPressed`).
- **Mejoras:** el botón pasa del café de la captura al degradado de marca; contraseña con confirmación; errores en línea, bajo cada campo, con ícono y texto (no solo color).

### 7.3 Inicio (`(tabs)/inicio`), funcional
Jalar hacia abajo recarga todo. Cada sección maneja sus propios estados, así un fallo no tumba la pantalla.
- **Encabezado:** `BrandMark` `sm`; a la derecha `MessagesButton` (burbuja con insignia vacía; la llena 008) y `Avatar` con la inicial, que abre Perfil.
- **Saludo:** «Hola, {primer nombre}» (`title`), tomado de la sesión al instante y refrescado con `GET /me`; debajo «¿Qué quieres hacer hoy?» (`heading`, `primary`). El chip de zona del diseño **no se muestra** hasta que existan ubicación y zona (005/006).
- **«Proyectos populares»** (sin red): `PopularProjects` de 006 (catálogo local, una tarjeta grande y dos pequeñas). Tocar abre `proyecto/[id]` (marcador hasta la spec 007).
- **«Recién publicado»** (`GET /items?limit=6`): fila horizontal de `HomeItemTile` de 160 pt (foto 4:3, título de una línea, precio «$90 /día» o `Chip` «Gratis») y `link` «Ver todo ›» que abre Explorar. Tocar una tarjeta abre `objeto/[id]`.
  - *Cargando:* tres `Skeleton` de tarjeta.
  - *Vacío:* `EmptyState` compacto, «Aún no hay objetos», con botón «Publicar» (abre Mis objetos).
  - *Error:* `ErrorState` compacto con «Reintentar»; no afecta a las demás secciones.
- **«Kit sugerido para tu proyecto»:** `Card` con tres `SlotPlaceholder` cuadrados en `slotGreen` (**slot** `renderKit`, 015).
- **«Mis trabajos realizados»:** fila de `SlotPlaceholder` (**slot** `renderHistory`, 007/010).
- **No se muestran:** el botón de asistente (✦, spec 014), «Ver cómo conseguirlo» y el chip de zona.
- **Espacio inferior** para que la barra de pestañas no tape el último bloque.

### 7.4 Barra de pestañas
`TabBar` propia sobre `surface`, alto 68, sombra `soft` y esquinas superiores `xl`. Cinco elementos con ícono y etiqueta (`tab`): Inicio, Explorar, Mis objetos, Actividad, Perfil. La activa lleva una píldora `primarySoft` con ícono y texto `primaryInk` (6.4:1); las demás, `muted`. Área táctil ≥ 44 pt, `accessibilityRole="tab"` y `accessibilityState={{ selected }}`. La ruta Mensajes no aparece.

### 7.5 Estados de campo y botón
| Estado | Campo | Botón |
|---|---|---|
| Reposo | `surface`, borde `border` 1 pt | `primary` con degradado y sombra `button` |
| Foco | borde `primary` 2 pt y halo `primarySoft` | — |
| Error | borde `danger`, ícono y mensaje `danger` bajo el campo | — |
| Deshabilitado | `surfaceMuted`, texto `placeholder` | opacidad reducida; no responde |
| Cargando | — | indicador en lugar de la flecha; mismo ancho; bloquea reenvío |
| Pulsado | — | escala `pressScale` |

### 7.6 Textos nuevos (en `src/i18n/auth.ts` e `inicio.ts`)
Inicio de sesión: «Bienvenido de», «vuelta», «Correo electrónico», «Contraseña», «Iniciar sesión», «¿No tienes cuenta?», «Crea una». Registro: «Registro vecinal», «Comunidad segura», «Crea tu cuenta», subtítulo, «Confianza de barrio», «Préstamos seguros y coordinados entre vecinos», «Nombre completo», «Confirmar contraseña», «Soy mayor de edad», «Acepto los términos de uso y el aviso de privacidad de la comunidad», «Crear cuenta», «¿Ya tienes cuenta?», «Inicia sesión». Inicio: «Hola, {nombre}», «¿Qué quieres hacer hoy?», «Tu zona», «Proyectos populares», «Kit sugerido para tu proyecto», «Mis trabajos realizados» y la pista de cada marcador.

### 7.8 Perfil (`(tabs)/perfil`)
- **Cabecera:** `Avatar` 72 con la inicial, nombre (`title`) y «En Vaivén desde {mes año}» (`caption`). Debajo, **slot** `renderReputation` (010): estrellas pequeñas y «4.9 (18)»; sin calificaciones no se muestra nada.
- **Grupo de filas** (`Card` con `ListRow`): «Editar perfil» (lápiz) y, a continuación, los **slots** `renderExtraRows`: «Notificaciones» con insignia (011), «Mis incidencias» (010) y «Borrar historial de recomendaciones» (015).
- **Sesión:** `ListRow` «Cerrar sesión» con ícono de salida.
- **Pie:** «Eliminar cuenta», `link` en `danger`, centrado y en `caption`.
- No hay estadísticas ni textos explicativos.

### 7.9 Editar perfil (`perfil/editar`)
Encabezado con «Volver» y «Editar perfil». `Avatar` 72 centrado (cambiar la foto está fuera de alcance). Campos «Nombre» y «Teléfono» (opcional; solo lo ve la persona, según la pregunta abierta). Botón fijo «Guardar», deshabilitado mientras no haya cambios. Éxito: `Banner` `success` «Guardado» y regreso a Perfil.

### 7.10 Eliminar cuenta (`BottomSheet`)
`IconBadge` de advertencia en tono `danger`, título «¿Eliminar tu cuenta?» y una línea: «No se puede deshacer.» Campo de contraseña (`PasswordField`). Botón `danger` «Eliminar», habilitado solo con contraseña escrita, y `link` «Cancelar». Contraseña incorrecta: error bajo el campo. Operaciones pendientes (409): `Banner` `danger` «Tienes operaciones pendientes».

### 7.11 Perfil público (`usuario/[id]`)
Encabezado con «Volver» y «⋯» (slot de «Reportar», 011). `Avatar` 72, nombre y «En Vaivén desde …». Tarjeta de reputación (slot `renderReputation`, 010): promedio grande (`display`), `RatingStars` y «18 calificaciones»; debajo, la lista de comentarios. Sin calificaciones: `EmptyState` pequeño «Aún sin calificaciones». Carga: `Skeleton` de círculo y dos líneas.

### 7.12 Sesión: restaurando y suspendida
- **Restaurando:** `GradientBackground` `authBackground` con `BrandMark` `md` centrado y un indicador discreto debajo; sin texto.
- **Suspendida (`account_suspended`):** misma base, `IconBadge` grande con candado en `dangerSoft`, título «Cuenta suspendida», «Hasta el {fecha}» y botón `outline` «Entendido» que lleva a inicio de sesión.

### 7.13 Marcadores de pestaña
Cada pantalla marcador usa `EmptyState`: ícono de su pestaña, nombre de la pestaña y una línea «Próximamente».

### 7.14 Lo que el diseño no muestra
El diseño solo trae la pantalla en su estado normal. Los estados de error, foco, carga y suspensión de §7.1, §7.2 y §7.5, la pantalla de Perfil y las pantallas marcador de las demás pestañas se definen aquí con el mismo lenguaje visual y se anotan como decisión propia (no vienen de Stitch).
