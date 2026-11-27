# Inventario del contrato del backend en la app (spec 021, T031)

- **Hallazgo:** C-1 («la app no consume todo el contrato y no hay inventario»).
- **Requisitos:** RF-28 y RF-29 de `specs/021-remediacion-auditoria/spec.md`; criterio CA-12.
- **Fuente:** `../vaiven-backend/api/openapi.yaml` (solo lectura, Art. IV), **69 operaciones** al 2026-11-27.
- **Prueba:** `src/__e2e__/contract-coverage.test.ts` lee el contrato sin red y falla si una operación no figura en la tabla, si figura con un estado desconocido, si una fila no existe en el contrato, si una operación `/admin/*` no está fuera de alcance o si el archivo citado de una operación consumida no existe. Sin el contrato junto al repositorio se omite con un aviso (igual que `contract.test.ts`; define `VAIVEN_OPENAPI`).

## Estados

| Estado | Significa | Qué debe decir la tercera columna |
|---|---|---|
| `consumida` | La app la llama desde `lib/api` (`request`) | El archivo `src/...` que la llama |
| `fuera de alcance móvil` | La app no la llamará; se documenta el motivo | El motivo |
| `pendiente` | Debería consumirse, pero espera una decisión o una tarea | La tarea que la desbloquea |

Al agregar una operación al contrato, la prueba falla hasta que se clasifique aquí.

## Resumen

| Estado | Operaciones |
|---|---|
| consumida | 63 |
| fuera de alcance móvil | 6 (las de administración, RF-29) |
| pendiente | 0 (el asistente se implementó en T032, decisión de T020 del 2026-11-27) |

Las rutas de la identidad fuerte (backend 019: MFA, códigos de recuperación, sesiones) **no están en el contrato** porque esa spec es un borrador; no se listan ni se implementan hasta que se publiquen (T034, P-12).

## Operaciones

| Operación | Estado | Dónde / motivo |
|---|---|---|
| `GET /healthz` | consumida | `src/features/diagnostics/api/getHealth.ts` (pantalla de diagnóstico, solo desarrollo) |
| `GET /readyz` | consumida | `src/features/diagnostics/api/getHealth.ts` (pantalla de diagnóstico, solo desarrollo) |
| `GET /api/v1/meta` | consumida | `src/lib/api/serverFeatures.ts` |
| `POST /api/v1/auth/register` | consumida | `src/features/auth/api.ts` |
| `POST /api/v1/auth/login` | consumida | `src/features/auth/api.ts` |
| `POST /api/v1/auth/refresh` | consumida | `src/features/auth/api.ts` |
| `POST /api/v1/auth/logout` | consumida | `src/features/auth/api.ts` |
| `GET /api/v1/me` | consumida | `src/features/profile/api.ts` |
| `PATCH /api/v1/me` | consumida | `src/features/profile/api.ts` |
| `DELETE /api/v1/me` | consumida | `src/features/profile/api.ts` |
| `GET /api/v1/users/{id}` | consumida | `src/features/profile/api.ts` |
| `POST /api/v1/ai/listing-suggestions` | consumida | `src/features/ai-suggestions/api.ts` |
| `POST /api/v1/ai/assistant/messages` | consumida | `src/features/ai-suggestions/api.ts` (asistente de proyectos, T032) |
| `DELETE /api/v1/ai/assistant/conversations/{id}` | consumida | `src/features/ai-suggestions/api.ts` (asistente de proyectos, T032) |
| `GET /api/v1/recommendations` | consumida | `src/features/recommendations/api.ts` |
| `POST /api/v1/recommendations/events` | consumida | `src/features/recommendations/api.ts` |
| `DELETE /api/v1/recommendations/history` | consumida | `src/features/recommendations/api.ts` |
| `POST /api/v1/uploads/signature` | consumida | `src/features/images/api.ts` |
| `GET /api/v1/items` | consumida | `src/features/search/api.ts` |
| `POST /api/v1/items` | consumida | `src/features/items/api.ts` |
| `GET /api/v1/items/price-suggestion` | consumida | `src/features/items/api.ts` |
| `GET /api/v1/items/{id}` | consumida | `src/features/items/api.ts` |
| `PATCH /api/v1/items/{id}` | consumida | `src/features/items/api.ts` |
| `DELETE /api/v1/items/{id}` | consumida | `src/features/items/api.ts` |
| `POST /api/v1/items/{id}/pause` | consumida | `src/features/items/api.ts` |
| `POST /api/v1/items/{id}/resume` | consumida | `src/features/items/api.ts` |
| `GET /api/v1/me/items` | consumida | `src/features/items/api.ts` |
| `GET /api/v1/categories` | consumida | `src/features/items/api.ts` |
| `GET /api/v1/items/{id}/quote` | consumida | `src/features/bookings/api.ts` |
| `POST /api/v1/bookings` | consumida | `src/features/bookings/api.ts` |
| `GET /api/v1/bookings/{id}` | consumida | `src/features/bookings/api.ts` |
| `GET /api/v1/me/bookings` | consumida | `src/features/bookings/api.ts` |
| `POST /api/v1/bookings/{id}/accept` | consumida | `src/features/bookings/api.ts` |
| `POST /api/v1/bookings/{id}/reject` | consumida | `src/features/bookings/api.ts` |
| `POST /api/v1/bookings/{id}/cancel` | consumida | `src/features/bookings/api.ts` |
| `POST /api/v1/bookings/{id}/meeting-point` | consumida | `src/features/bookings/api.ts` |
| `GET /api/v1/conversations` | consumida | `src/features/chat/api.ts` |
| `GET /api/v1/conversations/unread-count` | consumida | `src/features/chat/api.ts` |
| `GET /api/v1/conversations/{id}/messages` | consumida | `src/features/chat/api.ts` |
| `POST /api/v1/conversations/{id}/messages` | consumida | `src/features/chat/api.ts` |
| `POST /api/v1/conversations/{id}/read` | consumida | `src/features/chat/api.ts` |
| `PUT /api/v1/bookings/{id}/delivery/evidence` | consumida | `src/features/handover/api.ts` |
| `POST /api/v1/bookings/{id}/delivery/qr` | consumida | `src/features/handover/api.ts` |
| `POST /api/v1/bookings/{id}/delivery/confirm` | consumida | `src/features/handover/api.ts` |
| `GET /api/v1/bookings/{id}/delivery` | consumida | `src/features/handover/api.ts` |
| `PUT /api/v1/bookings/{id}/return/evidence` | consumida | `src/features/handover/api.ts` |
| `POST /api/v1/bookings/{id}/return/qr` | consumida | `src/features/handover/api.ts` |
| `POST /api/v1/bookings/{id}/return/confirm` | consumida | `src/features/handover/api.ts` |
| `GET /api/v1/bookings/{id}/return` | consumida | `src/features/handover/api.ts` |
| `POST /api/v1/bookings/{id}/payments/{stage}/report` | consumida | `src/features/handover/api.ts` |
| `POST /api/v1/bookings/{id}/payments/{stage}/confirm` | consumida | `src/features/handover/api.ts` |
| `POST /api/v1/bookings/{id}/ratings` | consumida | `src/features/ratings/api.ts` |
| `GET /api/v1/bookings/{id}/rating-status` | consumida | `src/features/ratings/api.ts` |
| `GET /api/v1/users/{id}/ratings` | consumida | `src/features/ratings/api.ts` |
| `POST /api/v1/bookings/{id}/incidents` | consumida | `src/features/incidents/api.ts` |
| `GET /api/v1/incidents/{id}` | consumida | `src/features/incidents/api.ts` |
| `GET /api/v1/me/incidents` | consumida | `src/features/incidents/api.ts` |
| `GET /api/v1/admin/incidents` | fuera de alcance móvil | Back-office de moderación (RF-29, P-14): la app no incluye pantallas de administración |
| `POST /api/v1/admin/incidents/{id}/notes` | fuera de alcance móvil | Back-office de moderación (RF-29, P-14): la app no incluye pantallas de administración |
| `POST /api/v1/admin/incidents/{id}/close` | fuera de alcance móvil | Back-office de moderación (RF-29, P-14): la app no incluye pantallas de administración |
| `POST /api/v1/admin/users/{id}/sanctions` | fuera de alcance móvil | Back-office de moderación (RF-29, P-14): la app no incluye pantallas de administración |
| `GET /api/v1/me/notifications` | consumida | `src/features/notifications/api.ts` |
| `GET /api/v1/me/notifications/unread-count` | consumida | `src/features/notifications/api.ts` |
| `POST /api/v1/me/notifications/read` | consumida | `src/features/notifications/api.ts` |
| `POST /api/v1/me/push-tokens` | consumida | `src/features/notifications/api.ts` |
| `DELETE /api/v1/me/push-tokens` | consumida | `src/features/notifications/api.ts` |
| `POST /api/v1/reports` | consumida | `src/features/reports/api.ts` |
| `GET /api/v1/admin/reports` | fuera de alcance móvil | Back-office de moderación (RF-29, P-14): la app no incluye pantallas de administración |
| `POST /api/v1/admin/reports/{id}/resolve` | fuera de alcance móvil | Back-office de moderación (RF-29, P-14): la app no incluye pantallas de administración |
