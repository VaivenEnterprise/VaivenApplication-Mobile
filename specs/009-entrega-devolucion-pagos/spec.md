# Spec 009 — Entrega, devolución y pagos (móvil)

- **Dueño:** MO-A · **Prioridad:** P0 · **Ventana:** 13–17 nov · **Depende de:** 004, 007 (móvil) y contrato 009 (backend)
- **Constitución:** v1.2.0 · **Estado:** Borrador

## 1. Objetivo y por qué
Cerrar el ciclo físico: dejar **evidencia** del estado del objeto, **confirmar** la entrega y la devolución escaneando un QR, y registrar quién pagó y quién recibió. Es lo que da confianza a la plataforma.

## 2. Historias
| # | Prio. | Historia |
|---|---|---|
| H-01 | P0 | Como propietario, quiero registrar el estado del objeto con fotos antes de entregarlo, para dejar constancia. |
| H-02 | P0 | Como propietario, quiero mostrar un QR, y como solicitante, escanearlo para confirmar que recibí el objeto. |
| H-03 | P0 | Como solicitante, quiero registrar el estado y mostrar un QR al devolver, y como propietario, escanearlo para confirmar la devolución. |
| H-04 | P1 | Como participante, quiero reportar y confirmar pagos por etapa, para llevar cuentas claras. |
| H-05 | P1 | Como participante, quiero ver una línea de tiempo de lo ocurrido, para saber en qué punto estamos. |

## 3. Requisitos
| ID | Requisito |
|---|---|
| RF-01 | Se registran **secciones** en el detalle de la reserva (`deliveryAndPayments`): «Entrega», «Devolución», «Pagos» y «Línea de tiempo», visibles según estado (`accepted`, `in_progress`, `completed`). |
| RF-02 | **Evidencia** (`EvidenceForm`): notas de estado (≤ 500) y hasta 5 fotos con `PhotoPicker` (`purpose: evidence`); `PUT /bookings/{id}/{delivery|return}/evidence`; editable hasta confirmar; las fotos se ven con URL firmada. |
| RF-03 | **Quién hace qué**: en la **entrega** el propietario registra evidencia y muestra el QR, y el solicitante escanea; en la **devolución** es al revés. La UI muestra solo la acción que le corresponde a cada rol. |
| RF-04 | **Mostrar QR** (`QrDisplay`): `POST …/qr` genera token; se dibuja `qrPayload` con `react-native-qrcode-svg`, con cuenta regresiva de 15 min, botón «Generar nuevo» al expirar. |
| RF-05 | **Escanear QR** (`QrScanner`): `expo-camera` con permiso al usarse; lee `vaiven://qr?b=&s=&t=`, valida que `b` y `s` correspondan a la reserva y etapa abiertas y llama `POST …/confirm {token}`; solo acepta el primer código válido (evita lecturas repetidas). Alternativa: ingresar el código manualmente (texto) si la cámara no está disponible. |
| RF-06 | Resultados del escaneo: éxito (la reserva pasa a `in_progress` o `completed`), QR vencido/usado/no corresponde, sin permiso de cámara; mensajes en español y acción de reintento. |
| RF-07 | **Pagos**: por etapa (`delivery`/`return`) se ve el monto y el estado; el solicitante pulsa «Ya pagué» (`report`) y el propietario «Recibí el pago» (`confirm`). Aclaración visible: «Vaivén no procesa pagos; se pagan entre ustedes». |
| RF-08 | Avisos de **retraso**: si `isLate`, banner con días de retraso y ajuste registrado (solo informativo). Si la reserva está `affectedBy` otra, banner explicativo. |
| RF-09 | **Línea de tiempo**: solicitud, aceptación, evidencia de entrega, entrega confirmada, evidencia de devolución, devolución confirmada, pagos, a partir de los campos de `Booking`. |
| RF-10 | Tras cada acción se refresca la reserva (`setQueryData` + invalidación) sin recargar la pantalla. |
| RF-11 | Los códigos QR y tokens no se escriben en logs ni se guardan en almacenamiento. |
| RNF-01 | Escaneo en < 2 s en un teléfono de gama media con buena luz. |
| RNF-02 | Cobertura ≥ 80 % en analizador de QR, reglas de rol/etapa y formularios. |

## 4. Criterios de aceptación
| ID | Dado / Cuando / Entonces |
|---|---|
| CA-01 | Dada una reserva aceptada, el propietario registra evidencia y genera el QR; el solicitante lo escanea y la reserva pasa a «en curso». |
| CA-02 | Dado un QR de otra reserva, entonces el escáner lo rechaza con mensaje claro. |
| CA-03 | Dado un QR vencido, entonces se indica y el propietario puede generar otro. |
| CA-04 | Dada una devolución, el solicitante muestra el QR y el propietario escanea; la reserva pasa a «concluida». |
| CA-05 | Dado el rol solicitante en la entrega, entonces no ve «Generar QR». |
| CA-06 | Dado un pago por etapa, entonces el solicitante reporta y el propietario confirma. |
| CA-07 | Dada una cámara sin permiso, entonces puedo ingresar el código manualmente. |

## 5. Fuera de alcance
Procesar pagos en la app, firmas digitales, geolocalización de la entrega, evidencia en video.

## 6. Preguntas abiertas
- [NEEDS CLARIFICATION: ¿Es necesario el ingreso manual del código? Provisional: sí, como respaldo.]
