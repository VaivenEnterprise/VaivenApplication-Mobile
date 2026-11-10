# Spec 007 — Solicitudes y reservas (móvil)

- **Dueño:** MO-A · **Prioridad:** P0 · **Ventana:** 10–13 nov · **Depende de:** 003, 005, 006 (móvil) y contrato 007 (backend)
- **Constitución:** v1.2.0 · **Estado:** Borrador

## 1. Objetivo y por qué
El corazón de Vaivén: solicitar un objeto en unas fechas viendo **antes** el total, y que el propietario acepte o rechace. Toda la actividad posterior (chat, entrega, pagos) cuelga de una reserva.

## 2. Historias
| # | Prio. | Historia |
|---|---|---|
| H-01 | P0 | Como solicitante, quiero elegir fechas y ver el total y el desglose de pagos antes de enviar, para no llevarme sorpresas. |
| H-02 | P0 | Como solicitante, quiero enviar la solicitud y seguir su estado. |
| H-03 | P0 | Como propietario, quiero aceptar o rechazar solicitudes, para decidir con quién trato. |
| H-04 | P1 | Como participante, quiero cancelar con un motivo, y conocer las consecuencias antes de confirmar. |
| H-05 | P1 | Como participante, quiero acordar o ajustar el punto de encuentro. |

## 3. Requisitos
| ID | Requisito |
|---|---|
| RF-01 | En el detalle del objeto (slot `renderActions` de 005), botón **«Solicitar»** (oculto si soy el dueño o el objeto no está activo). |
| RF-02 | Pantalla **Solicitar** (hoja inferior, §7.3): selector de rango de fechas (`@react-native-community/datetimepicker`; `YYYY-MM-DD`; inclusivo; máx. 7 días; sin pasadas), modo de pago (solo renta: «Pago completo en la entrega» o «50 % / 50 %») y **cotización en vivo** (`GET /items/{id}/quote`). |
| RF-03 | La cotización muestra días, tarifa, total en MXN, desglose por etapa y textos de política (vence en 48 h, cancelación tardía, no presentación). La persona debe marcar «Entiendo» antes de enviar. |
| RF-04 | Enviar usa `POST /bookings` con `acceptedTotalCents` del total mostrado; si el servidor responde 409 `quote_changed` o conflicto de fechas, se muestra la causa y se vuelve a cotizar. |
| RF-05 | Pestaña **Actividad**: dos segmentos «Como propietario» y «Como solicitante», filtro por estado (en curso, pendientes, concluidas) y lista paginada (`GET /me/bookings?role=`). |
| RF-06 | **Detalle de reserva** `reserva/[id]`: estado (`StatusBadge`), objeto, contraparte, fechas, montos, punto de encuentro, vencimiento (cuenta regresiva si está `pending`) y acciones según `viewerRole` y estado (ver RF-07). Se divide en secciones con *slots* que 008, 009 y 010 rellenan (chat, entrega/pagos, calificar/incidencia). |
| RF-07 | Acciones: propietario en `pending` → **Aceptar** (con punto de encuentro opcional) / **Rechazar**; ambos en `pending|accepted` → **Cancelar** (motivo obligatorio, confirmación con consecuencias). |
| RF-08 | Punto de encuentro: texto libre ≤ 200 que cualquiera de las partes puede proponer mientras la reserva esté `accepted`. |
| RF-09 | Estados con etiqueta en español y color de tokens: pendiente, aceptada, rechazada, vencida, cancelada, en curso, completada. |
| RF-10 | Tras aceptar/rechazar/cancelar, se actualiza el detalle y las listas (invalidación de claves). |
| RF-11 | Errores: 409 de transición inválida, 403, 404; mensajes claros. |
| RF-12 | **Proyecto** `proyecto/[id]`: pantalla que resuelve un problema («necesito colgar un cuadro») con tres cosas: **herramientas** necesarias, **mapa** de dónde conseguirlas y **personas** a quienes pedirlas, más un **paso a paso**. Los datos del proyecto vienen del catálogo de 006. |
| RF-13 | Por cada herramienta se consulta `GET /items?q={query}&lat&lng&radiusKm=3&limit=3` (la API de 006); la persona a pedir es el resultado más cercano. «Conseguir» abre la ficha de esa persona y objeto, y desde ahí «Solicitar» entra al flujo de RF-02. Sin resultados: «Nadie cerca» con opción de ampliar a 10 km. |
| RF-14 | **Mapa del vecindario** esquemático, sin teselas, sin claves ni dependencias de mapas: «Tú» al centro y un pin numerado por herramienta, colocado según la distancia y dirección relativas de su ubicación aproximada. Solo hay zonas aproximadas; nunca calles ni coordenadas exactas. Sin permiso de ubicación el mapa se reemplaza por una invitación a activarla y las filas muestran la zona. |
| RF-15 | **Paso a paso**: cada paso se marca con «Ya lo hice» (y se desmarca); el avance vive en memoria de la sesión. «Terminé mi proyecto» se habilita al completar todos los pasos y abre una hoja que invita a devolver lo pedido (lleva a Actividad). |
| RF-16 | Las pantallas siguen el diseño de §7. El diseño de Stitch trae elementos que contradicen el alcance del producto; no se muestran (§7.6). |
| RNF-01 | Cobertura ≥ 80 % en cálculo de fechas, cotización y acciones por estado/rol. |

## 4. Criterios de aceptación
| ID | Dado / Cuando / Entonces |
|---|---|
| CA-01 | Dado un rango de 3 días, entonces veo la cotización con total y desglose. |
| CA-02 | Dado un rango de 8 días, entonces el selector lo impide. |
| CA-03 | Dado un cambio de precio entre cotización y envío, entonces veo el aviso y la nueva cotización. |
| CA-04 | Dada una solicitud enviada, entonces aparece en Actividad como solicitante y pendiente. |
| CA-05 | Dado el rol propietario y estado pendiente, entonces veo Aceptar y Rechazar; el solicitante no. |
| CA-06 | Dada la aceptación, entonces el estado cambia a aceptada sin recargar la app. |
| CA-07 | Dada una cancelación, entonces se exige motivo y se confirma. |
| CA-08 | Dado el proyecto «Colgar un cuadro» con ubicación activa, entonces veo sus herramientas, cada una con persona y distancia, y un pin numerado por herramienta en el mapa. |
| CA-09 | Dada una herramienta sin resultados, entonces veo «Nadie cerca» y puedo ampliar el radio. |
| CA-10 | Dado un pin tocado, entonces se selecciona su fila y se abre su ficha, y a la inversa con «Conseguir». |
| CA-11 | Dado un proyecto de 3 pasos, entonces «Terminé mi proyecto» está deshabilitado hasta marcar los 3. |
| CA-12 | Dada la ubicación negada, entonces no veo el mapa, veo la invitación a activarla y puedo seguir pidiendo. |
| CA-13 | Dada una solicitud enviada desde un proyecto, entonces la herramienta aparece como «Solicitada». |

## 5. Fuera de alcance
Reservas recurrentes, reprogramar fechas, contraoferta de precio, calendarios sincronizados, mapa con teselas reales, guardar el avance de un proyecto entre sesiones, historial de proyectos terminados.

## 6. Preguntas abiertas
- [NEEDS CLARIFICATION: ¿se muestran los días ocupados en el selector? Provisional: no (el servidor valida y avisa).]
- [DECIDIDO 9 nov 2026] El avance de un proyecto vive **solo en memoria de la sesión** y «Mis trabajos realizados» (Inicio) sigue como marcador. Guardarlo en el teléfono o en el backend es una mejora posterior que no cambia las pantallas.

## 7. Diseño de pantallas

Lenguaje y reglas generales: spec 002 §9 y §9.2 (colores de estado). Textos desde `src/i18n/bookings.ts` y `projects.ts`.

### 7.1 Proyecto (`proyecto/[id]`)
- **Encabezado:** «Volver», nombre del proyecto y `Avatar` (abre Perfil).
- **Tarjeta del proyecto:** degradado con ícono, título (`title`) y chips: reloj «30 min», lista «3 pasos» y dificultad («Fácil» en `success`).
- **«Lo que necesitas»** con `Chip` «3 herramientas». Lista numerada de `ToolRow`: número en círculo `primary`, miniatura (foto del objeto o ícono), nombre de la herramienta, línea «Carlos M. · ~300 m» y botón «Conseguir» (`primary`, pequeño). Estados de la fila: buscando (`Skeleton`) · sin resultados («Nadie cerca» y `link` «Ampliar») · solicitada (check y `Chip` «Solicitada», sin botón) · seleccionada (borde `secondary` de 2 pt, sincronizada con su pin).
- **«¿Dónde está cada cosa?»** con la pista «Toca un pin» y `NeighborhoodMap` (alto 220): fondo `mapLand`, manzanas `mapBlock`, calles `mapRoad`, parque `mapPark`; punto `userDot` con la etiqueta «Tú»; pines numerados en `primary` (el seleccionado en `secondary`) con la zona debajo; `Chip` inferior «Radio < 400 m».
- **Ficha de la persona (`PinCard`, `BottomSheet`)** al tocar un pin o «Conseguir»: `Chip` «Pin #1», miniatura y título del objeto, fila con `Avatar`, nombre y `RatingStars` «4.9 (18)», precio «$90 /día» grande, `Chip` de zona «{colonia} · ~300 m» y dos botones: «Solicitar» (`primary`) y «Ver objeto» (`outline`).
- **«Paso a paso»** con «1 de 3» y `ProgressBar`. `StepCard`: *completado* (círculo `secondary` con check, título tachado, píldora «Listo»); *activo* (círculo `primary` con número, título, texto, área de ilustración de 120 pt en `surfaceMuted` y caja «Tip» en `warningSoft` con bombilla); *pendiente* (círculo gris). Cada paso tiene el botón «Ya lo hice» (`outline`, en píldora).
- **Barra inferior fija:** «Terminé mi proyecto» (`secondary`), deshabilitada hasta completar todos los pasos. Al pulsar: `BottomSheet` con ícono de check grande, «¡Proyecto listo!», una línea «No olvides devolver lo que pediste» y botones «Devolver herramientas» (a Actividad) y `link` «Cerrar».
- **Estados:** `Skeleton` en filas y mapa · ubicación negada: `Card` «Activa tu ubicación» con botón `outline` «Activar», filas con la zona y sin distancia · error por herramienta con «Reintentar».

### 7.2 Mapa del vecindario (`NeighborhoodMap`)
Esquema decorativo fijo (manzanas, calles y un parque dibujados con `react-native-svg`); no representa calles reales. El usuario va al centro; cada pin se coloca por desplazamiento relativo en metros, escalado para que el más lejano quede al 80 % del radio mostrado. Accesibilidad: el mapa es una ayuda visual; la información completa está en las filas (nombre, zona y distancia), y cada pin tiene etiqueta «Herramienta 1: {nombre}, {distancia}».

### 7.3 Solicitar (`solicitar/[itemId]`, `BottomSheet`)
- **Encabezado:** «Solicitar» y «X».
- **Objeto:** miniatura, título y persona (`Avatar` 32, nombre, estrellas).
- **«¿Cuándo?»:** chips «Hoy», «Mañana», «Fin de semana» y un campo «Elegir fechas» (rango). Una vez elegido: «12 – 14 nov · 3 días». Máximo 7 días y sin fechas pasadas.
- **«¿Cómo pagan?»** (solo renta): dos tarjetas seleccionables, «Todo al entregar» y «50 % + 50 %»; la elegida con borde `secondary`.
- **Resumen** (`Card` `muted`): «Renta (3 días) $270 MXN»; con 50/50, «Al entregar $135 · Al devolver $135»; y «Total» grande en `secondary`. Préstamo: «Gratis».
- **Condiciones:** fila plegable «Condiciones ›» (vence en 48 h, cancelación tardía, no presentación; texto del servidor) y casilla «Entiendo». Una línea `caption` con ícono de mano: «Se paga en persona».
- **Botón fijo:** «Enviar solicitud» (`primary`), deshabilitado sin fechas ni «Entiendo»; cargando al enviar.
- **Errores:** `quote_changed` → `Banner` `warning` «El precio cambió» con el nuevo total resaltado; fechas ocupadas → `Banner` `danger` «Esas fechas ya no están libres».
- **Éxito:** la hoja cambia a un check grande, «Solicitud enviada», «Te avisamos cuando responda» y los botones «Ver en Actividad» (`primary`) y `link` «Seguir».

### 7.4 Actividad (`(tabs)/actividad`)
- **Encabezado:** «Actividad».
- **`SegmentedControl`:** «Solicito · Presto», con insignia de pendientes en «Presto».
- **Chips de estado:** «Todas · En curso · Pendientes · Concluidas».
- **`BookingCard`:** miniatura, título del objeto, nombre de la otra persona, fechas «12–14 nov», monto o «Gratis» y píldora de estado (§9.2). Las pendientes del propietario añaden «Responde antes de {hora}». Sin botones en la tarjeta.
- **Estados:** `Skeleton` · vacío «Aún no has pedido nada» con botón «Explorar» (y «Nadie te ha pedido algo» en «Presto») · error · cargando más.

### 7.5 Detalle de reserva (`reserva/[id]`)
- **Encabezado:** «Volver» y título del objeto. Píldora de estado grande y, en `pending`, cuenta regresiva «Vence en 36 h».
- **Avance:** línea de cuatro puntos «Solicitada · Aceptada · En curso · Concluida». Si la reserva fue rechazada, cancelada o venció, la línea se sustituye por un `Banner` del color de estado.
- **Persona:** `Avatar`, nombre, estrellas y botón circular de chat (*slot* de 008; oculto en `pending`).
- **Fechas y monto:** fechas, «3 días», forma de pago y total.
- **Punto de encuentro:** `Card` con pin y el texto (o «Por definir») y `link` «Proponer» o «Cambiar» (hoja con campo ≤ 200).
- ***Slots*** en orden: Entrega y pagos (009), Calificar e incidencia (010).
- **Barra inferior fija:** propietario en `pending`: «Aceptar» (`secondary`) y «Rechazar» (`outline`). En `pending` o `accepted`, cualquiera de las partes: «Cancelar» (`link` en `danger`, junto a la barra). Fuera de esos casos, sin barra.
- **`AcceptSheet`:** campo opcional «¿Dónde se ven?» y botón «Aceptar».
- **`CancelSheet`:** «¿Por qué cancelas?» con cuatro motivos como chips y «Otro» (abre campo); una línea con la consecuencia (texto del servidor); `danger` «Cancelar reserva» y `link` «Volver».
- **Rechazar:** hoja corta «¿Rechazar solicitud?» con `danger` «Rechazar» y `link` «Volver».

### 7.6 Del diseño de Stitch que NO se muestra
El diseño de proyecto traía elementos que el documento de idea deja fuera de la primera versión (sin cobros, depósitos ni garantías; entregas presenciales; sin garantía de identidad):
- **«Depósito reembolsable»**, «Depósito en garantía», «Total a pagar hoy» y el mensaje «Tu depósito queda protegido»: no hay depósitos ni cobros; el total es solo la renta.
- **«A domicilio» (+$25 de envío)** y los horarios de recogida: las entregas son presenciales y se acuerdan en el chat.
- **«Identidad verificada»:** se sustituye por la reputación (estrellas y calificaciones).
- **«Rentar ahora» y «Confirmar renta»:** la persona **solicita**; el propietario decide. Se llaman «Solicitar» y «Enviar solicitud».
- **«Enviar mensaje»** antes de solicitar: el chat se habilita al enviar la solicitud.
- **Calles con nombre** en pines y filas («Calle Orizaba», «Colima / Tu cuadra»): solo zona aproximada.

### 7.7 Lo que el diseño no trae
Actividad, Detalle de reserva, Aceptar, Rechazar, Cancelar, estados de carga, vacío y error, y el mapa sin ubicación se definen aquí con el mismo lenguaje visual y quedan anotados como decisión propia.
