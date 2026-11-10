# Spec 008 — Chat (móvil)

- **Dueño:** MO-B · **Prioridad:** P1 · **Ventana:** 10–13 nov · **Depende de:** 003, 007 (móvil) y contrato 008 (backend)
- **Constitución:** v1.2.0 · **Estado:** Borrador

## 1. Objetivo y por qué
Que propietario y solicitante coordinen el encuentro, el estado del objeto y los detalles. El chat nace al **aceptarse** la reserva y queda ligado a ella.

## 2. Historias
| # | Prio. | Historia |
|---|---|---|
| H-01 | P1 | Como participante, quiero escribir y leer mensajes de mi reserva, para coordinarnos. |
| H-02 | P1 | Como persona usuaria, quiero ver mis conversaciones con no leídos, para atender lo pendiente. |
| H-03 | P2 | Como persona usuaria, quiero que el mensaje aparezca al instante al enviarlo, aunque la red sea lenta. |

## 3. Requisitos
| ID | Requisito |
|---|---|
| RF-01 | Pantalla **Mensajes** (ruta de pestaña oculta de la barra; se abre desde el botón de mensajes del encabezado de Inicio, spec 003): lista de conversaciones (`GET /conversations`, paginada) con contraparte, objeto, último mensaje, hora y contador de no leídos; insignia en el botón de mensajes de Inicio con `GET /conversations/unread-count`. |
| RF-02 | **Pantalla de chat** `chat/[id]`: mensajes en orden cronológico (los recientes abajo), carga de anteriores al subir (`before`), burbujas propias/ajenas, hora, separadores por día, encabezado con objeto y estado de la reserva (enlace a `reserva/[id]`). |
| RF-03 | **Envío optimista**: al enviar, el mensaje aparece de inmediato con `clientId` (UUID) y estado «enviando»; si falla, «no enviado» con reintentar. El reintento reutiliza el mismo `clientId` (idempotente). |
| RF-04 | **Actualización por consulta periódica**: cada 5 s con la pantalla abierta y la app en primer plano (`?after=<último id>`); en la lista cada 20 s; se pausa en segundo plano. No hay *websockets*. |
| RF-05 | Al abrir un chat se marca como leído (`POST /conversations/{id}/read`) y se actualiza el contador. **No** se muestran confirmaciones de lectura a la contraparte. |
| RF-06 | Si `canWrite` es falso (reserva concluida, rechazada, cancelada o vencida), el campo de texto se reemplaza por un aviso. |
| RF-07 | Límite 1,000 caracteres con contador; sin envío de mensajes vacíos; se bloquea el botón mientras se envía. |
| RF-08 | Mensaje rechazado por moderación (`400 content_not_allowed`) o por límite de ritmo (429): mensaje claro y el texto no se pierde. |
| RF-09 | Registra la sección `chat` en el detalle de la reserva (*slot* de 007): botón «Abrir chat» o un resumen. |
| RF-10 | Si todavía no hay conversación (reserva `pending`), el botón no aparece. |
| RF-11 | **Respuestas rápidas:** fila de chips sobre el campo de texto («¿Dónde nos vemos?», «Ya llegué», «¿A qué hora?», «Gracias») que solo **rellenan** el campo; no envían ni cambian el contrato. |
| RF-12 | Las pantallas siguen el diseño de §7. |
| RNF-01 | Con 200 mensajes la lista se desplaza con fluidez (lista invertida). |
| RNF-02 | Cobertura ≥ 80 % en mezcla de mensajes (servidor + optimistas) y consulta periódica. |

## 4. Criterios de aceptación
| ID | Dado / Cuando / Entonces |
|---|---|
| CA-01 | Dado un mensaje enviado sin red, entonces aparece «no enviado» y al reintentar no se duplica. |
| CA-02 | Dada la otra persona escribiendo, entonces mi pantalla lo muestra en ≤ 5 s. |
| CA-03 | Dada la app en segundo plano, entonces no hay consultas periódicas. |
| CA-04 | Dada una reserva concluida, entonces el campo de texto no está disponible. |
| CA-05 | Dado un chat con no leídos, cuando lo abro, entonces el contador del botón de mensajes baja. |
| CA-06 | Dado un texto prohibido, entonces veo el motivo y conservo el texto. |

## 5. Fuera de alcance
Imágenes en el chat, indicador «escribiendo…», confirmaciones de lectura, editar/borrar mensajes, chat grupal.

## 6. Preguntas abiertas
- Ninguna adicional.

## 7. Diseño de pantallas

Lenguaje y reglas generales: spec 002 §9. Textos desde `src/i18n/chat.ts`.

### 7.1 Mensajes (`(tabs)/mensajes`, oculta de la barra)
- **Encabezado:** «Volver» y «Mensajes».
- **`ConversationRow`:** `Avatar` 40, nombre (en negrita si hay no leídos), una línea del objeto (ícono de caja, `caption`, `muted`), el último mensaje (1 línea), hora a la derecha y, debajo, un círculo `primary` con el número de no leídos. Conversación cerrada: fila en `muted` con candado junto a la hora.
- **Estados:** `Skeleton` de filas · vacío con ícono de burbuja, «Aún no tienes mensajes» y la línea «Tus conversaciones aparecen cuando aceptan una solicitud» · error con reintento.

### 7.2 Chat (`chat/[id]`)
- **Encabezado:** «Volver», `Avatar` 32, nombre y debajo el objeto (miniatura de 20 pt y título); a la derecha, píldora del estado de la reserva. Tocar el encabezado abre `reserva/[id]`.
- **Burbujas:** propias a la derecha en `primary` con texto `onPrimary`; ajenas a la izquierda en `surface` con borde `border`; radio `lg` con la esquina cercana al emisor en `sm`; hora en `caption` dentro de la burbuja. Separadores de día en píldora centrada `surfaceMuted` («Hoy», «Ayer», «12 nov»).
- **Estados del mensaje propio:** enviando (hora tenue y reloj) · no enviado (ícono de alerta `danger` y `link` «Reintentar» bajo la burbuja). Pulsación larga: «Reportar» (011).
- **Parte baja:** `QuickReplies` (RF-11), campo en píldora multilínea (hasta 4 líneas) y botón circular de enviar en `primary`, deshabilitado si está vacío. El contador aparece solo a partir de 900 de 1,000 caracteres.
- **Chat cerrado (`canWrite` falso):** el campo se reemplaza por una barra `surfaceMuted` con candado y «Conversación cerrada».
- **Errores:** moderación (400) → `ModerationNotice` (011) sobre el campo, sin perder el texto; ritmo (429) → `Banner` `warning` «Más despacio».
