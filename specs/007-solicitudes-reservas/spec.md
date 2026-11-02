# Spec 007 — Solicitudes y reservas (móvil)

- **Dueño:** MO-A · **Prioridad:** P0 · **Ventana:** 10–13 nov · **Depende de:** 003, 005 (móvil) y contrato 007 (backend)
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
| RF-02 | Pantalla **Solicitar**: selector de rango de fechas (`@react-native-community/datetimepicker`; `YYYY-MM-DD`; inclusivo; máx. 7 días; sin pasadas), modo de pago (solo renta: «Pago completo en la entrega» o «50 % / 50 %») y **cotización en vivo** (`GET /items/{id}/quote`). |
| RF-03 | La cotización muestra días, tarifa, total en MXN, desglose por etapa y textos de política (vence en 48 h, cancelación tardía, no presentación). La persona debe marcar «Entiendo» antes de enviar. |
| RF-04 | Enviar usa `POST /bookings` con `acceptedTotalCents` del total mostrado; si el servidor responde 409 `quote_changed` o conflicto de fechas, se muestra la causa y se vuelve a cotizar. |
| RF-05 | Pestaña **Actividad**: dos segmentos «Como propietario» y «Como solicitante», filtro por estado (en curso, pendientes, concluidas) y lista paginada (`GET /me/bookings?role=`). |
| RF-06 | **Detalle de reserva** `reserva/[id]`: estado (`StatusBadge`), objeto, contraparte, fechas, montos, punto de encuentro, vencimiento (cuenta regresiva si está `pending`) y acciones según `viewerRole` y estado (ver RF-07). Se divide en secciones con *slots* que 008, 009 y 010 rellenan (chat, entrega/pagos, calificar/incidencia). |
| RF-07 | Acciones: propietario en `pending` → **Aceptar** (con punto de encuentro opcional) / **Rechazar**; ambos en `pending|accepted` → **Cancelar** (motivo obligatorio, confirmación con consecuencias). |
| RF-08 | Punto de encuentro: texto libre ≤ 200 que cualquiera de las partes puede proponer mientras la reserva esté `accepted`. |
| RF-09 | Estados con etiqueta en español y color de tokens: pendiente, aceptada, rechazada, vencida, cancelada, en curso, completada. |
| RF-10 | Tras aceptar/rechazar/cancelar, se actualiza el detalle y las listas (invalidación de claves). |
| RF-11 | Errores: 409 de transición inválida, 403, 404; mensajes claros. |
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

## 5. Fuera de alcance
Reservas recurrentes, reprogramar fechas, contraoferta de precio, calendarios sincronizados.

## 6. Preguntas abiertas
- [NEEDS CLARIFICATION: ¿se muestran los días ocupados en el selector? Provisional: no (el servidor valida y avisa).]
