# Tabla de cierres — tareas cerradas «por indicación» y su evidencia

**Spec 021 · T003 (RF-03, CA-03)** · Fecha: 2026-11-26 · Fuente: `specs/*/tasks.md`, `memoria.md` (D-227, D-228, D-229 y las entradas de cada spec) y el contenido real de `docs/evidencia/` y `docs/calidad/dispositivo/`.

Esta tabla no cambia el estado de ninguna tarea por sí sola: dice qué evidencia hay en el repositorio para cada cierre y qué no. Una tarea cerrada solo por la palabra de la persona responsable **no** se cuenta aquí como verificada. Las capturas con datos personales no se guardan (Art. VIII), por eso varios cierres figuran «sin evidencia archivada».

## Leyenda

| Etiqueta | Significado |
|---|---|
| **Con evidencia** | El archivo enlazado existe en el repositorio y respalda lo que pedía la aceptación. |
| **Parcial** | Hay evidencia de una parte (por ejemplo, un criterio de aceptación o solo pruebas automatizadas). |
| **Sin evidencia** | Cierre basado en la palabra de la persona responsable; no hay archivo que lo respalde. |
| **Reabierta** | La tarea vuelve a `[ ]` hasta que exista la evidencia (la cierra otra tarea de la spec 021). |

## 1. Tareas cerradas por indicación de la persona responsable

| Tarea | Qué pedía la aceptación | Cierre registrado | Evidencia enlazada | Estado |
|---|---|---|---|---|
| 003-T012 | Revisión CONFORME; H1 marcado; aviso al equipo | D-228: la revisión (2026-11-10) estaba hecha; H1 y aviso «se dan por hechos» | Veredicto en `memoria.md` (sección Spec 003). H1 y aviso no comprobados | Parcial |
| 003-T013 | Recorrido en Expo Go con capturas por criterio | D-228: app 1.1.2 desde Google Play en teléfono real | Ninguna en `docs/evidencia/003/` (la carpeta no existe); 146 suites en verde el 2026-11-25 (`docs/calidad/pruebas.md`) | Sin evidencia |
| 004-T010 | Recorrido en Expo Go con capturas por criterio | D-228: objetos con fotos y selector 0/5 vistos en la app 1.1.2 | Ninguna en `docs/evidencia/004/` (no existe); la subida a Cloudinary la cubren pruebas automatizadas | Sin evidencia |
| 005-T013 | Recorrido en Expo Go con capturas | `tasks.md` la marca `[x]`, pero `memoria.md` solo registra evidencia parcial (2026-11-10) y su encabezado de spec la dejaba «pendiente» | Capturas descritas en `memoria.md` (Evidencia parcial 1 y 2); `docs/evidencia/005/` no existe | Sin evidencia; **cierre no registrado en `memoria.md`** |
| 006-T010 | Recorrido en Expo Go con capturas | Cierre por indicación (2026-11-11) | Ninguna en `docs/evidencia/006/` (no existe); corrida local en verde (59 suites) anotada en `memoria.md` | Sin evidencia |
| 007-T013 | Recorrido en Expo Go con capturas | Cierre por indicación (2026-11-11) | Ninguna en `docs/evidencia/007/` (no existe) | Sin evidencia |
| 008-T011 | Recorrido en Expo Go con capturas | `tasks.md` la marca `[x]`; `memoria.md` la dejó «abierta» y no registra su cierre | Ninguna en `docs/evidencia/008/` (no existe) | Sin evidencia; **cierre no registrado en `memoria.md`** |
| 009-T013 | Recorrido en Expo Go con capturas | Cierre por indicación (2026-11-13) | Ninguna en `docs/evidencia/009/` (no existe); no quedó registrado qué se recorrió | Sin evidencia |
| 010-T014 | Recorrido en Expo Go con capturas | Cierre por indicación (2026-11-14) | Ninguna en `docs/evidencia/010/` (no existe) | Sin evidencia |
| 011-T013 | Recorrido en Expo Go con capturas | Cierre por indicación (2026-11-14) | Ninguna en `docs/evidencia/011/` (no existe) | Sin evidencia |
| 012-T006, T007, T011, T012 | Recorrido con 2 teléfonos y en Expo Go contra staging | Cierres por indicación (2026-11-17) | Ninguna en `docs/evidencia/012/` (no existe); `docs/validacion.md` §5 y §8 describen el recorrido | Sin evidencia |
| 013-T001 | Perfiles de EAS; APK/AAB instalables | Nota 2026-11-25 en `tasks.md` y D-227 | `eas.json` (perfiles `preview` y `production`); `docs/evidencia/013/` (capturas de Play Console, no de la instalación) | Parcial |
| 013-T002 | Cuenta de desarrollador de Google Play | Marcada según la persona (consta «Hecha» en `docs/play/seguimiento.md`) | `docs/evidencia/013/01-acceso-produccion-12-testers-2-dias.png` y siguientes | Parcial |
| 013-T003 | ≥ 15 testers | Marcada 2026-11-25: 26 usuarios en la lista de Play Console | `docs/evidencia/013/06-panel-12-testers-4-dias.png` (12 testers, día 4); la lista de 26 no se guarda (correos personales) | Parcial |
| 013-T005 | Ícono, gráfico y ≥ 4 capturas sin datos personales | Marcada 2026-11-26 según sus capturas de la ficha | `assets/store/icon-512.png` y `feature-1024x500.png`; `assets/store/screenshots/` vacía; `docs/evidencia/013/05-envio-4-capturas-y-video-publicados.png` | Parcial |
| 013-T007 | Ficha y declaraciones completas sin advertencias | Marcada 2026-11-25 según la persona | `docs/evidencia/013/03-` a `05-`; falta declarar la IA y las recomendaciones en «Seguridad de datos» | Parcial |
| 013-T009 | Seguimiento diario hasta el día 14; ≥ 12 testers | D-229 (2026-11-26) | `docs/play/seguimiento.md` (12 testers el 18 nov; 26 en la lista el 26 nov); el día 14 cae ≈ 29 nov y no se comprobó | Parcial |
| 014-T007 | AAB 1.1 en prueba cerrada y producción; CONFORME | D-229 (2026-11-26): la 1.1.2 se subió a Play | `memoria.md` («AAB 1.1.2 subido y comprobado en parte»); sin evidencia de la sugerencia de IA ni de la declaración de datos | Parcial |
| 014-T008 | Recorrido en Expo Go con capturas por criterio | Cierre por indicación (2026-11-20) | `docs/evidencia/014/01-ca01-sugerencia-con-ia.png` (solo CA-01); CA-02 a CA-04 sin captura | Parcial |
| 015-T008 | Recorrido en Expo Go con capturas por criterio | Cierre por indicación (2026-11-25) | `docs/evidencia/015/01-ca01-recomendado-para-ti.png` (solo CA-01); CA-02 a CA-04 sin captura | Parcial |
| 016-T009 | Corrida real en dispositivo, en verde, con informe archivado y cuenta de prueba eliminada | D-229 (2026-11-26): «completada y probada» | `docs/calidad/dispositivo/` **vacía**: sin informe JUnit ni `ultima-ejecucion.json`; `docs/calidad/pruebas.md` dice «No ejecutado» | **Reabierta** (la vuelve a cerrar 021-T026) |
| 016-T010 | Informe con veredicto CONFORME | D-229: veredicto `CONFORME con observaciones` (la aceptación pedía `CONFORME`) | `docs/calidad/pruebas.md` y `docs/calidad/conteo.json` | Parcial: depende de 016-T009 |
| 016-T011 | Verificación local y en teléfono; recorrer CA-01 a CA-09 | D-229: CA-07 «se da por cumplido según la persona» | `typecheck`, `lint`, `npm test` y `test:security` en verde el 2026-11-25 (D-225); CA-07 sin informe de dispositivo | Parcial: CA-07 sin evidencia; se rehace con 021-T026 |

## 2. Tareas que quedan abiertas u omitidas a propósito

| Tarea | Estado | Motivo |
|---|---|---|
| 001-T002, T003, T005 | Omitidas (sin marcar) | D-229: «no afectó el desarrollo»; no se cumplió su aceptación, por eso no se marcan |
| 001-T001, T004 | Omitidas | La spec 001 es opcional (9 nov) y el repositorio ya existe |
| 013-T010, T011 | Abiertas | Solicitud de producción y revisión final; dependen de Google Play |

## 3. Decisiones de cierre (D-227, D-228, D-229) y su contraste con `tasks.md`

| Decisión | Afirma | `tasks.md` hoy | Resultado |
|---|---|---|---|
| D-227 | 013-T002 y T007 marcadas; versión 1.1.2 y API `:8443` | 013-T002 y T007 `[x]` (con nota); `app.config.ts` 1.1.2 y `eas.json` con `:8443` | Coherente. El encabezado de la 013 aún decía «faltan T001, T002, T003, T005, T007…»: **corregido** en esta tarea |
| D-228 | Marca 003-T012, 003-T013, 004-T010 | Las tres `[x]` | Coherente en las casillas. Los encabezados de 003 («sin ejecutar») y 004 («T010 diferida») estaban desfasados: **corregidos** |
| D-229 | Marca 013-T009, 014-T007, 016-T009, T010, T011; omite 001-T002/T003/T005 | Todas `[x]` salvo las omitidas | Casillas coherentes. 016-T009 pasa a `[ ]` por esta tabla. Los encabezados de 014 («T007 parcial») y 016 («T001–T011 cerradas») estaban desfasados: **corregidos** |
| (sin ID) | 005-T013 y 008-T011 | Ambas `[x]` | `memoria.md` no registra su cierre y sus encabezados las dejaban abiertas: se anotó la discrepancia en cada `tasks.md` y se declararon «sin evidencia». **Pendiente de la persona:** confirmar el cierre o reabrirlas |

## 4. Cómo se actualiza esta tabla

- Cuando una tarea de esta spec aporte la evidencia (021-T026 para 016-T009; 021-T027 para las capturas de 003–012), se cambia su fila a **Con evidencia** y se enlaza el archivo.
- Nunca se cambia una fila a «Con evidencia» sin que el archivo exista en el repositorio.
- Las capturas llevan una cuenta de demostración, sin nombres, correos ni fotos de otras personas (RNF-04).
