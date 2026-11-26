# Seguimiento de la publicación en Google Play (spec 013)

Registro de la prueba cerrada. Lo marcado «según la persona responsable» no se pudo comprobar desde el repositorio; lo marcado **por anotar** falta por llenar. La lista de correos de los testers **no** va en git.

> **Spec 013 pendiente de cierre al final** (decisión del 2026-11-19): se avanza con la spec 014 mientras corre la prueba cerrada; aquí se sigue anotando a diario y se retoma T009–T011 después del día 14 (≈ 29 nov).

## Estado (2026-11-18)

| Tarea | Estado | Fuente |
|---|---|---|
| T001 Perfiles de EAS | Parcial: `eas.json` con `preview` (APK) y `production` (AAB, `autoIncrement`); falta la URL de producción y probar el APK; ver observaciones | Revisado en el repositorio |
| T003 Testers | Instrucciones y mensaje en `testers.md`; 12 testers aceptados (la spec pide ≥ 15) | Redactado; Play Console |
| T004 Textos de la ficha | Hecha: `ficha.md` | Redactado y revisado contra la app y la landing |
| T005 Recursos gráficos | Parcial: `icon-512.png` y `feature-1024x500.png` generados en el repo; Play ya tiene capturas y vídeo publicados (envío 4) pero no se ve cuántas ni están en el repo | `assets/store/`, captura 05 |
| T006 Cumplimiento | Hecha: `cumplimiento.md` (borrador sujeto a la revisión legal del aviso) | Redactado contra el código y el aviso |
| T002 Cuenta y app «Vaivén» | Hecha | Según la persona responsable |
| T007 Ficha y declaraciones | Hecha (la app se subió a la prueba cerrada) | Según la persona responsable |
| T008 Primer AAB a la prueba cerrada | **Hecha**: versión 0.2.0 publicada en la pista Alpha el 13 nov; 12 testers aceptaron | Capturas en `docs/evidencia/013/` |
| T009 Seguimiento diario | **En curso**: Play Console marca «12 testers han participado durante 2 días sin interrupciones» el 2026-11-18 | Captura 01 |
| T010 Solicitud de producción | Pendiente: solo después del día 14 | |

## Evidencia (Play Console, 2026-11-18)

Capturas en `docs/evidencia/013/`:

1. `01-acceso-produccion-12-testers-2-dias.png`: app «VaivenApp» (`mx.vaiven.app`), producción **Inactivo**; cumplidos «Publicar una versión de prueba cerrada» y «Tener al menos 12 testers que hayan aceptado»; pendiente «Ejecutar la prueba cerrada con 12 testers como mínimo y durante al menos 14 días» con **12 testers, 2 días sin interrupciones**.
2. `02-probar-y-publicar-alpha-0.2.0.png`: «No tienes cambios no publicados»; prueba cerrada **alpha**, versión **0.2.0 - Íconos de Vaivén**.
3. `03-prueba-cerrada-alpha-version-publicada.png`: canal Alpha **Activo**, 1 país o región, versión 0.2.0 «Disponible para determinados testers», 1 código de versión, publicada el **13 nov** (12:17 en esta captura, 18:17 en la anterior: son husos horarios distintos de la misma hora).

## Evidencia adicional (2026-11-19)

Capturas en `docs/evidencia/013/`:

4. `04-actividad-envios-ficha-y-alpha-publicadas.png`: *Actividad de envíos*. Envío 3 (13 nov, 11:57 a. m.) «Prueba cerrada - Alpha» y envío 4 (13 nov, 12:33 p. m.) «Ficha de Play Store»: ambos **Publicada**.
5. `05-envio-4-capturas-y-video-publicados.png`: el envío 4 cambió, en la ficha predeterminada en español (Latinoamérica, es-419), las **capturas de pantalla de teléfonos** y el **vídeo**; publicado el 13 nov a las 12:47 p. m.
6. `06-panel-12-testers-4-dias.png`: panel de control de «VaivenApp» (`mx.vaiven.app`), producción **Inactivo**; «12 testers han participado durante **4 días** sin interrupciones».

## Calendario real de los 14 días

- Con **4 días cumplidos el 19 nov**, el día 14 cae hacia el **29 nov** y la solicitud de producción puede enviarse ese día o el siguiente (Play Console habilita la solicitud al cumplirse; la fecha exacta la marca la consola, no esta estimación). El 18 nov la consola marcaba 2 días: el contador avanzó dos días entre una captura y otra, así que conviene volver a mirarlo a diario.
- La spec suponía enviarla el 23 nov (día 14 el 22 nov): ese calendario ya no se cumple; actualizar el ROADMAP y avisar a la landing (L002-T010).
- Requisito de Google: al menos 12 testers inscritos de forma continua durante los 14 días; si baja de 12, el contador se interrumpe, así que se reponen el mismo día.

## Versión subida

| Versión (`versionName`) | Nombre de la versión | Códigos de versión | Fecha | Pista |
|---|---|---|---|---|
| 0.2.0 | Íconos de Vaivén | 1 (el número exacto no se ve en las capturas) | 13 nov 2026 | Alpha (prueba cerrada) |

El repositorio tiene `version: '1.0.0'` en `app.config.ts`: la próxima compilación subirá un `versionName` distinto al de Play. Confirmar si es intencional.

## Tabla diaria

| Día | Fecha | Testers inscritos (≥ 12) | Versión | Incidencias / comentarios |
|---|---|---|---|---|
| 1 | | | | |
| 2 | 2026-11-18 | 12 (según Play Console) | 0.2.0 | Sin incidencias anotadas |
| 3 | | | | |
| 4 | 2026-11-19 | 12 (según Play Console) | 0.2.0 | Sin incidencias anotadas |
| 5 | | | | |
| 6 | | | | |
| 7 | | | | |
| 8 | | | | |
| 9 | | | | |
| 10 | | | | |
| 11 | | | | |
| 12 | | | | |
| 13 | | | | |
| 14 | | | | |

## Observaciones de la revisión de `eas.json` (T001)

- `production` apunta a `EXPO_PUBLIC_API_URL` de **staging** (`vaiven-staging…:8443`), igual que `preview`. La aceptación pide la URL de producción; hay que cambiarla antes de la compilación que se envíe a producción, y subir una versión nueva.
- `version` ya es `1.0.0`; la spec pedía `0.1.0` hasta T010 (que fija `1.0.0`). Confirmar que es intencional.
- `targetSdkVersion` no está fijado explícitamente: se usa el que trae Expo SDK 58. Comprobar que cumple el mínimo vigente de Google Play.
- T007: la ficha de Play Store está **publicada** (envío 4); sigue sin marcar porque falta ver seguridad de datos, clasificación, público, anuncios y cuenta de revisión sin advertencias. T002 sigue sin marcar: las capturas muestran la app creada y la versión aprobada, pero no la verificación de identidad y teléfono, ni que la ficha y las declaraciones estén completas sin advertencias, ni la cuenta de revisión.
- `targetSdkVersion`: no se fija a mano; el valor por defecto de React Native 0.88 / Expo SDK 58 es **36** (`node_modules/react-native/gradle/libs.versions.toml`), que es el mínimo que Google Play exige para apps y actualizaciones desde el 31 de agosto de 2026 (consulta del 18 nov). Confirmar en la versión subida a Play Console.
- Cambio hecho: se añadió `EXPO_PUBLIC_LEGAL_URL=https://vaiven-landing.onrender.com` a los dos perfiles de `eas.json` para que la app muestre los enlaces de privacidad y términos (RF-11). Es una URL pública, no un secreto. La versión 0.2.0 ya subida pudo salir sin ese valor. Las páginas legales siguen en borrador hasta L001-T011.
- `docs/play/ficha.md`, `cumplimiento.md`, `testers.md`, `solicitud-produccion.md` y `lanzamiento.md` ya existen; `assets/store/screenshots/` espera las capturas.

## v1.1 con IA (spec 014, T006) — pendiente antes de subir el AAB 1.1

| Elemento | Estado (2026-11-20) | Quién |
|---|---|---|
| Aviso de privacidad de la landing menciona el envío de la foto al proveedor de IA a petición de la persona | **Hecho en el árbol de trabajo** de `vaiven-landing-page` (`privacidad/index.html`, fecha actualizada al 20 nov); `scripts/check.mjs` pasa. **Falta fusionar y publicar la landing** y la revisión legal (L001-T011) | MO-B / persona responsable |
| `docs/play/cumplimiento.md` §1 (fila de fotos compartidas con proveedor de IA) y §9 | **Hecho** | MO-B |
| «Seguridad de los datos» en Play Console | **Pendiente**: declarar las fotos enviadas a un proveedor de IA (opcional, a petición) **antes de subir la v1.1**; no se hizo desde el repositorio | Administración (Play Console) |
| AAB 1.1 a la prueba cerrada (~2 dic) y a producción | **Pendiente**: solo cuando la 1.0 esté aprobada; requiere `eas build` con aprobación humana (spec 014 T007) | Administración |
<<<<<<< Updated upstream
=======

## Actualización 2026-11-25

- **Compilaciones en EAS** (perfil `production`, AAB): 1.0.0 (4), 1.1.0 (5), 1.1.1 (6) y 1.1.1 (7). El `versionCode` subió solo.
- **Hallazgo:** el AAB 1.1.1 se subió con `EXPO_PUBLIC_API_URL` **sin el puerto** (`https://vaiven-staging.westus2.cloudapp.azure.com`); la API real corre en `:8443`. Por eso la app no vio las cuentas ni los interruptores de IA y recomendaciones. **Corregido** en `eas.json` (perfiles `preview` y `production`).
- **Versión que sigue:** `1.1.2` en `app.config.ts` (D-227). Se vuelve a construir con `eas build --platform android --profile production` y se sube a la prueba cerrada; el AAB 1.1.1 con la URL errónea no debe liberarse.
- **Estado de tareas:** T001 (la app abre en un teléfono real, según la persona), T002, T003 (la lista «Vaiven Testers» tiene 26 usuarios; la persona informa de más de 20) y T007 marcadas hechas. Siguen abiertas T005 (faltan capturas reales en el repositorio, sin datos personales), T009 (día 14 ≈ 29 nov), T010 y T011.
- **Antes de producción:** «Seguridad de datos» debe declarar las fotos enviadas al proveedor de IA y el historial de objetos vistos (recomendaciones).

## Actualización 2026-11-26

- **Versión 1.1.2 subida a Play** (acceso anticipado) por la persona responsable e instalada en un teléfono real desde Google Play.
- **Comprobado con capturas de la persona** (no se guardan en el repositorio por contener datos personales): con la API en `:8443` aparecen sus objetos de «Mis objetos» y los avisos anteriores (17 y 21 nov); en Explorar sale **«Recomendado para ti»** (con la etiqueta «Popular en Vaivén», es decir, el respaldo por popularidad al no haber historial suficiente).
- **Sin comprobar todavía:** el banner de sugerencias de la IA al publicar un objeto con foto.
- **Pendiente:** capturas limpias para la ficha (T005), seguimiento hasta el día 14 (T009), solicitud de producción (T010) y revisión (T011).
- **T005 marcada hecha (2026-11-26):** la ficha pública muestra el vídeo y al menos 5 capturas del teléfono con datos ficticios (según la persona, vistas en capturas de la sesión). Pendiente opcional: guardar copias en `assets/store/screenshots/` y renovarlas con las funciones de la 1.1 (recomendaciones e IA) antes de pedir producción.
>>>>>>> Stashed changes
