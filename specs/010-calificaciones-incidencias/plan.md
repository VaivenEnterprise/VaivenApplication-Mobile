# Plan 010 — Calificaciones e incidencias (móvil)

- **Spec:** `spec.md` · **Dueño:** MO-B · **Contrato:** `backend/api/paths/ratings.yaml`, `incidents.yaml`

## 1. Estructura
```
src/features/ratings/
  api.ts · types.ts · keys.ts · schemas.ts · hooks.ts
  components/{StarRating, RatingSummary, RatingForm, RatingCard, ReputationSection, RatingsList}.tsx
src/features/incidents/
  api.ts · types.ts · keys.ts · schemas.ts · rules.ts · hooks.ts
  components/{IncidentForm, IncidentCard, ReasonPicker, IncidentSection}.tsx
  screens/{ReportIncidentScreen, MyIncidentsScreen, IncidentDetailScreen}.tsx
src/app/incidencia/[id].tsx (reemplaza el marcador) · src/app/incidencia/nueva/[bookingId].tsx · src/app/incidencias.tsx
src/i18n/{ratings,incidents}.ts (+ reexport)
```
Cada feature tiene su `index.ts`, que registra los *slots* de 003 (`renderReputation`, `renderExtraRows`) y de 007 (`ratingsAndIncidents`) con una línea.

## 2. Contrato consumido
`POST /bookings/{id}/ratings`, `GET /bookings/{id}/rating-status`, `GET /users/{id}/ratings`, `POST /bookings/{id}/incidents`, `GET /incidents/{id}`, `GET /me/incidents`. Tipos `Rating`, `Incident` (backend plan 010 §2). Las rutas `/admin/*` **no** se usan en la app.

## 3. Decisiones
| # | Decisión | Art. |
|---|---|---|
| P-01 | `StarRating` es controlado/solo lectura, con `accessibilityRole="adjustable"` y valor textual | X |
| P-02 | `rules.ts` calcula si se ofrece «Reportar» según `status` y ventana de 72 h (informativo; el servidor decide) | III |
| P-03 | `RatingSummary` se exporta para 005 (`OwnerCard`) y 006 (`ItemCard` ya recibe `ratingAverage`) | XIII |
| P-04 | Evidencia con `PhotoPicker` (`purpose: evidence`) y `RemoteImage` privado | VI |
| P-05 | Promedio mostrado con 1 decimal; `null` → texto «Sin calificaciones» (no «0») | III |
| P-06 | Las notas ocultas del equipo nunca llegan a la app (las filtra el backend); la UI no asume su existencia | VI |

## 4. Pruebas
`StarRating` (valores, accesibilidad), `RatingForm` (validaciones, 409), visibilidad de «Calificar» por estado, `rules.ts` (ventana de 72 h), `IncidentForm` (motivo, descripción, fotos), detalle (abierta vs cerrada), perfil con y sin calificaciones.

## 5. Verificación de constitución
| Art. | Cumple |
|---|---|
| III | Reglas en `rules.ts` |
| VI | Evidencia privada |
| X | Accesibilidad de estrellas, estados vacíos |
| XIII | *Slots* y archivos por feature |
