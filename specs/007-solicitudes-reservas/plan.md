# Plan 007 — Solicitudes y reservas (móvil)

- **Spec:** `spec.md` · **Dueño:** MO-A · **Contrato:** `backend/api/paths/bookings.yaml`

## 1. Estructura
```
src/features/bookings/
  api.ts · types.ts · keys.ts · schemas.ts · rules.ts (acciones por rol/estado, límites de fechas)
  hooks.ts (useQuote, useBooking, useMyBookings, useRequestBooking, useAccept, useReject, useCancel, useMeetingPoint)
  components/{StatusBadge, QuoteSummary, DateRangePicker, PaymentModePicker, BookingCard, ExpiryCountdown, BookingActions, MeetingPointCard}.tsx
  screens/{RequestScreen, ActivityScreen, BookingDetailScreen}.tsx
  slots.ts (puntos de extensión del detalle)
src/app/(tabs)/actividad/index.tsx · src/app/reserva/[id].tsx · src/app/solicitar/[itemId].tsx
src/i18n/bookings.ts (+ reexport)
```

## 2. Contrato consumido
`GET /items/{id}/quote`, `POST /bookings`, `GET /bookings/{id}`, `GET /me/bookings`, `POST /bookings/{id}/accept|reject|cancel|meeting-point`. Tipos `Quote`, `Booking` (ver backend plan 007 §2). Estados: `pending|accepted|rejected|expired|cancelled|in_progress|completed`.

## 3. Decisiones
| # | Decisión | Art. |
|---|---|---|
| P-01 | Fechas como cadenas `YYYY-MM-DD`; **no** se convierten a `Date` con zona del teléfono; utilidades `addDays`, `diffDaysInclusive` puras | V |
| P-02 | `rules.ts` define qué acciones se muestran por `viewerRole` y `status`; el servidor sigue siendo la autoridad | III |
| P-03 | `useQuote` se vuelve a ejecutar al cambiar fechas/modo (con *debounce* corto) y se invalida antes de enviar | IV |
| P-04 | `slots.ts` exporta un registro tipado de secciones (`chat`, `deliveryAndPayments`, `ratingsAndIncidents`); 008/009/010 **registran** su componente con una línea en su propio `index.ts` y el detalle las pinta en orden | XIII |
| P-05 | Cuenta regresiva basada en `expiresAt` del servidor (no en el reloj local para decidir; solo para mostrar) | — |
| P-06 | Datos de reserva son el cache de verdad; las acciones hacen `setQueryData` con la respuesta y luego invalidan listas | IV |
| P-07 | Todos los textos de política salen del `Quote.policy` del servidor | III |

## 4. Pruebas
Utilidades de fechas, `rules.ts` (matriz rol × estado), `QuoteSummary`, `RequestScreen` (cotizar, conflicto, enviar), `BookingActions`, lista de Actividad (segmentos, paginación), cuenta regresiva con reloj falso.

## 5. Verificación de constitución
| Art. | Cumple |
|---|---|
| III | Reglas en `rules.ts`, no en componentes |
| IV | Cliente central; invalidación de claves |
| V | Dinero en centavos; fechas de calendario |
| X | Estados de carga/error/vacío; tokens |
| XIII | *Slots* para no editar archivos ajenos |
