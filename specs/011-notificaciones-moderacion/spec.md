# Spec 011 — Notificaciones y moderación (móvil)

- **Dueño:** MO-B · **Prioridad:** P1 (solo el push es recortable) · **Ventana:** 17–19 nov · **Depende de:** 003, 007, 008 (móvil) y contrato 011 (backend)
- **Constitución:** v1.2.0 · **Estado:** Borrador

## 1. Objetivo y por qué
Que las personas se enteren de lo que pasa (centro de avisos y notificaciones push que abren la pantalla correcta) y puedan **reportar** contenido inapropiado, entendiendo por qué se rechaza un texto.

## 2. Historias
| # | Prio. | Historia |
|---|---|---|
| H-01 | P1 | Como persona usuaria, quiero ver una lista de avisos y cuántos no he leído. |
| H-02 | P2 | Como persona usuaria, quiero recibir notificaciones push y que, al tocarlas, me lleven a la pantalla correcta. |
| H-03 | P1 | Como persona usuaria, quiero reportar un objeto, un mensaje o un perfil. |
| H-04 | P1 | Como persona usuaria, quiero saber por qué se rechazó mi texto, para corregirlo. |

## 3. Requisitos
| ID | Requisito |
|---|---|
| RF-01 | **Centro de notificaciones** `notificaciones` (accesible desde Perfil, *slot* `renderExtraRows`): lista paginada (`GET /me/notifications`), no leídas destacadas, tocar abre el destino y marca leída; «Marcar todas como leídas». |
| RF-02 | Insignia de no leídos en la fila del Perfil (`GET /me/notifications/unread-count`, actualizada cada 60 s en primer plano y al volver a la app). |
| RF-03 | **Push**: tras iniciar sesión, la app pide permiso con una pantalla previa que explica el beneficio; si lo concede, obtiene el token de Expo (`expo-notifications`, `expo-device`) y lo registra (`POST /me/push-tokens`); al cerrar sesión lo elimina. En emulador o sin permiso, la app funciona sin push. |
| RF-04 | Canal de notificaciones de Android «Vaivén» y manejo en primer plano (banner dentro de la app sin interrumpir flujos de escaneo). |
| RF-05 | **Navegación profunda**: al tocar una notificación (app abierta, en segundo plano o cerrada), se abre el destino según `data` (`bookingId` → `reserva/[id]`, `conversationId` → `chat/[id]`, `incidentId` → `incidencia/[id]`, `itemId` → `objeto/[id]`); si el destino no existe o no hay permiso, se abre el centro de avisos. |
| RF-06 | **Reportar**: acción «Reportar» en el detalle del objeto (slot `renderOwnerExtras`), en mensajes del chat (pulsación larga) y en el perfil público; hoja con motivo (`prohibited_content`, `inappropriate`, `spam`, `other`) y detalles ≤ 500; `POST /reports`. |
| RF-07 | **Rechazos de moderación**: ante `400 content_not_allowed`, se muestra «No se puede publicar: contenido de la categoría X» con el motivo en español y una opción «Reportar esta decisión» (`targetType: moderation_decision`) para seguimiento manual. Es un componente reutilizable `ModerationNotice`. |
| RF-08 | Los avisos de «contenido retirado» y «sanción aplicada» se muestran con su texto y, si procede, enlace a la incidencia. |
| RF-09 | Preferencias: solo un interruptor «Notificaciones push» que registra o elimina el token. |
| RF-10 | Las pantallas siguen el diseño de §7. |
| RNF-01 | Sin datos personales en el cuerpo del push que la app no mostraría dentro de ella. |
| RNF-02 | Cobertura ≥ 80 % en el traductor de `data` → ruta y en el flujo de permisos. |

## 4. Criterios de aceptación
| ID | Dado / Cuando / Entonces |
|---|---|
| CA-01 | Dado un aviso `booking_accepted`, cuando lo toco, entonces abro esa reserva y el aviso queda leído. |
| CA-02 | Dada la app cerrada y una push de mensaje, cuando la toco, entonces abre el chat. |
| CA-03 | Dado un permiso negado, entonces la app sigue funcionando y el interruptor lo indica. |
| CA-04 | Dado un texto prohibido, entonces veo categoría y motivo y puedo reportar la decisión. |
| CA-05 | Dado un reporte duplicado, entonces veo «Ya lo reportaste». |
| CA-06 | Dado el cierre de sesión, entonces el token se elimina del servidor. |

## 5. Fuera de alcance
Preferencias por tipo de aviso, notificaciones locales programadas, correos, sonidos personalizados.

## 6. Preguntas abiertas
- [NEEDS CLARIFICATION: ¿pantalla previa de permiso al primer inicio o al primer evento relevante? Provisional: tras el primer inicio de sesión.]

## 7. Diseño de pantallas

Lenguaje y reglas generales: spec 002 §9. Textos desde `src/i18n/notifications.ts` y `reports.ts`.

### 7.1 Avisos (`notificaciones`)
- **Encabezado:** «Volver», «Avisos» y un botón de ícono «Marcar todas» (doble check, con etiqueta accesible). Debajo, una fila `ListRow` «Avisos en el teléfono» con interruptor (RF-09); con el permiso negado muestra «Desactivados» y un `link` «Abrir ajustes».
- **Lista agrupada por día** («Hoy», «Ayer», fecha) con `NotificationRow`: `IconBadge` por tipo (solicitud: mano · mensaje: burbuja · entrega: caja · incidencia: bandera · objeto: etiqueta · sistema: campana), título de una línea, una línea de detalle y la hora. No leída: título en negrita, punto `primary` y fondo `primarySoft` tenue.
- **Contenido retirado y sanción** (RF-08): ícono en `dangerSoft`; al abrir, una tarjeta con el texto y el `link` «Ver incidencia».
- **Estados:** `Skeleton` de filas · vacío con campana «Todo al día» · error con reintento.

### 7.2 Permiso de push (pantalla previa, una sola vez)
`BottomSheet` alto sobre `GradientBackground`: `IconBadge` grande de campana, título «Entérate al instante» y tres filas con ícono y **una palabra** («Solicitudes», «Mensajes», «Entregas»). Botón «Activar avisos» (`primary`) y `link` «Ahora no». Si se niega, la app sigue igual.

### 7.3 Aviso dentro de la app (primer plano)
`Banner` flotante superior de 56 pt con `IconBadge`, título y una línea; se oculta a los 4 s o al deslizarlo; no aparece durante el escaneo de QR.

### 7.4 Reportar (`ReportSheet`, `BottomSheet`)
Título «Reportar». Cuatro motivos como filas de selección única («Contenido prohibido», «Inapropiado», «Spam», «Otro») y campo «Detalles (opcional)» de hasta 500. Botón «Enviar». Éxito: check y «Gracias, lo revisaremos». Duplicado: `Banner` `info` «Ya lo reportaste».

### 7.5 Aviso de moderación (`ModerationNotice`)
Tarjeta en `dangerSoft` con ícono de escudo, título «No se puede publicar», `Chip` con la categoría, el motivo en una línea y `link` «Reportar esta decisión».
