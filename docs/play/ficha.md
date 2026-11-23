# Ficha de Google Play — textos para copiar (spec 013, T004)

Textos en español (es-MX) para Play Console. Coherentes con la landing (`vaiven-landing-page`) y con lo que la app hace hoy; sin promesas de pagos ni seguros. Los campos con **por decidir** esperan a la persona responsable. Nada sensible en este archivo.

## Datos generales

| Campo | Valor |
|---|---|
| Nombre de la app (≤ 30) | Vaivén |
| Idioma predeterminado | Español (México) – es-MX |
| Tipo / precio | Aplicación, gratuita |
| Categoría | **Estilo de vida** (provisional, por decidir) |
| Correo de contacto | vaivenedeltrabajo@gmail.com |
| Sitio web | https://vaiven-landing.onrender.com/ |
| Política de privacidad | https://vaiven-landing.onrender.com/privacidad/ (**no entregar a Play hasta que L001-T011 quite la etiqueta de borrador**) |
| Eliminación de cuenta | https://vaiven-landing.onrender.com/eliminar-cuenta/ (misma condición) |
| Paquete | `mx.vaiven.app` |

> Nota: en Play Console la app aparece hoy como «VaivenApp». Se puede renombrar a «Vaivén» en *Ficha de Play Store principal*; el nombre visible lo decide la ficha, no el paquete.

## Descripción breve (70 de 80 caracteres)

```
Presta, encuentra y comparte objetos con las personas de tu comunidad.
```

## Descripción completa (1583 de 4000 caracteres)

```
Las cosas van y vienen. Lo que hoy necesitas, alguien cerca de ti puede compartirlo. Con Vaivén prestas, encuentras y le das una nueva vida a los objetos de uso cotidiano con las personas de tu comunidad: herramientas, equipos y artículos que no usas todos los días.

QUÉ PUEDES HACER
• Encontrar objetos cerca de ti: busca por nombre o categoría y mira la zona aproximada donde están.
• Publicar tus objetos con fotos, una descripción y las fechas en que los compartes.
• Solicitar una reserva eligiendo las fechas y revisando el total antes de enviar la solicitud.
• Aceptar o rechazar las solicitudes que recibes.
• Platicar por chat con la otra persona para ponerse de acuerdo.
• Registrar el estado del objeto con fotos y notas en la entrega y en la devolución, y confirmarlas escaneando un código QR entre las dos personas.
• Calificar a la otra persona al terminar para que la comunidad sepa en quién confiar.
• Recibir avisos sobre tus reservas dentro de la app y en tu teléfono.

CONFIANZA Y SEGURIDAD
• Solo para personas mayores de 18 años.
• Tu ubicación es solo aproximada y nunca se pide la precisa.
• Puedes reportar objetos y mensajes, y la app filtra contenido no permitido.
• Puedes eliminar tu cuenta desde tu perfil.

IMPORTANTE
Vaivén no procesa pagos ni ofrece seguros: las personas acuerdan entre ellas cómo y cuándo se paga, y la app solo lleva el registro de la reserva, la entrega y la devolución.

Vaivén es una plataforma para personas físicas y está en una etapa temprana: tus comentarios nos ayudan a mejorarla. Escríbenos a vaivenedeltrabajo@gmail.com.
```

## Notas de la versión (≤ 500 caracteres)

**0.2.0 – Íconos de Vaivén** (156 caracteres; ya publicada el 13 nov):

```
Versión de prueba: nuevos íconos de Vaivén y mejoras de estabilidad. Cuéntanos qué falla o qué te gustaría que hiciera distinto: vaivenedeltrabajo@gmail.com
```

**Siguiente versión de prueba** (171 caracteres; ajustar a lo que realmente lleve la compilación):

```
Versión de prueba: mejoras de estabilidad, aviso de conexión y ajustes de accesibilidad. Gracias por probar Vaivén; tus comentarios nos ayudan: vaivenedeltrabajo@gmail.com
```

## Recursos gráficos

| Recurso | Archivo | Estado |
|---|---|---|
| Ícono 512×512 | `assets/store/icon-512.png` | Generado del ícono actual (provisional, RGB sin transparencia) |
| Gráfico de funciones 1024×500 | `assets/store/feature-1024x500.png` | Generado con el ícono, «Vaivén» y la frase de la landing; provisional (sin la ilustración de barrio de la spec §7) |
| Capturas de teléfono (≥ 4) | `assets/store/screenshots/` | **Pendiente**: las toma una persona con datos de `seed`, sin datos personales (spec §7: Inicio, Proyecto con mapa, Solicitar, Chat, QR de entrega; pie de ≤ 3 palabras) |

## Coherencia con la spec (revisión)

- Sin IA en la 1.0 (la IA es la v1.1, spec 014): la descripción no la menciona.
- Sin promesas de pagos ni seguros: el texto lo dice expresamente (la app no procesa pagos).
- Todas las funciones enlistadas existen en la app (specs 005 a 011).
