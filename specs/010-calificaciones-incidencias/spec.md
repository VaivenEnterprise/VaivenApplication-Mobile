# Spec 010 — Calificaciones e incidencias (móvil)

- **Dueño:** MO-B · **Prioridad:** P1 · **Ventana:** 13–17 nov · **Depende de:** 003, 007 (móvil) y contrato 010 (backend)
- **Constitución:** v1.2.0 · **Estado:** Borrador

## 1. Objetivo y por qué
Generar confianza: calificar a la contraparte al terminar, ver la reputación de otras personas y, si algo sale mal, **reportar una incidencia** con evidencia y seguir su resolución.

## 2. Historias
| # | Prio. | Historia |
|---|---|---|
| H-01 | P1 | Como participante, quiero calificar con estrellas y un comentario al terminar la operación. |
| H-02 | P1 | Como persona usuaria, quiero ver la reputación de quien me presta o me pide algo. |
| H-03 | P1 | Como participante, quiero reportar un incumplimiento con evidencia. |
| H-04 | P2 | Como participante, quiero seguir mis incidencias y leer la respuesta final. |

## 3. Requisitos
| ID | Requisito |
|---|---|
| RF-01 | En el detalle de la reserva (*slot* `ratingsAndIncidents`), si `GET /bookings/{id}/rating-status` indica `canRate`, aparece la tarjeta **«Calificar»**; si ya calificó, muestra su calificación; si venció, lo indica. |
| RF-02 | Formulario de calificación: 1–5 estrellas (accesibles con valor leído), comentario opcional ≤ 300 con contador; `POST /bookings/{id}/ratings`; tras éxito se bloquea el formulario. |
| RF-03 | **Reputación** en el perfil público (`usuario/[id]`, *slot* `renderReputation`) y en el propio: promedio con 1 decimal, cantidad y lista paginada de comentarios (`GET /users/{id}/ratings`). Si no hay calificaciones: «Aún sin calificaciones». |
| RF-04 | La tarjeta del propietario en el detalle del objeto (005) muestra promedio y cantidad con `RatingSummary`. |
| RF-05 | **Reportar incidencia** desde el detalle de la reserva (*slot*), visible cuando la reserva es `accepted`, `in_progress` o `completed` (dentro de 72 h): motivo (6 opciones), descripción 10–1000, hasta 5 fotos de evidencia; `POST /bookings/{id}/incidents`. |
| RF-06 | Se muestra qué hará la plataforma: «El equipo revisará el caso; el estado de la reserva no cambia automáticamente». |
| RF-07 | **Mis incidencias** (desde Perfil, mediante *slot* `renderExtraRows`): lista (`GET /me/incidents`) y detalle `incidencia/[id]` con motivo, descripción, evidencia (URL firmada), notas visibles del equipo, y la **respuesta final** cuando esté cerrada. |
| RF-08 | Errores: 409 (ventana vencida, límite de 3 abiertas, ya calificó), 403; mensajes claros. |
| RF-09 | La suspensión (`account_suspended`) ya la maneja 003; aquí no se duplica. |
| RF-10 | **Calificar al estilo de las apps de viajes y comida:** una tarjeta con estrellas vacías tocables; al tocar una se abre una hoja con la persona, la puntuación elegida, **chips rápidos** (p. ej. «Puntual», «Cuidó el objeto») y comentario opcional. Los chips seleccionados se añaden al texto del comentario (sin cambiar el contrato). |
| RF-11 | Las pantallas siguen el diseño de §7. |
| RNF-01 | Cobertura ≥ 80 % en componentes de estrellas, formularios y reglas de visibilidad. |

## 4. Criterios de aceptación
| ID | Dado / Cuando / Entonces |
|---|---|
| CA-01 | Dada una reserva concluida y sin calificar, entonces veo «Calificar»; tras enviar veo mi puntuación. |
| CA-02 | Dada una calificación duplicada, entonces el servidor responde 409 y la UI lo explica. |
| CA-03 | Dado el perfil de alguien con 4 calificaciones, entonces veo promedio y cantidad. |
| CA-04 | Dada una incidencia enviada, entonces aparece en Mis incidencias como abierta. |
| CA-05 | Dada una incidencia cerrada, entonces veo la respuesta final. |
| CA-06 | Dada una reserva rechazada, entonces no veo «Reportar incidencia». |
| CA-07 | Dadas 4 estrellas tocadas en la tarjeta, entonces se abre la hoja con 4 estrellas y chips de experiencia positiva. |
| CA-08 | Dados chips seleccionados y sin comentario, entonces el comentario enviado contiene sus textos. |

## 5. Fuera de alcance
Apelaciones, chat con el equipo, editar o borrar calificaciones, responder a calificaciones.

## 6. Preguntas abiertas
- Ninguna adicional.
- [NEEDS CLARIFICATION: los 6 motivos de incidencia. Provisional (a confirmar con el contrato 010 del backend): no se presentó · retraso · daño · no era lo publicado · pago · otro.]
- [NEEDS CLARIFICATION: ¿se quieren etiquetas rápidas como datos propios (no solo texto en el comentario)? Provisional: no; requeriría ampliar el contrato.]

## 7. Diseño de pantallas

Lenguaje y reglas generales: spec 002 §9. Textos desde `src/i18n/ratings.ts` e `incidents.ts`. Referencia de interacción: calificar al terminar un viaje o un pedido (Uber, Rappi).

### 7.1 Calificar
- **Tarjeta «Calificar»** en el detalle de la reserva: `Card` `primarySoft` con `Avatar`, «Califica a {nombre}» y cinco estrellas vacías tocables. Si ya calificó: sus estrellas y «Tu calificación». Si venció: `muted` «Ya no puedes calificar».
- **Hoja de calificación** (`BottomSheet` alto): `Avatar` 72 centrado, «¿Cómo te fue con {nombre}?» (`heading`) y estrellas grandes de 48 pt. Al elegir, aparece una palabra bajo las estrellas («Excelente», «Bien», «Regular», «Mal», «Muy mal») y los **chips rápidos**: con 4–5 estrellas «Puntual», «Amable», «Cuidó el objeto»; con 1–3, «Tardó», «Objeto sucio», «Mala comunicación» (selección múltiple). Después, campo «Agregar comentario» con contador de 300.
- **Acciones:** «Enviar» (`primary`, deshabilitado sin estrellas) y `link` «Ahora no». Éxito: check, «Gracias» y cierre; la tarjeta muestra la puntuación.

### 7.2 Reputación
- **`RatingSummary` compacto** («★ 4.9 · 18») en `OwnerCard`, listas y encabezados.
- **Perfil público y propio:** tarjeta con el promedio grande (`display`), `RatingStars` y «18 calificaciones», y debajo la lista de `RatingCard` (`Avatar`, nombre, estrellas, fecha relativa y comentario). Sin calificaciones: «Aún sin calificaciones».

### 7.3 Reportar una incidencia (`incidencia/nueva/[bookingId]`)
Pantalla completa con «Volver» y «¿Qué pasó?».
1. **Motivo:** mosaicos de 2 columnas × 3 filas, cada uno con ícono y nombre corto (`ReasonPicker`).
2. Al elegir, aparecen en la misma pantalla: descripción (10–1000, con contador) y fila de fotos (hasta 5).
3. `Banner` `info`: «El equipo revisará el caso. La reserva no cambia sola.»
Botón fijo «Enviar reporte», habilitado con motivo y descripción válida.

### 7.4 Mis incidencias (`incidencias`) y detalle (`incidencia/[id]`)
- **Lista:** `IncidentCard` con ícono del motivo, nombre del motivo, objeto, fecha y píldora «Abierto» (`warning`) o «Cerrado» (`muted`). Vacío: «Sin incidencias».
- **Detalle:** píldora de estado y línea de tres puntos «Enviado · En revisión · Cerrado»; tarjeta con motivo y descripción; evidencia en fila de miniaturas (se amplían al tocar); «Notas del equipo» si las hay; y, si está cerrada, una tarjeta destacada `secondarySoft` «Respuesta final».
