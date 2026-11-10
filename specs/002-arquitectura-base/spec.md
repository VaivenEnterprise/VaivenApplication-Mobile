# Spec 002 — Arquitectura base de la app móvil

- **Estado:** Borrador, pendiente de aprobación humana
- **Proyecto:** `vaiven-frontend/` (React Native + Expo + TypeScript)
- **Constitución aplicable:** v1.0.0
- **Fecha:** 2026-10-26

> Esta spec describe **qué** debe existir y **por qué**. La tecnología y la estructura de archivos están en `plan.md`.
> **No incluye funcionalidad de negocio** de VAIVÉN (registro, objetos, búsqueda, solicitudes, chat, QR, etc.). Eso se especifica en `002-*` y posteriores.

## 1. Resumen y objetivo

Dejar listo un esqueleto de app móvil ejecutable, probado y documentado, con navegación, sistema de diseño base, cliente de API y manejo de errores, sobre el cual se construirán las pantallas de VAIVÉN. Además, comprobar de punta a punta que la app se comunica con el backend.

**Por qué:** una base común evita decisiones repetidas, garantiza que toda pantalla futura use los mismos componentes, textos y valores de diseño, y alinea el manejo de errores con el contrato del backend, de modo que modelos gratuitos con poco contexto trabajen sobre una estructura predecible.

## 2. Historias técnicas

| # | Prioridad | Historia |
|---|---|---|
| H-01 | P1 | Como **persona desarrolladora**, quiero iniciar la app en un emulador o dispositivo con pocos comandos, para empezar a trabajar sin configuración manual. |
| H-02 | P1 | Como **persona desarrolladora**, quiero un lugar único y validado para la configuración (URL de la API, entorno), para no tener valores escondidos en el código. |
| H-03 | P1 | Como **persona desarrolladora**, quiero un cliente de API que normalice todos los errores, para manejarlos en un solo punto. |
| H-04 | P1 | Como **persona desarrolladora**, quiero componentes base y valores de diseño centralizados, para que todas las pantallas se vean y se comporten igual. |
| H-05 | P1 | Como **persona desarrolladora**, quiero una pantalla de diagnóstico que consulte al backend, para confirmar que app y servidor se comunican. |
| H-06 | P2 | Como **persona usuaria**, quiero que ante un fallo inesperado la app muestre un mensaje claro en español y me deje reintentar, en lugar de cerrarse. |
| H-07 | P2 | Como **persona desarrolladora**, quiero utilidades para mostrar dinero (MXN) y fechas con formato mexicano, para no repetir ese código. |
| H-08 | P2 | Como **persona desarrolladora**, quiero un lugar seguro para guardar valores sensibles en el dispositivo, para usarlo cuando exista la sesión. |
| H-09 | P2 | Como **persona desarrolladora**, quiero pruebas, formato y verificación de tipos listos, para agregar funcionalidad con confianza. |
| H-10 | P3 | Como **equipo**, quiero verificaciones automáticas en cada cambio, para mantener la calidad. |

## 3. Requisitos funcionales (técnicos)

| ID | Requisito |
|---|---|
| RF-01 | La app se inicia en emulador Android, simulador iOS o dispositivo físico (Expo Go) con `npx expo start`. |
| RF-02 | La configuración se lee solo de variables de entorno públicas de Expo (`EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_APP_ENV`) y se valida al iniciar; si es inválida, se muestra una pantalla de error de configuración en español en vez de fallar en silencio. |
| RF-03 | Existe un esqueleto de rutas con: raíz, una pantalla base de inicio, pantalla "no encontrada" y una pantalla de diagnóstico disponible **solo** en entorno de desarrollo. |
| RF-04 | Existe un sistema de *tokens* de diseño (colores, degradados, espaciados, radios, tipografías, sombras, tamaños y movimiento) que reproduce el diseño aprobado (§9), y un conjunto de componentes base: `Screen`, `AppText`, `Button`, `LoadingState`, `ErrorState`, `AppIcon`, `IconBadge`, `BrandMark`, `GradientBackground`, `Card`, `Chip`, `Divider`. |
| RF-05 | Todos los textos visibles viven en un único módulo `es-MX`; no hay texto visible literal en componentes. |
| RF-06 | Un cliente de API único llama al backend con tiempo máximo de espera, envía `X-Request-Id`, valida respuestas y convierte cualquier fallo en un error normalizado con `code`, `message`, `status`, `requestId` y `details`. |
| RF-07 | Los códigos de error cubren los 8 del servidor más `network_error`, `timeout` e `invalid_response`, cada uno con mensaje en español para la persona usuaria. |
| RF-08 | Las consultas al servidor usan una caché con reintentos limitados: 1 reintento para red/5xx y ninguno para 4xx. |
| RF-09 | La pantalla de diagnóstico consulta `GET /api/v1/meta` y muestra nombre, versión, entorno y hora del servidor, con estados cargando y error (con reintento). |
| RF-10 | Un manejador global de errores de renderizado muestra una pantalla de recuperación en español con opción de reintentar. |
| RF-11 | Existen `formatMXN(cents)`, `formatDate(iso)` y `formatDateTime(iso)` con formato `es-MX`. |
| RF-12 | Existe una capa de almacenamiento seguro (leer, guardar, borrar) sobre el almacén seguro del dispositivo, sin uso funcional todavía. |
| RF-13 | Los comandos `typecheck`, `lint`, `format` y `test` existen y funcionan. |
| RF-16 | Existen los componentes de interacción `BottomSheet`, `SearchBar`, `Avatar`, `ListRow`, `ProgressBar`, `SegmentedControl`, `RatingStars`, `Skeleton` y `Banner`, para que las specs 003 a 015 no creen versiones propias (Art. XIII.5). |
| RF-14 | Hay un archivo `.env.example` y un README que explican cómo apuntar la app al backend (emulador Android, simulador iOS, dispositivo físico). |
| RF-15 | La tipografía del diseño (Plus Jakarta Sans) se carga al iniciar; mientras carga se mantiene la pantalla de arranque y, si falla, la app usa la fuente del sistema sin romperse. |

## 4. Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-01 | Cobertura de pruebas ≥ 80 % en `src/lib/` y `src/features/*/hooks/` (Art. IX). |
| RNF-02 | `tsc --noEmit` y `eslint` terminan sin errores ni advertencias. |
| RNF-03 | Sin `any` ni `@ts-ignore` en el código fuente. |
| RNF-04 | Ningún valor de diseño ni texto visible literal fuera de `src/theme/` y `src/i18n/` (verificable con una prueba automática o regla de lint). |
| RNF-05 | Ningún secreto en el repositorio ni en variables `EXPO_PUBLIC_*`. |
| RNF-06 | Las dependencias se limitan a las registradas en `plan.md` y `memoria.md`. |
| RNF-07 | Los controles interactivos base tienen área táctil ≥ 44×44 puntos y etiqueta accesible. |
| RNF-08 | La pantalla de inicio se muestra en menos de 3 s en un emulador de gama media tras el arranque en caliente. |

## 5. Criterios de aceptación

| ID | Dado / Cuando / Entonces |
|---|---|
| CA-01 | **Dado** un equipo con Node y un emulador, **cuando** sigo el README, **entonces** la app abre y muestra la pantalla de inicio. |
| CA-02 | **Dado** que `EXPO_PUBLIC_API_URL` no es una URL válida, **cuando** abro la app, **entonces** veo una pantalla de error de configuración en español. |
| CA-03 | **Dado** el backend en marcha, **cuando** abro diagnóstico, **entonces** veo nombre, versión, entorno y hora del servidor. |
| CA-04 | **Dado** el backend detenido, **cuando** abro diagnóstico, **entonces** veo el estado de error "sin conexión" con botón de reintento que vuelve a consultar. |
| CA-05 | **Dado** una respuesta 404 con el envoltorio de error del backend, **cuando** la procesa el cliente, **entonces** produce un error `not_found` con el `requestId` recibido. |
| CA-06 | **Dado** una respuesta cuyo cuerpo no cumple el esquema esperado, **cuando** la procesa el cliente, **entonces** produce `invalid_response`. |
| CA-07 | **Dado** una petición que excede el tiempo máximo, **cuando** vence, **entonces** produce `timeout`. |
| CA-08 | **Dado** un componente que falla al renderizar (prueba), **cuando** ocurre, **entonces** se muestra la pantalla de recuperación y no se cierra la app. |
| CA-09 | **Dado** `formatMXN(12345)`, **entonces** devuelve `$123.45` en formato `es-MX`. |
| CA-10 | **Dado** una compilación de producción, **cuando** busco la ruta de diagnóstico, **entonces** no está disponible. |
| CA-11 | **Dado** el repositorio limpio, **cuando** ejecuto `npm run typecheck && npm run lint && npm test`, **entonces** todo termina sin errores. |

## 6. Fuera de alcance

- Autenticación, registro, sesión y perfiles.
- Cualquier pantalla o flujo de negocio (objetos, búsqueda, solicitudes, reservas, chat, QR, incidencias, calificaciones).
- Cámara, ubicación, notificaciones push y otros permisos del dispositivo.
- Modo oscuro, internacionalización a otros idiomas y accesibilidad avanzada.
- Compilación con EAS, publicación en tiendas y firma de aplicaciones.
- Soporte sin conexión (*offline-first*).

## 7. Preguntas abiertas

- [RESUELTA 9 nov 2026: paleta y tipografía tomadas del diseño de Stitch (terracota, verde y crema; Plus Jakarta Sans). Valores en `plan.md` §4.2.]
- [NEEDS CLARIFICATION: ¿Plataformas objetivo obligatorias: Android, iOS o ambas? Se asume ambas, probando primero en Android.]
- [NEEDS CLARIFICATION: ¿Se exige un identificador de paquete específico (p. ej. `mx.edu.utt.vaiven`)? Se propone `mx.vaiven.app` como valor provisional.]

## 8. Trazabilidad con la constitución

Art. I (esta spec), II (RF-02/06), III (RNF-03, RF-06), IV (RF-06/07/09), V (RF-05/11), VI (RF-03), VII (RF-04, RNF-04/07), VIII (RF-12, RNF-05), IX (RNF-01/02, RF-13), X (RNF-06), XI (proceso).

## 9. Lenguaje visual aprobado (diseño de Stitch)

Referencia: `docs/diseno/referencia/`. La app se siente **cálida, vecinal y clara**:
- Fondo crema; terracota para marca y acciones principales; verde para apoyo y confirmaciones.
- Esquinas muy redondeadas, campos altos (56 pt) con ícono en un círculo tintado, sombras suaves y cálidas.
- Un solo botón principal por pantalla, con flecha al final cuando avanza un paso.
- Títulos grandes y expresivos con una palabra destacada en terracota; texto de apoyo breve.
- Solo modo claro.
Las pantallas de cada módulo se especifican en su propia spec (003 §7, 004 §7, 005 §7, 006 §7, 007 §7, 008 §7, 009 §7, 010 §7, 011 §7, 012 §7, 013 §7, 014 §7, 015 §7). Esta spec entrega los *tokens*, los componentes y los estados transversales.

**Reglas generales para todas las pantallas:**
- **Poco texto.** Títulos de una a tres palabras, una línea de apoyo como máximo, y íconos que se entiendan solos. Lo que no cabe en una línea se resume o pasa a un detalle.
- **Una acción principal por pantalla**, abajo y fija cuando la pantalla es de decisión; las acciones secundarias son `outline` o `link`.
- **Hojas inferiores** (`BottomSheet`) para decisiones cortas (filtrar, solicitar, confirmar, cancelar, reportar); pantalla completa solo para tareas largas.
- **Estado siempre visible**: una `Chip` o píldora de color (§ colores de estado) y, si hay un proceso, una línea de pasos.
- **Dinero** siempre en MXN con `formatMXN`; **cercanía** como «~300 m» o «~1 km», nunca coordenadas ni calles (la ubicación exacta es privada).

### 9.1 Estados transversales (`components/ui`)
| Estado | Diseño |
|---|---|
| Vacío (`EmptyState`) | `IconBadge` grande (64), título (`heading`), una línea `muted` y, si aplica, un botón. Máximo dos líneas de texto. |
| Cargando | `Skeleton` con la forma del contenido; `LoadingState` (indicador y texto accesible) solo para pantalla completa o acciones breves. |
| Error (`ErrorState`) | Ícono de nube tachada, mensaje corto, botón «Reintentar» (`outline`) y el `requestId` en `caption`, apenas visible. |
| No encontrada | Ícono de brújula, «No encontramos esta página» y botón «Ir al inicio». |
| Error de configuración | Pantalla completa con ícono de advertencia, mensaje y detalle técnico en `caption`. |
| Diagnóstico (solo desarrollo) | `Card` con filas clave–valor y punto de estado verde o rojo, con `Chip` «DEV». |
| Aviso global (`Banner`) | Barra de 36 pt bajo la barra de estado, una línea con ícono. Variantes: `offline` (fondo `ink`), `success` (verde, 2 s), `warning` y `danger`. |

### 9.2 Colores de estado de una reserva
Pendiente → `warning`/`warningSoft` · Aceptada → `secondary`/`secondarySoft` · En curso → `primaryInk`/`primarySoft` · Concluida → `secondaryPressed`/`secondarySoft` con ícono de verificación · Rechazada y Cancelada → `danger`/`dangerSoft` · Vencida → `muted`/`surfaceMuted`. El color nunca es la única señal: siempre va con texto e ícono.

## 7. Servicios y entorno local (movido desde la antigua spec de servicios)
| ID | Requisito |
|---|---|
| RF-S1 | `app.config.ts` define nombre «Vaivén», `slug`, `scheme: "vaiven"`, identificadores de paquete (**provisional** `mx.vaiven.app`) y permisos declarados (cámara, ubicación aproximada, fotos, notificaciones) con textos en español. |
| RF-S2 | La URL del backend se lee de `EXPO_PUBLIC_API_URL` (sin secretos); `src/config` valida que exista y falla con mensaje claro. `.env.example` documenta las variables públicas. |
| RF-S3 | La pantalla de diagnóstico muestra la URL activa, `/healthz`, `/readyz` y la versión del backend (`GET /api/v1/meta`). |
| RF-S4 | Esta spec termina **verificada en Expo Go contra staging** (Art. XIV): sin compilación ni despliegue de la app. |
