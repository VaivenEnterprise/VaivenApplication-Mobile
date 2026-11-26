# Solicitud de acceso a producción — borrador (spec 013, T010)

**Estado: borrador preparado; no enviar antes de cumplir los 14 días.** Los huecos marcados **[por llenar]** se completan con la evidencia real de la prueba (testers, comentarios, cambios); no se inventa nada. Las preguntas exactas están en Play Console → Producción → *Solicitar acceso a producción* → «Vista previa de las preguntas»; si cambian, se adaptan estas respuestas.

## Condiciones para enviarla

- [ ] Play Console muestra la prueba cerrada **completada: 12 testers durante 14 días** (el 18 nov llevaba 2 días; día 14 estimado ≈ 29 nov). El 26 nov la lista «Vaiven Testers» tenía 26 usuarios (según la persona responsable).
- [ ] Ficha y declaraciones completas sin advertencias (T007 marcada hecha el 26 nov). **Antes de producción:** declarar en «Seguridad de datos» las fotos enviadas al proveedor de IA y el historial de objetos vistos (recomendaciones).
- [ ] Páginas legales de la landing aprobadas por revisión humana (L001-T011) y enlazadas en la ficha.
- [ ] Versión candidata **`1.1.2`** (ya subida a la prueba cerrada el 26 nov) compilada con la API en `https://vaiven-staging.westus2.cloudapp.azure.com:8443`, que la persona responsable usa como producción, y `/readyz` verde. La versión `1.0.0` de la spec quedó superada (D-226 y D-227).

## Respuestas (copiar y completar)

### 1. ¿Cómo reclutaron a los testers de la prueba cerrada?

Reunimos a **[por llenar: número]** personas con cuenta de Google entre familiares, amistades y comunidades cercanas al proyecto, a las que se les envió una invitación con instrucciones por escrito (aceptar la invitación, instalar la app, no salirse del programa y abrirla al menos una vez por semana). Para el requisito de 12 testers, mantuvimos un seguimiento diario de los inscritos y repusimos a quienes se salieron el mismo día.

### 2. ¿Qué participación tuvieron los testers?

**[por llenar con datos reales: testers inscritos por día (de `seguimiento.md`), cuántos abrieron la app, qué funciones probaron: registro, búsqueda, publicar con fotos, solicitud, chat, entrega y devolución con QR, calificaciones.]**

### 3. Resumen de los comentarios recibidos y cómo los recopilamos

Recopilamos comentarios por correo (vaivenedeltrabajo@gmail.com) y mensajes directos. **[por llenar: resumen honesto de los comentarios y de los problemas reportados.]**

### 4. Cambios hechos a partir de los comentarios

Cada hito se subió a la pista cerrada como versión nueva con notas (por ejemplo, 0.2.0 «Íconos de Vaivén», publicada el 13 nov). **[por llenar: lista de cambios derivados de comentarios, con versión y fecha.]** Entre las mejoras de calidad previas a la solicitud: aviso de «Sin conexión» con recuperación automática, revisión de accesibilidad y de seguridad, y pruebas automatizadas del recorrido principal.

### 5. ¿A quién va dirigida la app y qué valor aporta?

A personas **mayores de 18 años** de una misma comunidad que quieren prestar o encontrar objetos de uso cotidiano (herramientas, equipos y artículos) sin comprarlos. La app conecta a las dos partes, permite acordar por chat, registrar el estado del objeto con fotos y confirmar la entrega y la devolución con un código QR, y calificar al final. Vaivén no procesa pagos.

### 6. ¿Por qué consideran que la app está lista para producción?

- Recorrido principal probado de punta a punta: solicitud, aceptación, entrega con QR, devolución y calificación (prueba automatizada en el repositorio y recorrido manual **[por llenar: fecha y resultado]**).
- Moderación de contenido de usuarios: reportes dentro de la app y filtro de texto.
- Eliminación de cuenta dentro de la app y por URL; aviso de privacidad y términos publicados.
- Revisión de seguridad del repositorio sin hallazgos bloqueantes (`docs/seguridad.md`); permisos mínimos y ubicación solo aproximada.
- Nivel de API objetivo 36, el que Google Play exige desde el 31 de agosto de 2026 (valor por defecto de Expo SDK 58 / React Native 0.88; **confirmar** en la pestaña de la versión de Play Console).

## Registro del envío (administrador)

| Dato | Valor |
|---|---|
| Fecha y hora del envío | **[por anotar]** |
| Respuesta de Google (fecha y texto) | **[por anotar]** |
| Cambios que pidió Google | **[por anotar]** |
