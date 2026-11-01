# Spec 013 — Publicación en Google Play (móvil)

- **Dueño:** MO-B (artefactos) + **administrador de la cuenta** (cuenta, testers, respuestas de Google) · **Prioridad:** P0 · **Ventana:** 29 oct–25 nov (estimada) · **Depende de:** 001–002 (inicio), 012 (cierre), landing L001
- **Constitución:** v1.2.0 · **Estado:** Borrador

> **Nota (2026-11-01):** el Art. XIV.1 de la constitución móvil deja la compilación y el despliegue de la app fuera de las specs de funcionalidad. Esta spec (Google Play) es la única excepción y queda **pendiente de revisión** por la persona responsable; `eas.json` y los perfiles los crea esta spec, ya no la 002.

## 1. Objetivo y por qué
Lograr que una **primera versión pública** de VAIVÉN llegue a producción en Google Play. La meta es el 20 de noviembre; el equipo compra la cuenta el **29–30 de oct**, la prueba cerrada va del **1 al 14 de nov**, la solicitud de producción es el **15 de nov** y la publicación se **estima 22–25 nov** (la revisión la controla Google). La versión 1.0 **no incluye IA**; la IA sale después como v1.1 (spec 014). Es una carrera contra reloj porque, para una cuenta personal nueva, Google exige una **prueba cerrada con al menos 12 testers durante 14 días seguidos** antes de dar acceso a producción, y después revisa la solicitud.

> Fuente: guías de 2026 (p. ej. [Choicely](https://www.choicely.com/blog/google-play-12-tester-rule)). Las reglas las define Google y pueden cambiar; **se confirman en Play Console** antes de planear con ellas.

## 2. Historias
| # | Prio. | Historia |
|---|---|---|
| H-01 | P0 | Como administrador, quiero la cuenta de desarrollador verificada y la app creada en Play Console, para empezar la prueba cerrada. |
| H-02 | P0 | Como equipo, queremos testers inscritos desde el 1 de nov, para cumplir los 14 días continuos. |
| H-03 | P0 | Como equipo, queremos que cada hito se suba como actualización, para que los testers prueben lo último. |
| H-04 | P0 | Como administrador, quiero responder la solicitud de producción con evidencia de la prueba, para que Google la apruebe. |
| H-05 | P0 | Como persona usuaria, quiero encontrar y descargar VAIVÉN en Google Play. |

## 3. Requisitos
| ID | Requisito |
|---|---|
| RF-01 | `eas.json` perfil `production`: **AAB** firmado, `autoIncrement` de `versionCode`, `EXPO_PUBLIC_API_URL` del backend de producción (backend 013); `app.config.ts` con `version`, `versionCode`, `package: mx.vaiven.app`, `targetSdkVersion` que cumpla el mínimo vigente de Google Play. |
| RF-02 | Firma: se usa **Play App Signing**; la clave de subida la gestiona EAS (`credentials`); **nunca** en el repositorio; copia de seguridad guardada por el administrador fuera de git. |
| RF-03 | **Recursos de la ficha:** ícono 512×512, gráfico de funciones 1024×500 y al menos 4 capturas de teléfono reales, sin datos personales. |
| RF-04 | **Textos de la ficha** en español: nombre «Vaivén», descripción breve (≤ 80) y completa (≤ 4000), categoría, correo de contacto, sitio web (landing) y **URL del aviso de privacidad**. |
| RF-05 | **Declaraciones de Play Console**, preparadas en `docs/play/cumplimiento.md`: seguridad de datos (datos recopilados, finalidad, cifrado en tránsito, solicitud de borrado), clasificación de contenido, público objetivo (**solo adultos 18+**), anuncios (ninguno), permisos sensibles con justificación (cámara, ubicación aproximada, notificaciones, fotos), **URL de eliminación de cuenta**, y declaración de contenido generado por usuarios (reportes y filtro de contenido dentro de la app). |
| RF-06 | **Acceso para revisión:** instrucciones y credenciales de una cuenta de prueba (sin datos reales) en la sección «Acceso a la app», porque la app requiere iniciar sesión. |
| RF-07 | **Prueba cerrada:** lista de ≥ 15 testers (meta 15–20 por posibles bajas), invitación enviada, instrucciones de aceptación por escrito y seguimiento diario de que sigan inscritos; el día 1 es el **1 de nov** (se mueve si la cuenta o el primer AAB se retrasan). |
| RF-08 | **Actualizaciones durante la prueba:** cada hito H1–H4 se compila y sube a la pista cerrada con notas de versión; se registra el número de versión y la fecha en `memoria.md`. |
| RF-09 | **Solicitud de acceso a producción** el 15 de nov (o apenas se cumplan los 14 días): respuestas preparadas en `docs/play/solicitud-produccion.md` (cómo se probó, comentarios recibidos, cambios hechos). |
| RF-10 | **Publicación:** versión final en producción (despliegue progresivo opcional), verificación en un teléfono real desde la ficha pública, y plan de reversión (pausar el despliegue y publicar corrección). |
| RF-11 | Cumplir los requisitos de calidad de Google: sin fallos al arrancar, permisos solicitados al usarse, enlaces de privacidad y eliminación de cuenta accesibles dentro de la app (pantalla de registro y perfil). |
| RNF-01 | El AAB pesa < 150 MB (límite de Play) y arranca sin errores en Android 8+ *(versión mínima provisional, sujeta a Expo SDK)*. |
| RNF-02 | Ningún secreto en el repositorio ni en el AAB. |

## 4. Criterios de aceptación
| ID | Dado / Cuando / Entonces |
|---|---|
| CA-01 | Dada la cuenta, entonces está verificada y la app «Vaivén» creada en Play Console. |
| CA-02 | Dada la prueba cerrada, entonces hay ≥ 12 testers inscritos desde el 1 de nov y se registra a diario. |
| CA-03 | Dada una actualización, entonces los testers la reciben y la versión queda anotada. |
| CA-04 | Dado el formulario de seguridad de datos, entonces coincide con el aviso de privacidad de la landing y con lo que la app recopila. |
| CA-05 | Dada la solicitud enviada el 15 de nov, entonces Google la recibe y queda anotada la respuesta. |
| CA-06 | Dada la app publicada, entonces la ficha pública abre y se instala en un teléfono real. |

## 5. Fuera de alcance
iOS/App Store, anuncios, compras dentro de la app, suscripciones, lanzamiento por país distinto de México, optimización avanzada de la ficha.

## 6. Preguntas abiertas
- Resuelto (28 oct): la cuenta **no existe**; se compra el 29–30 oct como **cuenta personal** (aplica la prueba cerrada). Nombre del desarrollador: Joseph Abrham Yañez Garcia. Correo de contacto: `vaivenedeltrabajo@gmail.com`.
- [NEEDS CLARIFICATION: ¿Quiénes serán los 15–20 testers y cómo se les asegura que sigan inscritos hasta el final? Aún no se sabe; reunirlos antes del 1 nov.]
- [NEEDS CLARIFICATION: categoría de la tienda (provisional: «Estilo de vida»; aún sin decidir).]
- [NEEDS CLARIFICATION: trámites legales (aviso de privacidad, términos): aún no existen; los borradores de la landing requieren revisión humana antes de publicarse.]
