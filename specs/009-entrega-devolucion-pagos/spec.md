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
| RF-12 | Mientras la pantalla del QR está abierta se vuelve a consultar la reserva cada 5 s (solo en primer plano) para detectar la confirmación de la otra persona y pasar al estado de éxito. |
| RF-13 | Las pantallas siguen el diseño de §7. |
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

## 7. Diseño de pantallas

Lenguaje y reglas generales: spec 002 §9. Textos desde `src/i18n/handover.ts`. Principio: **una sola acción por momento**; cada persona ve solo lo que le toca.

### 7.1 Sección «Entrega y devolución» en el detalle de la reserva
- **Rastreador de dos etapas** en una `Card`: «Entrega ●──○ Devolución»; la etapa confirmada lleva check en `secondary`.
- **Acción única** según rol y etapa, como `Button` `primary`: «Registrar estado» → «Mostrar QR» o «Escanear QR». Estado actual en un `Chip` («Falta registrar», «Listo para escanear», «Confirmada»). A quien no le toca actuar: línea `muted` con reloj, «Esperando a {nombre}».
- **Pagos** (`PaymentRow`, uno por etapa): ícono de moneda, «Al entregar $135», píldora (Pendiente `warning` · Reportado `primaryInk` · Confirmado `secondary`) y botón pequeño `outline` según rol: «Ya pagué» o «Recibí el pago». Una línea `caption` fija: «Se paga en persona. Vaivén no procesa pagos.»
- **Línea de tiempo:** fila plegada «Ver historial ›» que despliega una lista vertical de puntos con hora.
- **Avisos:** retraso → `Banner` `warning` «Devolución con {n} días de retraso»; reserva afectada → `Banner` `info` «Otra reserva se ve afectada».

### 7.2 Evidencia (`entrega/[bookingId]/evidencia`)
Encabezado con «Volver» y «Estado del objeto», y `ProgressBar` de dos pasos («1 de 2»: Evidencia → QR). Cuadrícula de 3 columnas con casillas cuadradas y «+» (hasta 5 fotos, contador «2/5»). Campo multilínea «Notas (opcional)». Botón fijo «Continuar», habilitado con al menos una foto o una nota.

### 7.3 Mostrar el QR (`entrega/[bookingId]/qr`)
- Fondo `authBackground` suave. `Card` central con el QR de 240 pt sobre blanco.
- Debajo, miniatura y título del objeto y un `Chip` temporizador «14:32» que pasa a `warning` bajo 2 minutos. Una línea: «Pídele que lo escanee».
- **Vencido:** el QR se atenúa con un velo y aparece «Generar nuevo».
- **Confirmado** (RF-12): pantalla de éxito con check grande en `secondary`, «Entrega confirmada» (o «Devolución confirmada») y botón «Listo».

### 7.4 Escanear el QR (`entrega/[bookingId]/escanear`)
- Cámara a pantalla completa con velo oscuro y una ventana de 260 pt con esquinas en `primary`. Arriba, «X»; abajo, `link` blanco «Escribir código».
- **Resultado** en `BottomSheet`: éxito (check `secondary`, «Entrega confirmada», «Listo») o error con ícono `danger` y una línea («Es de otra reserva», «Venció», «Ya se usó») y «Intentar de nuevo». Vibración corta al leer.
- **Sin permiso de cámara:** `EmptyState` de cámara tachada «Necesitamos la cámara», botón «Permitir» y `link` «Escribir código». **Código manual:** `BottomSheet` con un campo y «Confirmar».
