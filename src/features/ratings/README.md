# Calificaciones y reputación (spec 010)

Feature de calificaciones entre las partes de una reserva y de reputación en perfiles. Consume
`POST /bookings/{id}/ratings`, `GET /bookings/{id}/rating-status` y `GET /users/{id}/ratings`
(contrato `backend/api/paths/ratings.yaml`). Las rutas de administración no se usan.

## Qué exporta (`index.ts`)

| Export | Para quién | Uso |
|---|---|---|
| `RateBookingCard` | detalle de la reserva (007) | Tarjeta «Calificar»; se registra en el *slot* `ratingsAndIncidents`. |
| `RatingSummary` | 005 (`OwnerCard`), 006 (`ItemCard`) | Resumen compacto «★ 4.9 · 18» o «Sin calificaciones» (P-05). Recibe `average` y `count`. |
| `ReputationSection` | 003 (perfiles) | Reputación completa: promedio, estrellas, cantidad y comentarios paginados. |

## Cómo se conecta

- **Slot de la reserva.** `index.ts` registra `RateBookingCard` en `ratingsAndIncidents` con
  `slots.register(...)`. El *slot* admite **un solo** componente, así que
  `src/features/incidents/index.ts` registra encima `TrustSection` (la tarjeta «Calificar» más la
  sección de incidencias). Si solo se importa esta feature, queda registrada la tarjeta sola.
- **Perfiles.** `ReputationSection` se pasa como `renderReputation` en las rutas
  `src/app/(tabs)/perfil/index.tsx` y `src/app/usuario/[id].tsx`.

## Reglas de la interfaz

- La tarjeta tiene cuatro estados: puede calificar, ya calificó, ventana vencida y «no aplica»
  (la reserva no concluyó: no se dibuja ni se consulta nada). El servidor decide: un 409 se explica y
  vuelve a consultar el estado.
- Los chips rápidos («Puntual», «Cuidó el objeto»…) **no** son datos: se añaden al texto del
  comentario (RF-10), que sigue limitado a 300 caracteres contando los chips.
- La hoja vive fuera del estado de la tarjeta: al enviar, la tarjeta pasa a «Tu calificación» y la
  hoja sigue abierta para mostrar «Gracias».

## Archivos

`types.ts` (zod) · `keys.ts` · `schemas.ts` (formulario y `buildComment`) · `api.ts` · `hooks.ts` ·
`errors.ts` · `components/` (`RatingSummary`, `RatingCard`, `RatingForm`, `RateBookingCard`,
`ReputationSection`, `RatingsList`). Textos en `src/i18n/ratings.ts`.
