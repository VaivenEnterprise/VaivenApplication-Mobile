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

## 5. Fuera de alcance
Apelaciones, chat con el equipo, editar o borrar calificaciones, responder a calificaciones.

## 6. Preguntas abiertas
- Ninguna adicional.
