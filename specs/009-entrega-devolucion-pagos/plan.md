# Plan 009 — Entrega, devolución y pagos (móvil)

- **Spec:** `spec.md` · **Dueño:** MO-A · **Contrato:** `backend/api/paths/handover.yaml`

## 1. Estructura
```
src/features/handover/
  api.ts · types.ts · keys.ts · qr.ts (parseo y validación del payload) · roles.ts (quién hace qué)
  hooks.ts (useStage, useSaveEvidence, useIssueQr, useConfirmQr, useReportPayment, useConfirmPayment)
  components/{StageSection, EvidenceForm, EvidenceGallery, QrDisplay, QrScanner, ManualCodeEntry, PaymentsSection, LateBanner, Timeline}.tsx
  screens/{EvidenceScreen, ScanScreen, QrScreen}.tsx
  index.ts (registra el slot deliveryAndPayments)
src/app/entrega/[bookingId]/{evidencia,qr,escanear}.tsx   # parámetro `stage=delivery|return`
src/i18n/handover.ts (+ reexport)
```
> `reserva/[id].tsx` es archivo de 007; para no convertirlo en carpeta, las pantallas de 009 viven en `src/app/entrega/[bookingId]/`.

## 2. Contrato consumido
`PUT /bookings/{id}/{delivery|return}/evidence`, `POST …/qr`, `POST …/confirm`, `GET …`, `POST /bookings/{id}/payments/{stage}/report|confirm`. Tipos `Stage`, `Adjustment` y campos de `Booking` (`delivery`, `return`, `isLate`, `adjustments`, `affectedBy`).

## 3. Decisiones
| # | Decisión | Art. |
|---|---|---|
| P-01 | `roles.ts` es una función pura `(stage, viewerRole) → {canRecordEvidence, canShowQr, canScan}`; los componentes solo consultan | III |
| P-02 | `qr.ts` parsea con `expo-linking`/`URL` estándar y valida esquema `vaiven://qr`, `b`, `s`, `t`; devuelve error tipado por causa | VI |
| P-03 | `QrScanner` usa `CameraView` con `onBarcodeScanned` y un *latch* (`useRef`) para procesar un solo código y reactivarse tras un error | — |
| P-04 | No se agrega `expo-keep-awake` (no aprobada): si la pantalla se bloquea, el QR sigue vigente 15 min y se puede «Generar nuevo» | II.4 |
| P-05 | Ni el token ni el payload se guardan en estado persistente ni en logs; viven en memoria del componente | VI |
| P-06 | La sección se registra en el *slot* `deliveryAndPayments` de 007 con una línea | XIII |
| P-07 | Evidencia con `RemoteImage` en modo privado (sin caché persistente) | VI |
| P-08 | Línea de tiempo construida desde `Booking` (`statusHistory` si existe, si no, campos conocidos) | — |

## 4. Pruebas
`qr.ts` (válido, esquema erróneo, reserva distinta, etapa distinta), `roles.ts` (matriz completa), `QrScanner` (un solo disparo, permiso negado), `QrDisplay` (cuenta regresiva y expiración con reloj falso), `EvidenceForm`, pagos (reportar/confirmar por rol), `Timeline`.

## 5. Verificación de constitución
| Art. | Cumple |
|---|---|
| II.4 | Solo `expo-camera`, `react-native-qrcode-svg`, `react-native-svg` (aprobadas) |
| III | Reglas de rol en función pura |
| VI | Tokens QR solo en memoria; evidencia sin caché persistente |
| X | Estados, permisos y tokens de diseño |
| XIII | *Slot* sin editar el detalle de 007 |
