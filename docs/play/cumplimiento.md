# Cumplimiento para Play Console — respuestas para copiar (spec 013, T006)

Respuestas preparadas a partir del código de la app (`app.config.ts`, specs 003 a 012) y del aviso de privacidad de la landing (`vaiven-landing-page/privacidad`, **borrador pendiente de revisión legal**, L001-T011). Si el aviso cambia, este documento cambia con él (CA-04). Sin contraseñas ni claves. Las filas «por confirmar» las decide la persona administradora al llenar el formulario.

## 1. Seguridad de los datos

Cifrado en tránsito: **sí**. Todo el tráfico va por `request` y en `EXPO_PUBLIC_APP_ENV=production` la app exige una URL `https` (`src/lib/config.ts`). Solicitud de borrado: **sí** (dentro de la app y por URL).

| Dato (categoría de Play) | Qué es | ¿Recopilado? | ¿Compartido? | Finalidad | ¿Opcional? | Borrado |
|---|---|---|---|---|---|---|
| Información personal: correo | Correo de la cuenta | Sí | No¹ | Funciones de la app, administración de la cuenta, comunicación | Obligatorio | Con la cuenta |
| Información personal: nombre | Nombre visible | Sí | No¹ | Funciones de la app | Opcional | Con la cuenta |
| Información personal: teléfono | Contacto entre las partes | Sí | No¹ | Funciones de la app | Opcional | Con la cuenta |
| Ubicación aproximada | Zona para mostrar objetos cercanos; **nunca precisa** (Android bloquea `ACCESS_FINE_LOCATION`) | Sí | No¹ | Funciones de la app | Opcional | Con la cuenta |
| Fotos | Fotos de objetos y evidencia de entrega y devolución | Sí | No¹ | Funciones de la app | Obligatorio para publicar o registrar evidencia | Al borrar el objeto o la cuenta (la evidencia de incidencias se conserva anonimizada) |
| Fotos (v1.1, solo con IA activa): primera foto del objeto enviada a un proveedor de IA | Foto de portada, **solo cuando la persona toca «Sugerir con IA»** al publicar, para proponer título y categoría | Sí (a petición) | **Sí²** (proveedor de IA) | Funciones de la app | **Opcional**: publicar funciona igual sin usarla | VAIVÉN no guarda la foto enviada ni la respuesta del modelo (solo un contador de uso por persona y día) |
| Actividad en la app (v1.1, con recomendaciones activas): objetos vistos | Identificador del objeto abierto y fecha (no el texto ni la ubicación), para «Recomendado para ti» | Sí | No¹ | Personalización | Se genera al abrir un objeto ajeno; la persona puede **borrarlo** en Perfil | **90 días**, o antes al borrar el historial desde Perfil (RF-04) |
| Mensajes en la app | Chat de una reserva | Sí | No¹ | Funciones de la app | Opcional | Con la cuenta (anonimizado) |
| Contenido de la persona usuaria: calificaciones, reportes e incidencias | Evaluaciones y reportes de contenido | Sí | No¹ | Funciones de la app, seguridad | Opcional | Anonimizado |
| Identificadores: token de notificaciones | Envío de avisos push sobre reservas | Sí | No¹ | Funciones de la app | Opcional (se puede negar el permiso) | Se da de baja al cerrar sesión |
| Diagnóstico / registros técnicos | Datos técnicos de peticiones (id de petición, errores) | Sí | No¹ | Seguridad, depuración | Obligatorio | Hasta 90 días |

¹ Los proveedores técnicos (base de datos, almacenamiento de imágenes, hosting, notificaciones) tratan los datos en nombre de VAIVÉN como proveedores de servicio, lo que Play no cuenta como «compartir». Entre personas usuarias, el contenido de una reserva (fotos, mensajes, calificaciones) lo ve la contraparte por diseño de la función. **Por confirmar** con quien llena el formulario.

² **v1.1 (spec 014, T006).** La foto sale de VAIVÉN hacia un proveedor de IA (hoy OpenRouter, con un modelo gratuito con visión; ver backend spec 014 RF-03) y ese proveedor la procesa conforme a sus propias condiciones, así que **se declara como compartida**, con finalidad «Funciones de la app», **opcional** y **a petición de la persona**. Si Play Console permite marcarla como procesamiento de un proveedor de servicio, lo decide quien llena el formulario. **Por confirmar** con quien llena el formulario y con la revisión legal. Este cambio debe publicarse en «Seguridad de los datos» **antes de subir la v1.1** (la 1.0 no envía fotos a ningún proveedor de IA).

No se recopila: contactos, SMS, micrófono, historial de navegación fuera de la app (el historial de objetos vistos dentro de la app se declara arriba), datos financieros, datos de salud, ID de publicidad.

## 2. Clasificación de contenido (cuestionario IARC) — respuestas sugeridas

- Violencia, sexo, lenguaje fuerte, drogas, juego: **no**.
- Contenido generado por usuarios: **sí** (publicaciones con fotos y chat) con **reportes dentro de la app y filtro de contenido no permitido** (spec 011).
- Interacción entre usuarios: **sí** (chat de una reserva).
- Compartir ubicación: **por confirmar**: la app usa una zona aproximada solo para mostrar objetos cercanos y la zona aproximada del objeto a la contraparte.
- Compras o funciones financieras: **no**; VAIVÉN no procesa pagos.

## 3. Público objetivo y contenido

- Público objetivo: **solo adultos, 18 años o más** (aviso de privacidad §8 y términos). No es una app para niños ni familias.
- Anuncios: **no** (la app no incluye anuncios ni SDK de publicidad).
- Compras en la app: **no**.
- Tipo de app: no es de noticias, salud, finanzas, gobierno ni de citas.

## 4. Permisos y justificación

| Permiso | Para qué | Cuándo se pide | Texto que ve la persona |
|---|---|---|---|
| Cámara | Escanear el QR de entrega y devolución, y tomar fotos de objetos | Al usarla | «Vaivén usa la cámara para escanear códigos QR y tomar fotos de tus objetos.» |
| Fotos (selector) | Elegir imágenes de los objetos | Al elegir fotos | «Vaivén accede a tus fotos para que elijas las imágenes de tus objetos.» |
| Ubicación aproximada | Mostrar objetos cercanos | Al usar la búsqueda por cercanía | «Vaivén usa tu ubicación aproximada para mostrarte objetos cerca de ti.» |
| Notificaciones | Avisos de reservas, mensajes y moderación | Tras iniciar sesión se muestra una pantalla previa que explica los avisos; el diálogo del sistema solo aparece si la persona decide activarlos (o desde el interruptor del centro de avisos) | Diálogo del sistema; se puede negar y la app sigue funcionando |
| Micrófono / audio | **No se usa** (`recordAudioAndroid: false`, `microphonePermission: false`) | — | — |
| Ubicación precisa | **No se usa** (bloqueada) | — | — |

Sin permisos sensibles de segundo plano ni de llamadas ni SMS. **Archivos:** el manifiesto efectivo de Android que resuelve Expo todavía incluye `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE` y `SYSTEM_ALERT_WINDOW` (auditoría de 2026-11-26) aunque la app no los declara ni los usa; la spec 021-T012 los bloquea y, al cerrarla, este párrafo vuelve a afirmar «sin archivos amplios» solo si `npx expo config --type introspect` lo confirma. Hasta entonces no se declara a Play lo contrario de lo que trae el manifiesto.

## 5. Eliminación de cuenta

- Dentro de la app: **Perfil → Eliminar cuenta**, con contraseña (spec 003, RF-08).
- Por URL: `https://vaiven-landing.onrender.com/eliminar-cuenta/` (borrador pendiente de revisión legal; no entregar a Play hasta que L001-T011 la apruebe).
- Condición: no se puede eliminar con reservas activas. Los datos se anonimizan; reservas, evidencia e incidencias se conservan sin datos identificables.

## 6. Contenido generado por usuarios (política de Play)

- **Reportar** objetos y mensajes dentro de la app («Reportar este objeto», pulsación larga en un mensaje) y **reportar una decisión** del filtro (spec 011).
- **Filtro de texto** al publicar y al chatear (categorías de contenido no permitido), con aviso a quien escribe.
- **Moderación:** las incidencias llegan a la administración (`admin.demo@…` en demo; cola de incidencias en el backend).
- Bloqueo de personas: **no existe** en la 1.0; no declararlo.

## 7. Acceso para revisión (RF-06)

La app exige iniciar sesión. Instrucciones para *Acceso a la app*:

1. Abre Vaivén e inicia sesión con el correo y la contraseña de la cuenta de revisión (los pone la persona administradora en Play Console; **no se guardan en el repositorio**).
2. Con esa cuenta se puede explorar objetos, abrir el detalle y ver el chat y las reservas.
3. Para recorrer la entrega con QR hacen falta dos cuentas; si el equipo de revisión lo necesita, se entrega una segunda.

La cuenta se crea **a mano en el backend de producción** con datos ficticios (P-05); no usar las cuentas del `seed` (staging) ni datos reales.

## 8. Coherencia con el aviso de privacidad (CA-04)

La tabla de §1 reproduce la del aviso (correo, nombre, teléfono, contraseña como huella cifrada, ubicación aproximada, fotos, **foto enviada al proveedor de IA a petición (v1.1)**, **objetos vistos para recomendar (v1.1)**, mensajes y reservas, calificaciones, reportes, token de notificaciones, datos técnicos). La contraseña no se declara aparte: es credencial, no se almacena en claro. **Pendiente:** comprobar de nuevo contra el aviso cuando la revisión legal lo cierre.

## 9. Inteligencia artificial en la v1.1 (spec 014, RF-06)

| Tema | Qué dice el aviso de privacidad de la landing (actualizado 2026-11-20) | Qué hace la app (spec 014) |
|---|---|---|
| Cuándo se envía la foto | Solo cuando la persona toca «Sugerir con IA» al publicar | Botón explícito, nunca automático; aviso «La foto se envía a un servicio de IA» bajo el botón |
| Qué se envía | La primera foto del objeto, a un proveedor de IA | La app manda solo el `publicId`; el servidor arma la miniatura (no acepta URL) |
| Qué se conserva | VAIVÉN no guarda la foto enviada ni la respuesta; solo un contador de uso | Sin imágenes ni respuestas del modelo guardadas (backend RF-07) |
| Voluntario | La publicación funciona igual sin usarla | Apagada o caída: no aparece el botón o muestra un error recuperable (CA-03) |

**Pendiente humano (administración, Play Console):** actualizar «Seguridad de los datos» (fila de fotos compartidas con un proveedor de IA, §1) y que la política de privacidad enlazada sea la página actualizada, **antes de subir el AAB 1.1**. No se hizo desde aquí. La revisión legal del aviso sigue pendiente (L001-T011).

## 10. Recomendaciones con ML en la v1.1 (spec 015, RF-06 · CA-05)

| Tema | Qué dice el aviso de privacidad de la landing (actualizado 2026-11-22) | Qué hace la app (spec 015) |
|---|---|---|
| Qué se guarda | El objeto que viste (solo identificadores) y la fecha; las solicitudes que has hecho también cuentan | Al abrir el detalle de un objeto **ajeno** envía un evento `view` (`POST /recommendations/events`), una vez por apertura, en segundo plano y sin mostrar errores; no envía texto ni ubicación |
| Cuánto tiempo | Hasta 90 días | El servidor borra los eventos a los 90 días (backend RF-09) |
| Con quién se comparte | Con nadie: el modelo es propio | No hay proveedor externo; por eso la fila de §1 va como **no compartido** (Personalización) |
| Borrado | Desde Perfil, «Borrar historial de recomendaciones»; vuelven los más populares | Fila con confirmación en Perfil (`DELETE /recommendations/history`); la fila de Explorar vuelve al arranque en frío (CA-03) |
| Voluntario | La app funciona igual sin recomendaciones | Función apagada o con error: la fila no se muestra y Explorar funciona igual (CA-04) |

**Pendiente humano (administración, Play Console):** agregar a «Seguridad de los datos» la fila de actividad en la app (§1) junto con la de IA (§9), y comprobar que la política de privacidad enlazada sea la página actualizada, **antes de subir el AAB 1.1**. No se hizo desde aquí. **Por confirmar** con quien llena el formulario si «Personalización» es la finalidad que Play Console le ofrece para este dato. La revisión legal del aviso sigue pendiente (L001-T011).
