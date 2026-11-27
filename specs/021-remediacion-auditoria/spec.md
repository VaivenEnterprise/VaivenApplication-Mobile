# Spec 021 — Remediación de la auditoría de entrega-recepción (móvil)

- **Dueño:** MO-B (coordina) con MO-A · **Prioridad:** P0 para la entrega · **Ventana:** 26 nov–2 dic · **Depende de:** 001–017 (las corrige y completa); backend 018 (moderación de imágenes y de texto ampliada, datos de demostración en staging)
- **Constitución:** v1.3.1 · **Estado:** Borrador (pendiente de aprobación humana, Art. I y XI.5)
- **Numeración:** nació como 018 y se pasó a **021** (D-232): el backend ya usa 018 (hardening), 019 (identidad fuerte) y 020 (auditoría de pruebas), y los números móviles 018–020 quedan reservados para la parte móvil de esas specs si se abren aparte. Cuando esta spec dice «backend 018», «019» o «020» se refiere siempre a las specs de `vaiven-backend`.
- **Antecedente:** el 2026-11-26 se hicieron dos auditorías de solo lectura contra «Auditoría de evaluación v2» (secciones Móvil y Pruebas de automatización), una con Claude (`Pendientes_claude.md`, **60/100, no aprobado**) y otra con OpenCode (`Pendientes_opencode.md`, **72/100, conforme con observaciones**). Esta spec convierte **todos** los hallazgos de ambas en trabajo ordenado por fases, con la meta de **90/100 o más** en ambas.

## 1. Objetivo y por qué
Las dos auditorías coinciden en que la base técnica es sólida (146 suites, 1 864 pruebas en verde, CI con Gitleaks y CodeQL, seguridad de sesión correcta) y en que lo que baja la nota **no es el código, sino la integridad de la entrega y la falta de evidencia**: conflictos de merge commiteados, configuración de build distinta de lo documentado, tareas cerradas sin evidencia, ninguna ejecución real en dispositivo, y controles de seguridad ausentes (moderación de imágenes, protección del binario). Esta spec los cierra o, cuando no pueden cerrarse sin cambiar la constitución o sin un servicio externo, los documenta como **excepción formal** con su justificación.

### 1.1 Meta y cómo se mide
La rúbrica oficial no está en el repositorio; cada auditor usó la suya. La meta es **≥ 90 en las dos** (y no mejorar un número cambiando el método). Estimación por fase, **no una garantía** (el avance real lo mide T029 repitiendo las dos auditorías):

| Al terminar la fase | Claude (base 60) | OpenCode (base 72) | Qué sube |
|---|---|---|---|
| 0 Integridad de la entrega | ≈ 66 | ≈ 75 | Se quita la penalización por conflictos, configuración y tareas sin evidencia |
| 1 Entornos | ≈ 68 | ≈ 76 | Producción y staging dejan de confundirse; el script de dispositivo no puede tocar datos reales |
| 2 Calidad de las pruebas | ≈ 71 | ≈ 79 | Cobertura real, matriz completa, contrato |
| 3 Endurecimiento de la app | ≈ 76 | ≈ 83 | Backup, permisos, subida de imágenes, ofuscación, sesión |
| 4 Backend y push | ≈ 80 | ≈ 86 | Moderación de imágenes y de texto, FCM |
| 5 DevSecOps CI/CD | ≈ 84 | ≈ 89 | SBOM, SAST móvil, CD con aprobación |
| 6 Evidencia en dispositivo | ≈ 90–93 | ≈ 94–97 | La suite corre en un teléfono real |
| 7 Medición y cierre | confirma | confirma | Reauditoría con los dos prompts |

**Compuertas (sin ellas no se llega a 90):** (1) la **ejecución real en teléfono** (T026): sin ella, ninguna de las dos pasa de ≈ 86; (2) la **fase 0**; (3) la **moderación de imágenes** del backend (T017); (4) la decisión de **entornos** (T005). Las tres últimas dependen de personas o del backend; esta spec las deja preparadas y pide autorización antes de tocar servicios externos.

## 2. Historias
| # | Prio. | Historia |
|---|---|---|
| H-01 | P0 | Como persona que evalúa, quiero que la entrega sea coherente: sin conflictos, con una sola versión y una sola URL de API documentadas y reales. |
| H-02 | P0 | Como persona que evalúa, quiero ver una ejecución real de la suite en un teléfono, con informe archivado. |
| H-03 | P0 | Como equipo, quiero que el contenido inapropiado (imágenes y texto) se rechace y la app lo muestre. |
| H-04 | P1 | Como equipo, quiero que la cobertura reportada sea la de la app, no la de 17 archivos. |
| H-05 | P1 | Como equipo, quiero endurecer la app con lo que Expo Go permite y justificar por escrito lo que no. |
| H-06 | P1 | Como equipo, quiero un CI con SBOM y análisis móvil y un CD manual con aprobación. |

## 3. Hallazgos que cubre
Origen: **[C]** Claude, **[O]** OpenCode. Cada hallazgo apunta a la tarea que lo cierra.

| ID | Hallazgo | Sev. | Origen | Tarea |
|---|---|---|---|---|
| A-1 | Conflictos de merge commiteados en `memoria.md`, `PUNTAJE-VERSIONES.md` y `docs/play/seguimiento.md`; `D-222` duplicado con `D-226`; `stash@{0}` pendiente | Alto | C, O | T001 |
| A-2 | `eas.json` sin `:8443` y versión `1.1.1`/`1.0.0` distinta de lo que dice D-227 (`1.1.2`) | Alto | C, O | T002 |
| A-3 | Producción apunta a un host «staging»; las E2E destructivas y la guarda por nombre quedan sin efecto | Alto | C, O | T005, T006 |
| A-4 | Sin moderación de imágenes | Alto | C, O | T017 |
| A-5 | Sin controles de nivel fintech (pinning, root, ofuscación, Play Integrity, biometría) | Alto | C, O | T015, T016 |
| M-1 | Cobertura de 99,65 % medida sobre 17 de 352 archivos (`jest.config.js`) | Medio | C | T007 |
| M-2 | Tareas cerradas sin evidencia (016-T009, D-228, D-229, Expo Go 003–012) | Medio | C, O | T003, T026, T027 |
| M-3 | `tasks.md` de la 013 contradice `memoria.md` | Medio | C | T003 |
| M-4 | Push Android sin FCM ni evidencia | Medio | C | T019 |
| M-5 | Permisos efectivos no declarados (SYSTEM_ALERT_WINDOW, READ/WRITE_EXTERNAL_STORAGE), `allowBackup: true`, iOS `NSLocationAlways`/micrófono | Medio | C | T012 |
| M-6 | Moderación de texto incompleta (perfil, calificaciones, incidencias, reportes) | Medio | C | T018 |
| M-7 | Sin CD ni controles del binario (firma, SBOM, análisis estático) | Medio | C, O | T022, T023 |
| M-8 | Matriz de pantallas sin *slots* ni `/ai/assistant/*`; asistente de proyectos del contrato sin consumir | Medio | O | T009, T020 |
| M-9 | Excepción `GHSA-fc5q-39xc-vjpf` (vence 2026-12-18; un auditor dice que ya no aplica) y 27 vulnerabilidades moderadas | Medio | C, O | T021 |
| B-1 | `.github/scripts/audit.mjs` falla en Windows (`execFileSync('npm')` sin `shell`) | Bajo | C | T021 |
| B-2 | Flujos Maestro débiles (`03-solicitud` se omite en silencio, `02-explorar` acepta vacío); flujos sin cubrir | Bajo | C, O | T025 |
| B-3 | Aviso de Jest «worker failed to exit gracefully» y avisos `act(...)` | Bajo | C, O | T008 |
| B-4 | `uploadUrl` de la firma no se restringe a https ni al dominio de Cloudinary | Bajo | C | T013 |
| B-5 | Arranque sin red muestra el login aunque conserva la sesión | Bajo | C | T014 |
| B-6 | `/meta` se consulta dos veces (IA y recomendaciones) | Bajo | O | T014 |
| B-7 | Logout ignora el fallo HTTP de `POST /auth/logout` (es diseño, S-03) | Bajo | O | T004 (documentar) |
| D-1 | Siete discrepancias documentación↔código (versión, `expo-mcp`, `docs/seguridad.md`, `docs/devsecops.md`, `cumplimiento.md` de notificaciones y de archivos, AGENTS.md y Expo Go, Skills UX citadas que no están en el repo) | Medio | C, O | T004 |
| P-1 | El «porcentaje de seguridad DevSecOps» no tiene método reproducible (64 % según Claude; «no inventar» según OpenCode) | Medio | C, O | T024 |
| P-2 | La integración usa solo API simulada; no hay prueba de contrato | Medio | C | T010 |
| C-1 | De las **69 operaciones** de `vaiven-backend/api/openapi.yaml`, **8 no se consumen** en la app (2 del asistente de IA y 6 de administración) y no hay inventario que lo diga | Medio | Backend | T031 |
| C-2 | Asistente de proyectos (`POST /ai/assistant/messages`, `DELETE /ai/assistant/conversations/{id}`) sin consumir ni declarar fuera de alcance | Medio | C, O | T020, T032 |
| C-3 | Backend 019 (borrador) añade una variante de 401 (`details: [{field:"stepUp",issue:"required"}]`); si la app trata todo 401 como cierre de sesión, encender las banderas la rompería | Alto (a futuro) | Backend | T033 |
| C-4 | Backend 019 planea MFA, códigos de recuperación, segundo paso de login y `GET/DELETE /me/sessions`, aún **fuera del contrato**; la app no tiene pantallas | Medio | Backend | T034 |
| C-5 | Backend 018 pide a móvil una prueba con compresión HTTP activa (RF-18, B-7, T014) | Bajo | Backend | T035 |
| P-3 | Seguridad por pantalla: 24 pantallas sin suite `*.security.test.*` propia (justificadas por capa) | Bajo | C, O | T009 |
| F-1 | **Las notificaciones push no funcionan** (reporte de la persona responsable, 2026-11-26): no llegan avisos al teléfono. Causa por diagnosticar; el registro del token y el canal viven en `features/notifications/push.ts`, y en Android falta FCM (M-4) | Alto | Persona | T036 (con T019) |
| F-2 | **Editar un objeto no funciona** (reporte de la persona responsable, 2026-11-26): `EditItemScreen` / `useUpdateItem` (`PATCH /items/{id}`) no guarda. Causa por diagnosticar | Alto | Persona | T037 |
| F-3 | **Ubicación exacta**: la app hoy pide solo ubicación aproximada (`ACCESS_FINE_LOCATION` bloqueada, S-08a/S-08b y S-12g) y el aviso de privacidad lo dice. La persona responsable pide usar la ubicación exacta; el alcance no está definido (ver §7) | Medio | Persona | T038 |

## 4. Requisitos

### A. Integridad de la entrega (fase 0)
| ID | Requisito |
|---|---|
| RF-01 | Ningún archivo versionado contiene marcadores de conflicto; una prueba estática lo vigila (S-12). `memoria.md` no repite IDs de decisión. |
| RF-02 | Una sola versión y una sola URL de API: `app.config.ts`, `package.json`, `eas.json`, `.env.example` y la documentación coinciden, y una prueba lo comprueba. |
| RF-03 | Cada tarea cerrada «por indicación» tiene su evidencia enlazada o queda **reabierta/anotada** como «sin evidencia» (`docs/calidad/evidencia-cierres.md`). `tasks.md` y `memoria.md` no se contradicen. |
| RF-04 | Las siete discrepancias documentación↔código se corrigen en la documentación o se documentan como decisión (nunca se tuerce el código para igualar un texto). |

### B. Entornos (fase 1)
| ID | Requisito |
|---|---|
| RF-05 | Una decisión escrita sobre **entornos**: qué host es producción, cuál es de pruebas, qué datos pueden tocar las pruebas destructivas. Si solo hay un servidor, se documenta como tal y las pruebas destructivas usan cuentas de prueba creadas y eliminadas en la corrida. |
| RF-06 | La guarda de `scripts/device-tests.mjs` decide por una **lista explícita** de hosts permitidos (variable `E2E_ALLOW_API_HOST` o archivo versionado), no por una etiqueta en el nombre. |

### C. Calidad de las pruebas (fase 2)
| ID | Requisito |
|---|---|
| RF-07 | `collectCoverageFrom` incluye `features/*/hooks.ts` y `features/**/use*.ts` además de lo actual; los umbrales **no bajan** y se reporta la cobertura real. |
| RF-08 | Sin avisos de «worker failed to exit gracefully» ni `act(...)` en `npm test`. |
| RF-09 | La matriz de pantallas incluye los *slots* y el asistente; las pantallas con entradas sensibles (inicio, registro, editar perfil, chat, incidencias) tienen prueba de seguridad propia. |
| RF-10 | **Contrato:** una prueba valida que las respuestas simuladas cumplen `../vaiven-backend/api/openapi.yaml` (solo lectura), y un script opcional hace solo lecturas (`GET`) contra la API configurada. |

### D. Endurecimiento (fase 3)
| ID | Requisito |
|---|---|
| RF-11 | `allowBackup: false`; `SYSTEM_ALERT_WINDOW`, `READ_EXTERNAL_STORAGE` y `WRITE_EXTERNAL_STORAGE` bloqueados en Android; sin `NSLocationAlways*` ni micrófono en iOS. `docs/play/cumplimiento.md` coincide con el manifiesto efectivo. |
| RF-12 | `uploadUrl` solo `https` y del dominio de Cloudinary; lo demás se rechaza. |
| RF-13 | El arranque sin red conserva la sesión; `/meta` se consulta una sola vez. |
| RF-14 | Protección de sesión con módulos de Expo: bloqueo de capturas en pantallas sensibles, cierre por inactividad y, opcional, biometría para volver a entrar. |
| RF-15 | Ofuscación del binario de producción (R8) con `expo-build-properties`. **Pinning, detección de root y Play Integrity** se documentan como **excepción formal** (no hay módulo compatible con Expo Go, Art. XIV.2) con su riesgo y su alcance, salvo que una persona apruebe la enmienda. |

### E. Backend y push (fase 4)
| ID | Requisito |
|---|---|
| RF-16 | Una imagen rechazada por contenido se muestra con salida clara y no queda publicada; el rechazo viene del servidor (la app no clasifica imágenes). |
| RF-17 | Perfil (nombre y bio), calificaciones, incidencias y reportes muestran el rechazo de moderación de texto. |
| RF-18 | El AAB obtiene un token de notificaciones en Android (FCM configurado) y existe evidencia de un aviso recibido. |
| RF-19 | El asistente de proyectos del contrato se implementa o se declara fuera de alcance con motivo (spec 014). |

### E1. Defectos funcionales reportados (fase 4)
Reportados por la persona responsable el 2026-11-26 sobre la app instalada. Cada uno se **reproduce primero** y se diagnostica su causa antes de corregir (no se prueban cambios al azar); la corrección lleva una prueba que habría fallado antes.

| ID | Requisito |
|---|---|
| RF-34 | Las notificaciones push funcionan: en un teléfono con el permiso concedido la app obtiene el token, lo registra en el servidor y recibe un aviso de prueba, con la app abierta, en segundo plano y cerrada. Se documenta la causa (token, canal, `projectId`, credenciales de FCM, registro en el servidor o llegada del aviso) y lo que Expo Go no permita probar. |
| RF-35 | Editar un objeto propio guarda los cambios (campos, fotos, disponibilidad) y los muestra en el detalle y en «Mis objetos»; un conflicto (409) o la falta de permiso (403) se explican sin perder lo escrito. |
| RF-36 | La ubicación exacta solo se usa si la persona responsable define su alcance (§7): para qué, dónde se guarda, quién la ve y cómo se pide. Hasta entonces la app sigue pidiendo solo la aproximada. Si se aprueba, la ubicación exacta **no se muestra en listados públicos** (Art. VIII.4), se pide con permiso y texto en español, y el aviso de privacidad y `docs/play/cumplimiento.md` se actualizan antes de publicar. |

### E2. Contrato del backend que la app aún no consume (fase 4)
Fuente: `vaiven-backend/api/openapi.yaml` (69 operaciones) y las specs 018, 019 y 020 del backend (la 019 es **borrador** y sus rutas aún no están en el contrato; los nombres son tentativos). Solo se **lee** el backend (Art. IV); el contrato no se modifica desde aquí.

| ID | Requisito |
|---|---|
| RF-28 | Existe `docs/calidad/contrato-endpoints.md` con las 69 operaciones y su estado en la app: **consumida**, **fuera de alcance móvil** (con motivo) o **pendiente**; una prueba sin red lo compara con `openapi.yaml` y falla si aparece una operación sin clasificar. |
| RF-29 | Las 6 operaciones de administración (`GET /admin/incidents`, `POST /admin/incidents/{id}/notes`, `POST /admin/incidents/{id}/close`, `POST /admin/users/{id}/sanctions`, `GET /admin/reports`, `POST /admin/reports/{id}/resolve`) se declaran **fuera de alcance móvil** (back-office) con su motivo; la app no incluye pantallas de administración. |
| RF-30 | Si la persona decide implementar el asistente (T020), la app consume `POST /ai/assistant/messages` y `DELETE /ai/assistant/conversations/{id}`: solo con `features.aiSuggestions` activo, sin enviar datos de otras personas ni del chat, con moderación y errores por campo, y pruebas con la API simulada. |
| RF-31 | La app **no cierra la sesión** ante un 401 con `details` `[{field:"stepUp",issue:"required"}]`: lo distingue del 401 de sesión vencida y ofrece reintentar tras confirmar la identidad. Prueba con ambas variantes. |
| RF-32 | Cuando el backend 019 se apruebe y publique sus rutas en `openapi.yaml`, la app ofrece enrolar, verificar y desactivar MFA, ver y regenerar los códigos de recuperación, el segundo paso de `login` con TOTP o código de recuperación, y listar y revocar sesiones. Hasta entonces la tarea queda **bloqueada** y nada se inventa fuera del contrato. |
| RF-33 | La app se prueba con compresión HTTP activa contra staging (backend 018): el JSON recibido es idéntico al de sin compresión y las rutas con secretos siguen sin comprimirse; el resultado se archiva. |

### F. DevSecOps (fase 5)
| ID | Requisito |
|---|---|
| RF-20 | `audit.mjs` funciona en Windows; las excepciones vencidas o sin efecto se retiran; `docs/seguridad.md` cita las cifras reales. |
| RF-21 | El CI genera un **SBOM** (CycloneDX) y corre un análisis estático móvil; sin dependencias nuevas en la app. |
| RF-22 | Existe un **CD manual** (`workflow_dispatch`, con aprobación de un revisor) que construye con EAS; queda **preparado y sin ejecutar** hasta la autorización de quien administra el repositorio y la cuenta de Expo. |
| RF-23 | `docs/calidad/seguridad-devsecops.md` define la lista de prácticas puntuadas y su resultado, para responder «¿qué porcentaje de seguridad?» con método. |

### G. Evidencia y cierre (fases 6 y 7)
| ID | Requisito |
|---|---|
| RF-24 | Los flujos Maestro no pasan en verde sin probar nada (fallan si falta `E2E_ITEM_TITLE` o si Explorar no trae resultados) y cubren además publicar con foto, chat y borrar el historial de recomendaciones. |
| RF-25 | La suite corre en un teléfono real y su informe JUnit queda archivado en `docs/calidad/dispositivo/` con fecha, comando y API usada. |
| RF-26 | Hay evidencia mínima (capturas sin datos personales) de los flujos clave en teléfono para las specs 003–012, o su ausencia queda documentada. |
| RF-27 | `docs/calidad/pruebas.md` se actualiza con el conteo real y se repiten las dos auditorías; el resultado y su fecha se anotan en `memoria.md`. |
| RNF-01 | Sin funcionalidad nueva para la persona usuaria salvo moderación (RF-16/17), push (RF-18), asistente (RF-19, si se acepta) y protección de sesión (RF-14). |
| RNF-02 | Ninguna prueba se debilita, se omite ni se borra para obtener verde; los umbrales de cobertura no bajan. |
| RNF-03 | Dependencias nuevas de la app solo con justificación en `plan.md` y registro en `memoria.md` (Art. X). Las herramientas de CI no entran a la app. |
| RNF-04 | Sin secretos ni datos personales en el repositorio, informes ni capturas (Art. VIII). |
| RNF-05 | No se despliega ni se toca infraestructura sin autorización (CD, FCM, Play Console, EAS). |

## 5. Criterios de aceptación
| ID | Dado / Cuando / Entonces |
|---|---|
| CA-01 | Dado todo archivo versionado, entonces no contiene marcadores de conflicto y `memoria.md` no repite IDs. |
| CA-02 | Dados `app.config.ts`, `package.json`, `eas.json` y `.env.example`, entonces versión y URL de API coinciden con la documentación y una prueba lo verifica. |
| CA-03 | Dada la tabla de cierres, entonces toda tarea cerrada «por indicación» tiene evidencia enlazada o figura como «sin evidencia». |
| CA-04 | Dada una URL de API fuera de la lista explícita, entonces `device-tests` se niega aunque su nombre diga «staging». |
| CA-05 | Dado `npm run test:report`, entonces la cobertura incluye `features/*/hooks.ts` y los umbrales siguen en 80 %. |
| CA-06 | Dado el manifiesto efectivo (`npx expo config --type introspect`), entonces no hay `allowBackup: true` ni los tres permisos sobrantes. |
| CA-07 | Dada una foto rechazada por el servidor, entonces la app muestra el motivo y no sube nada más. |
| CA-08 | Dado el AAB instalado en un Android, entonces obtiene un token de notificaciones y recibe un aviso de prueba. |
| CA-09 | Dado el CI, entonces publica un SBOM y el análisis móvil pasa; el CD manual existe y no se ha ejecutado sin autorización. |
| CA-10 | Dado un teléfono real, entonces `npm run test:device` termina en verde y guarda el informe JUnit. |
| CA-12 | Dado `openapi.yaml`, entonces cada una de las operaciones figura en `contrato-endpoints.md` como consumida, fuera de alcance móvil o pendiente, y la prueba falla si una queda sin clasificar. |
| CA-13 | Dado un 401 con `stepUp`, entonces la sesión sigue abierta y se ofrece reintentar; dado un 401 de sesión vencida, entonces se cierra la sesión como hoy. |
| CA-14 | Dado el backend 019 aprobado y publicado en el contrato, entonces una cuenta con MFA inicia sesión con segundo paso, puede ver y revocar sus sesiones y la app no queda bloqueada en ninguna ruta sensible. |
| CA-15 | Dada la API con compresión activa, entonces las listas y el perfil se ven igual que sin compresión. |
| CA-16 | Dado un teléfono con el permiso de avisos concedido, cuando el servidor envía una push de prueba, entonces el aviso llega con la app abierta, en segundo plano y cerrada, y la causa del fallo anterior queda registrada. |
| CA-17 | Dado un objeto propio, cuando se cambian título, descripción, precio o fotos y se guarda, entonces el detalle y «Mis objetos» muestran los cambios; con un 409 se ofrece recargar sin perder lo escrito. |
| CA-18 | Dada la decisión sobre ubicación exacta, entonces la app hace lo decidido y nada más: si se aprueba, pide el permiso con su texto y no muestra la ubicación exacta en listados públicos; si no, queda documentado el motivo. |
| CA-11 | Dadas las dos auditorías repetidas, entonces ambas dan **90/100 o más** con su método descrito; si no, el informe dice qué falta. |

## 6. Fuera de alcance
Pantallas de administración (`/admin/*`, back-office; RF-29); Pruebas de penetración activas; pruebas destructivas contra datos reales; cambios a la constitución (se **proponen**, no se hacen: Art. XII); iOS; regresión visual; pruebas de carga; el trabajo de backend en sí (aquí solo su parte móvil y su dependencia).

## 7. Preguntas abiertas
- [NEEDS CLARIFICATION: **entornos**. D-227 indica que el host «staging» (`:8443`) es el servidor que se usa como producción. Propuesta: documentarlo así (un solo servidor), tratar los datos como reales y limitar las pruebas destructivas a cuentas de prueba creadas y eliminadas en la corrida. Alternativa: crear un segundo servidor de pruebas (requiere infraestructura y autorización).]
- [NEEDS CLARIFICATION: **dependencias nuevas** (Art. X.4): `expo-screen-capture`, `expo-local-authentication` y `expo-build-properties`, todas de Expo y compatibles con Expo Go. Se registran en `memoria.md` si se aprueban; la biometría es opcional.]
- [NEEDS CLARIFICATION: **pinning, root y Play Integrity**. No hay módulo compatible con Expo Go (Art. XIV.2); exigirlos requiere una enmienda a la constitución y una compilación de desarrollo. Propuesta: excepción documentada en `docs/calidad/seguridad-nivel.md` (la app no procesa pagos, Art. V.4).]
- [NEEDS CLARIFICATION: **asistente de proyectos** (`/ai/assistant/*`): implementarlo en la app o declararlo fuera de alcance de la 014.]
- [NEEDS CLARIFICATION: **FCM**: requiere un proyecto de Firebase y subir sus credenciales a EAS (servicio externo, lo hace quien administra la cuenta).]
- [NEEDS CLARIFICATION: **CD**: `EXPO_TOKEN` como secreto del repositorio y revisor obligatorio; lo configura quien administra GitHub.]
- [NEEDS CLARIFICATION: **identidad fuerte (backend 019)**: la spec del backend es un borrador y sus rutas no están en el contrato; MO-A y MO-B deben confirmar la ventana antes de que se enciendan las banderas en producción (T033 debe estar lista antes). T034 queda bloqueada hasta entonces.]
- [NEEDS CLARIFICATION: **ubicación exacta (F-3, T038)**. El Art. VIII.4 permite pedir permisos de ubicación «con el mínimo alcance» y prohíbe mostrar la ubicación exacta en listados públicos; hoy se pide solo la aproximada y se bloquea la precisa. Hay que decidir: ¿para qué se usa la exacta (publicar un objeto, calcular distancia, punto de encuentro de la entrega)?, ¿quién la ve?, ¿se guarda en el servidor (contrato de `vaiven-backend`) o solo en el dispositivo?, ¿requiere enmienda de la constitución o del aviso de privacidad? Propuesta por defecto mientras no se decida: no cambiar el comportamiento.]
- Pendiente del backend: moderación de imágenes, moderación de texto ampliada, datos de demostración en staging (016-T012, con su bloqueo del `seed`).
- Pendiente de la persona: teléfono con depuración USB y autorización para instalar Maestro y `adb`.
