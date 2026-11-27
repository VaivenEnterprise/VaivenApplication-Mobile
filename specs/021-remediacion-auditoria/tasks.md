# Tareas 021 — Remediación de la auditoría de entrega-recepción (móvil)

- **Dueño:** MO-B (coordina) con MO-A · **Estado:** Fase 0 ejecutada el 2026-11-26 (T002 a T004 hechas; T001 con dos pasos pendientes de la persona); Fase 1 ejecutada el 2026-11-26 (T005 y T006); Fase 2 ejecutada y cerrada el 2026-11-27 (T007 a T010 hechas; T008 cerrada con dos corridas limpias de `npm test`, D-243); Fase 3 ejecutada y cerrada el 2026-11-27 (T011 a T016 hechas, D-244 a D-246; APK `preview` con R8 compilado en EAS y probado en teléfono por la persona, D-247); Fase 4 ejecutada en parte el 2026-11-27 (T018, T020, T031, T032, T033, T037 y T038 hechas; T017, T034 y T035 bloqueadas por el backend o la fase 6; T019 y T036 esperan la configuración externa de FCM y la prueba en teléfono; D-248 a D-250); fases 5 a 7 sin ejecutar · `[P]` = paralelizable
- Empieza cuando esta spec esté aprobada (Art. I). Cada tarea con código termina con `npm run typecheck && npm run lint && npm test` en verde. **Ninguna tarea hace commits, push ni PR; lo que toque un servicio externo se deja preparado y se pide autorización.**

### Fase 0 — Integridad de la entrega (sin funcionalidad nueva)
- [ ] **T001** Cerrar el merge y vigilar los marcadores de conflicto
  - Archivos: `memoria.md`, `PUNTAJE-VERSIONES.md`, `docs/play/seguimiento.md`, `src/__arch__/rules.security.test.ts`
  - Agente: `gestor-repo` (revisa) + `qa-mobile` · Depende de: —
  - Aceptación: CA-01; el merge con `develop` está commiteado por la persona y `git grep` no halla marcadores; `memoria.md` sin IDs repetidos; **regla S-12 nueva** que falla si un archivo versionado trae `<<<<<<<` o `>>>>>>>` (con caso negativo en memoria); `stash@{0}` revisado y descartado por la persona
  - Refs: RF-01 · A-1
  - Nota 2026-11-26 (**sin marcar**): hecho en el repositorio: el árbol de trabajo no tiene marcadores de conflicto (`git grep` sin coincidencias), `memoria.md` sin IDs repetidos (`D-206` duplicado → `D-206c`) y reglas **S-12l** y **S-12m** con caso negativo en `src/__arch__/rules.security.test.ts` (en verde). **Faltan dos pasos de la persona:** commitear el merge con `develop` (en `HEAD` los marcadores siguen en `memoria.md`, `PUNTAJE-VERSIONES.md` y `docs/play/seguimiento.md`) y revisar y descartar `stash@{0}`. Se marca al hacerlos. Ver D-233 en `memoria.md`.
- [x] **T002** Una versión y una URL de API en todos lados
  - Archivos: `app.config.ts`, `package.json`, `eas.json`, `.env.example`, `src/app.config.test.ts`
  - Agente: `dev-expo` + `qa-mobile` · Depende de: T001
  - Aceptación: CA-02; `version` igual en `app.config.ts` y `package.json`; `eas.json` (`preview` y `production`) y la documentación con la misma URL de API; una prueba falla si difieren
  - Refs: RF-02 · A-2
  - Nota 2026-11-26: `package.json` y `package-lock.json` pasan a `1.1.2` (= `app.config.ts`); `eas.json` (`preview` y `production`) y la documentación usan `…:8443`; `src/app.config.test.ts` compara versión y URL y trae caso negativo (en verde). `npx expo config --type introspect` no se ejecutó (no aplica a esta tarea). Ver D-233.
- [x] **T003** Tabla de cierres y conciliación `tasks.md` ↔ `memoria.md`
  - Archivos: `docs/calidad/evidencia-cierres.md`, `specs/013-publicacion-google-play/tasks.md`, `specs/016-pruebas-calidad/tasks.md`, `memoria.md` (solo anexar)
  - Agente: `spec-writer` + `revisor-constitucion` · Depende de: T001
  - Aceptación: CA-03; cada tarea cerrada «por indicación» (016-T009, D-228, D-229, 003-T013, 004-T010, 014-T007…) con su evidencia enlazada o marcada «sin evidencia»; **016-T009 se reabre** hasta T026; ninguna contradicción entre `tasks.md` y `memoria.md`
  - Refs: RF-03 · M-2, M-3
  - Nota 2026-11-26: `docs/calidad/evidencia-cierres.md` creada; 016-T009 **reabierta** hasta 021-T026; encabezados de estado de 003, 004, 005, 008, 013, 014 y 016 corregidos. **Pendiente de la persona:** confirmar el cierre de 005-T013 y 008-T011 (`[x]` sin cierre registrado en `memoria.md`) o reabrirlas. Ver D-234.
- [x] **T004** Discrepancias documentación ↔ código
  - Archivos: `docs/seguridad.md`, `docs/devsecops.md`, `docs/play/cumplimiento.md`, `docs/calidad/pantallas.md`, `AGENTS.md`, `memoria.md` (solo anexar)
  - Agente: `spec-writer` · Depende de: T001
  - Aceptación: las siete discrepancias de la auditoría corregidas en el texto o registradas como decisión: `expo-mcp` vs `opencode.json` (D-132), «tokens» en SecureStore (solo el refresh), revisor de `docs/devsecops.md`, aviso de notificaciones, «sin archivos amplios» (se resuelve con T012), cobertura de la matriz, Skills UX citadas que no están en el repo; el diseño de logout que ignora el fallo HTTP queda explicado (S-03)
  - Refs: RF-04 · D-1, B-7
  - Nota 2026-11-26: las siete discrepancias y el diseño de `signOut` (S-03) quedaron corregidos en el texto o explicados; no se tocó código ni `constitution.md` (`expo-mcp` queda como D-132). Ver D-235.

### Fase 1 — Entornos
- [x] **T005** **(NEEDS CLARIFICATION)** Decisión de entornos (producción, pruebas y datos)
  - Archivos: `docs/calidad/entornos.md`, `memoria.md` (solo anexar)
  - Agente: `spec-writer` + **persona** · Depende de: T003
  - Aceptación: una decisión aprobada por la persona responsable: qué host es producción y cuál de pruebas, qué datos pueden tocar las pruebas destructivas y qué cuentas se usan; **si solo hay un servidor, se escribe así** y las pruebas destructivas usan solo cuentas creadas y eliminadas en la corrida; sin crear infraestructura sin autorización
  - Refs: RF-05 · A-3
  - Nota 2026-11-26: la persona responsable aprobó en la sesión la opción «un solo servidor»: `https://vaiven-staging.westus2.cloudapp.azure.com:8443` es producción y a la vez el único de pruebas; las pruebas destructivas usan solo cuentas creadas y eliminadas en la corrida. Documentado en `docs/calidad/entornos.md`; sin crear infraestructura. Ver D-237.
- [x] **T006** Guarda de host por lista explícita
  - Archivos: `scripts/device-tests.mjs`, `scripts/device-tests.test.mjs`, `docs/calidad/dispositivo.md`, `.env.example`
  - Agente: `dev-expo` + `qa-mobile` · Depende de: T005
  - Aceptación: CA-04; la guarda acepta solo hosts de una lista explícita (variable o archivo versionado) y se niega con cualquier otro, incluso con «staging» en el nombre; pruebas con hosts permitidos, no listados y locales; el script imprime la URL activa y por qué la acepta
  - Refs: RF-06 · A-3
  - Nota 2026-11-26: la guarda de `scripts/device-tests.mjs` acepta solo `host:puerto` de `scripts/e2e-allowed-hosts.json` (o `E2E_ALLOW_API_HOST`) y redes locales; se niega con «staging» en el nombre si no está listado y el puerto cuenta (`…azure.com` sin puerto se rechaza). `node --test` sobre las pruebas de scripts: 32 en verde (21 de `device-tests`). Ver D-238. La corrida real en teléfono sigue en T026.

### Fase 2 — Calidad de las pruebas
- [x] **T007** [P] Cobertura real de la app
  - Nota 2026-11-27 (**sin marcar**): `collectCoverageFrom` ya incluye `hooks.{ts,tsx}` y `use*.{ts,tsx}` con los umbrales en 80 %, y `test:report` informa «archivos medidos: X de Y» (pruebas en `scripts/test-report.test.mjs`). Verificado por la persona con `npm test` (2026-11-27, 152 suites): cobertura global 98.79 % sentencias, 95.1 % ramas, 99.48 % funciones y 99.89 % líneas, ya con los `hooks.ts` y `use*.ts` dentro de la medición (p. ej. `useOnline.ts` 93.33 %, `useEvidenceForm.ts` 78.57 % en ramas, sin bajar de los umbrales globales). Nada se excluyó ni se bajó.
  - Archivos: `jest.config.js`, pruebas nuevas junto a lo que prueban
  - Agente: `qa-mobile` · Depende de: T002
  - Aceptación: CA-05; `collectCoverageFrom` incluye `src/features/*/hooks.ts` y `src/features/**/use*.ts`; los umbrales **siguen en 80 %**; si baja el porcentaje, se escriben las pruebas que faltan (no se excluye nada); `test:report` informa cuántos archivos se miden de cuántos existen
  - Refs: RF-07 · M-1
- [x] **T008** [P] Higiene de Jest
  - Cierre 2026-11-27 (D-243): la causa de «worker failed to exit gracefully» era el `fetch` falso de `src/test/fakeApi.ts`, que ignoraba `signal`; con un handler que nunca responde, el temporizador de 10 s de `apiFetch` quedaba vivo. Ahora el doble rechaza con `AbortError` al abortar y `jest.setup.ts` aborta en `afterEach` lo que siga sin respuesta. Dos corridas de `npm test`: 152 suites, 1898 pruebas, 0 avisos `act`, sin el mensaje del worker; cobertura 98.79 / 95.1 / 99.48 / 99.89 %.
  - Nota 2026-11-27 (antes del cierre): hecho: `jest.setup.ts` desactiva la recolección de React Query en pruebas (`gcTime: Infinity` por defecto; era la causa de «Jest did not exit one second after the test run») y vacía dentro de `act` las notificaciones diferidas antes de cada `afterEach`; `ProfileScreen.test.tsx` espera a que termine la consulta. Con eso desaparecieron los avisos `act(...)` de `ProfileScreen`, `EvidenceScreen` y `BookingDetailScreen`. **Falta**: quedan avisos `HookContainer`/`OpenChatButton` sueltos en algunas suites de hooks (p. ej. `bookings/api.test.tsx`, `usePushRegistration.test.tsx`) y no se pudo correr `npm test` completo en el entorno de la sesión; se corrieron 140 suites sin fallos (ver memoria D-240). Añadido después: `jest.setup.ts` espera (hasta ~1 s) a que terminen las consultas en vuelo antes de cada prueba y `OpenChatButton.test.tsx` deja llegar la respuesta dentro de `act`. Con la corrida real de la persona (`npm test`, 2026-11-27) no hay «did not exit» ni «worker failed to exit», pero quedaron avisos `act(...)` en: `incidents/screens.security`, `incidents/screens.test` (IncidentSection), `handover/api`, `ItemFormScreen`, `useListingSuggestion`, `chat/api`, `recommendations/hooks`, `ProfileScreen`, `usePushRegistration` y `NotificationsBootstrap`. Se corrigió de raíz entregando las notificaciones de React Query dentro de un `act` síncrono (`notifyManager.setNotifyFunction` en `jest.setup.ts`); falta que la persona repita `npm test` y confirme que ya no aparece ninguno. Los avisos que había antes dependían de la velocidad (aparecen en el primer test de una suite que carga en frío); para atribuirlos en tu máquina basta correr `npm test 2>&1 | grep -B3 "not wrapped in act"` y, si hace falta, imprimir `expect.getState().currentTestName` desde un `console.error` temporal.  - Archivos: pruebas con temporizadores o avisos `act(...)`
  - Agente: `qa-mobile` · Depende de: T007
  - Aceptación: `npm test` sin «worker failed to exit gracefully» ni avisos `act(...)`; se limpian temporizadores o se corrigen las esperas, sin quitar pruebas
  - Refs: RF-08 · B-3
- [x] **T009** [P] Matriz completa y seguridad por pantalla sensible
  - Nota 2026-11-27: matriz regenerada con los endpoints de los *slots* y la sección `/ai/assistant/*` (ambas operaciones «no consumido», con motivo y tareas T020/T032); cinco suites propias en verde: `LoginScreen`, `RegisterScreen`, `EditProfileScreen`, `ChatScreen` e incidencias (`screens.security.test.tsx`); pruebas de `scripts/screens-report` para registros de slots, import y asistente.
  - Archivos: `scripts/screens-report.mjs`, `docs/calidad/pantallas.md`, `docs/calidad/pantallas-notas.md`, `*.security.test.tsx` de inicio, registro, editar perfil, chat e incidencias
  - Agente: `qa-mobile` + `spec-writer` · Depende de: T007
  - Aceptación: la matriz incluye los endpoints de los *slots* y `/ai/assistant/*` (consumido o no, con motivo); las cinco pantallas con entradas sensibles tienen prueba de seguridad propia; el resto sigue justificado por capa
  - Refs: RF-09 · M-8, P-3
- [x] **T010** [P] Prueba de contrato
  - Archivos: `src/__e2e__/contract.test.ts`, `scripts/contract-check.mjs`, `scripts/contract-check.test.mjs`, `package.json` (script `test:contract`)
  - Agente: `qa-mobile` + `dev-expo` · Depende de: T009
  - Aceptación: las respuestas de `fakeApi` validan contra `../vaiven-backend/api/openapi.yaml` (solo lectura); `npm run test:contract` hace **solo `GET`** contra la API configurada y falla con mensaje claro si no responde; sin credenciales ni escrituras
  - Refs: RF-10 · P-2
  - Nota 2026-11-27: `scripts/contract-lib.cjs` (validador OpenAPI 3.1 sin dependencias nuevas; usa `js-yaml`, ya presente en el lockfile como dependencia transitiva), `scripts/contract-check.mjs` (+ `.test.mjs`, 5 pruebas) y `src/__e2e__/contract.test.ts` (recorrido de `fakeApi` validado contra `../vaiven-backend/api/openapi.yaml`; se omite con aviso si el contrato no está junto al repositorio; `VAIVEN_OPENAPI` cambia la ruta). `npm run test:contract` solo hace `GET` públicos sin parámetros y sin credenciales; con la API caída falla con «la API no responde en …». Pendiente de la persona: correrlo contra el staging real. Los campos que el contrato exige y la app aún no consume quedan en una lista que solo puede encogerse (`HUECOS_CONOCIDOS`).

### Fase 3 — Endurecimiento de la app (compatible con Expo Go)
- [x] **T011** **(NEEDS CLARIFICATION)** Aprobar las dependencias de Expo y registrarlas
  - Cierre 2026-11-27 (D-244): la persona aprobó las tres; instaladas con `npx expo install` (SDK 58: `expo-screen-capture` ~58.0.6, `expo-local-authentication` ~58.0.3, `expo-build-properties` ~58.0.12); justificación en `plan.md` §2 «Dependencias aprobadas».
  - Archivos: `plan.md` (justificación), `memoria.md` (solo anexar), `package.json`
  - Agente: `spec-writer` + **persona** · Depende de: T005
  - Aceptación: aprobación de `expo-screen-capture`, `expo-local-authentication` (opcional) y `expo-build-properties`; cada una con su justificación y su registro; las que no se aprueben quedan fuera y T014/T015 se ajustan
  - Refs: RNF-03 · Art. X
- [x] **T012** Permisos y copia de seguridad
  - Cierre 2026-11-27 (D-245): `allowBackup: false`, los tres permisos en `blockedPermissions`, `locationAlways*Permission: false` y `microphonePermission: false` en `expo-camera` (sin valor, los plugins agregan sus textos por defecto). `npx expo config --type introspect` lo confirma (CA-06); `cumplimiento.md` lista el manifiesto efectivo; S-12g ahora exige `false`, S-08b fija la lista y S-12n vigila el backup.
  - Archivos: `app.config.ts`, `src/app.config.test.ts`, `docs/play/cumplimiento.md`
  - Agente: `dev-expo` + `qa-mobile` · Depende de: T002
  - Aceptación: CA-06; `allowBackup: false`; `SYSTEM_ALERT_WINDOW`, `READ_EXTERNAL_STORAGE` y `WRITE_EXTERNAL_STORAGE` en `android.blockedPermissions`; sin `NSLocationAlways*` ni micrófono en iOS; `npx expo config --type introspect` lo confirma; `cumplimiento.md` coincide; la regla S-08/S-12 actualiza la lista declarada
  - Refs: RF-11 · M-5
- [x] **T013** [P] Subida de imágenes: solo https y solo Cloudinary
  - Cierre 2026-11-27 (D-245): `isAllowedUploadUrl` (expresión anclada: `https://api[-región].cloudinary.com/v1_1/...`); el rechazo ocurre antes de crear el `XMLHttpRequest`. S-11g/S-11h con 12 casos negativos (http, otro dominio, dominio parecido, credenciales, puerto, `javascript:`, `file:`, consulta añadida…).
  - Archivos: `src/features/images/cloudinary.ts`, `src/features/images/upload.security.test.ts`
  - Agente: `dev-expo` + `qa-mobile` · Depende de: T002
  - Aceptación: `uploadUrl` se rechaza si no es `https` o no es del dominio de Cloudinary; prueba negativa (URL de otro dominio, `http`, esquema raro); nada se sube en ese caso
  - Refs: RF-12 · B-4
- [x] **T014** [P] Sesión sin red y una sola consulta a `/meta`
  - Cierre 2026-11-27 (D-245): sin red o con 5xx al arrancar, `status` sigue en `loading` con `restoreOffline` y `RestoringScreen` muestra «Sin conexión» con «Reintentar» (y reintenta al volver a primer plano); 401/403 sigue cerrando la sesión; reintentos sin solaparse. `/meta` en una consulta compartida (`src/lib/api/serverFeatures.ts`). Pruebas: `session.test.tsx`, S-04d, `RestoringScreen.test.tsx`, `session.integration.test.tsx` (árbol real) y `serverFeatures.test.tsx`.
  - Archivos: `src/features/auth/session.tsx`, `src/features/ai-suggestions/api.ts`, `src/features/recommendations/api.ts`, pruebas
  - Agente: `dev-expo` + `qa-mobile` · Depende de: T002
  - Aceptación: con tokens guardados y sin red el arranque conserva la sesión (muestra el estado sin conexión, no el login) y un 401/403 sigue cerrándola; `/meta` se consulta una vez y comparte caché; pruebas de ambos
  - Refs: RF-13 · B-5, B-6
- [x] **T015** [P] Protección de sesión y pantallas sensibles
  - Cierre 2026-11-27 (D-245): `useSensitiveScreen()` en login, registro, bloqueo, perfil, editar perfil, evidencia y QR; inactividad de 15 min (`INACTIVITY_TIMEOUT_MS`, prop `inactivityTimeoutMs`) que cierra la sesión o, con biometría activada en Perfil, la bloquea; nada nuevo fuera de SecureStore. Pruebas S-14a…S-14e (`sessionProtection.security.test.tsx`), `BiometricUnlockRow.test.tsx` y aviso del login. `ux-audit` ejecutado.
  - Archivos: `src/features/auth/`, pantallas de perfil y de evidencia, `app.config.ts`, pruebas
  - Agente: `dev-expo` + `qa-mobile` · Depende de: T011
  - Aceptación: bloqueo de capturas en pantallas sensibles, cierre de sesión por inactividad (tiempo configurable y probado) y, si se aprobó, biometría opcional para volver a entrar; sin guardar nada nuevo fuera de SecureStore; pruebas de seguridad nuevas (S-14…)
  - Refs: RF-14 · A-5
- [x] **T016** **(NEEDS CLARIFICATION)** Ofuscación y excepción formal de los controles nativos
  - Cierre 2026-11-27 (D-246): R8 y recorte de recursos en las compilaciones release (`production` y `preview`), confirmado con `introspect`; excepción formal en `docs/calidad/seguridad-nivel.md`, aprobada por la persona; `constitution.md` sin cambios. La persona compiló el APK `preview` con R8 en EAS y lo probó en su teléfono el 2026-11-27: todo funcionó (D-247). **Pendiente**: subir `mapping.txt` de cada AAB a Play.
  - Archivos: `app.config.ts` (`expo-build-properties`), `docs/calidad/seguridad-nivel.md`, `memoria.md` (solo anexar)
  - Agente: `dev-expo` + `spec-writer` + `revisor-constitucion` · Depende de: T011
  - Aceptación: R8 activado en el perfil `production`; `seguridad-nivel.md` explica por qué pinning, detección de root y Play Integrity no se implementan (Art. XIV.2, sin pagos en la app), con el riesgo, el alcance y qué se haría con una enmienda; la persona responsable la aprueba o decide la enmienda; **no se cambia `constitution.md`**
  - Refs: RF-15 · A-5

### Fase 4 — Backend y push (la app muestra lo que decide el servidor)
> T031–T038 (contrato del backend y defectos reportados F-1 a F-3) siguen la numeración después de T030 pero **pertenecen a esta fase**; no cambian el orden de T001–T030.
- [ ] **T017** Moderación de imágenes: lado móvil
  - Parte de backend (clasificar imágenes y definir el rechazo en el contrato): **no corresponde al frontend**, ver B-1. Queda abierta solo la parte de app, que empieza cuando B-1 esté en `openapi.yaml`.
  - Estado 2026-11-27 (D-248): **bloqueada**. El backend no clasifica imágenes: `vaiven-backend/specs/018-hardening-seguridad` no incluye moderación de imágenes y `openapi.yaml` no define cómo se rechaza una foto (ni código, ni campo, ni etapa: firma, subida o `POST /items`). Preparar la pantalla sin ese contrato sería inventar nombres (P-05, P-12); se retoma cuando el backend publique el rechazo en el contrato.
  - Archivos: `src/lib/api/moderation.ts`, `src/features/images/`, `src/features/items/`, `src/features/profile/`, pruebas
  - Agente: `dev-expo` + `qa-mobile` · Depende de: backend 018 (moderación de imágenes) y T013
  - Aceptación: CA-07; el rechazo de imagen del servidor se muestra con motivo y salida, no deja la foto en el formulario y no sube nada más; vale para objetos, perfil y evidencia; pruebas con la API simulada; **la clasificación la hace el servidor** (si el backend aún no la tiene, la tarea queda «preparada» y se anota)
  - Refs: RF-16 · A-4
- [x] **T018** [P] Moderación de texto ampliada: lado móvil
  - Cierre 2026-11-27 (D-248), **lado móvil**: perfil (`displayName`; el contrato no tiene `bio`), calificaciones (`comment`), incidencias (`description`) y reportes (`details`) leen el rechazo con `moderationFromError` (formato del backend 011) y lo muestran en el campo con el motivo del servidor y un aviso general; lo escrito se conserva y el error se borra al editar. Pruebas con la API simulada en las cuatro pantallas. **Pendiente del backend**: hoy solo modera objetos, chat y asistente; cuando la 018 amplíe el filtro a estos campos no hace falta cambiar la app si mantiene el formato.
  - Archivos: pantallas y `api.ts` de perfil, calificaciones, incidencias y reportes, pruebas
  - Agente: `dev-expo` + `qa-mobile` · Depende de: backend 018 (moderación de texto ampliada)
  - Aceptación: perfil (nombre y bio), calificaciones, incidencias y reportes muestran el rechazo `validation_failed` de moderación por campo sin romper la pantalla; pruebas de cada una
  - Refs: RF-17 · M-6
- [ ] **T019** **(NEEDS CLARIFICATION)** Push en Android (FCM)
  - Estado 2026-11-27 (D-250): **parte de la app preparada; falta la parte externa**. `app.config.ts` declara `android.googleServicesFile` desde la variable de archivo de EAS `GOOGLE_SERVICES_JSON` (sin ella, Expo Go y local siguen igual) y `google-services.json` queda en `.gitignore`; pruebas en `src/app.config.test.ts`. **No es trabajo del backend**: el servidor ya envía por el servicio de push de Expo, y es Expo quien necesita la credencial de FCM para entregar en Android. Pendiente de quien administra Expo/Firebase (con autorización): crear el proyecto de Firebase con el paquete `mx.vaiven.app`, subir `google-services.json` como variable de archivo `GOOGLE_SERVICES_JSON` en EAS, subir la clave FCM V1 en las credenciales de EAS y recompilar.
  - Archivos: `app.config.ts`, `docs/play/cumplimiento.md`, `docs/calidad/pruebas.md`, `memoria.md` (solo anexar)
  - Agente: `dev-expo` + **administrador** · Depende de: T002
  - Aceptación: CA-08; proyecto de Firebase y credenciales subidas a EAS por quien administra la cuenta (**servicio externo: se pide autorización**); el AAB instalado obtiene un token y recibe un aviso de prueba, con evidencia sin datos personales; lo que Expo Go no permita probar se anota
  - Refs: RF-18 · M-4
- [x] **T020** **(NEEDS CLARIFICATION)** Asistente de proyectos: implementar o declarar fuera de alcance
  - Cierre 2026-11-27 (D-250): **decisión de la persona: implementar.** Se hace en T032.
  - Archivos: `src/features/ai-suggestions/` o `specs/014-ia-sugerencias/spec.md`, `memoria.md` (solo anexar)
  - Agente: `spec-writer` + **persona** · Depende de: T009
  - Aceptación: decisión de la persona: implementar el consumo de `/ai/assistant/*` con sus pruebas, o declararlo fuera de alcance de la 014 con motivo y actualizar la matriz y el informe
  - Refs: RF-19 · M-8

- [x] **T031** Inventario del contrato y prueba de cobertura
  - Cierre 2026-11-27 (D-248): `docs/calidad/contrato-endpoints.md` clasifica las 69 operaciones (61 consumidas, 6 `/admin/*` fuera de alcance móvil, 2 del asistente pendientes de T020); `src/__e2e__/contract-coverage.test.ts` lee el contrato sin red y falla ante una operación sin clasificar, una fila que no existe, un estado desconocido, `/admin/*` no excluida o un archivo citado inexistente (casos negativos incluidos).
  - Archivos: `docs/calidad/contrato-endpoints.md`, `src/__e2e__/contract-coverage.test.ts`, `memoria.md` (solo anexar)
  - Agente: `qa-mobile` + `spec-writer` · Depende de: —
  - Aceptación: CA-12; las 69 operaciones de `vaiven-backend/api/openapi.yaml` clasificadas (consumida / fuera de alcance móvil con motivo / pendiente); las 6 de `/admin/*` quedan «fuera de alcance móvil» (RF-29); la prueba lee el `openapi.yaml` (solo lectura, sin red) y falla ante una operación sin clasificar, con caso negativo
  - Refs: RF-28, RF-29 · C-1
- [x] **T032** **(NEEDS CLARIFICATION)** Asistente de proyectos: consumo del contrato
  - Cierre 2026-11-27 (D-250): ruta `/asistente` (pila raíz, con sesión) y acceso desde Inicio por el *slot* `renderHeaderExtra`, solo con `features.aiSuggestions`. Consume `POST /ai/assistant/messages` (continúa con `conversationId`; ubicación aproximada solo si ya hay permiso) y `DELETE /ai/assistant/conversations/{id}` («Nueva conversación»). Muestra resumen, lo que se necesita con quién lo tiene (reutiliza `ToolRow`; «Conseguir» abre el objeto y la solicitud sigue la 007), pasos y cuidados. Errores: moderación y 400 en el campo; 404 (caducó), 429 y 503 con aviso. Solo envía lo escrito, nunca datos del chat. `src/features/ai-suggestions/assistant.test.tsx` (19 casos, la respuesta simulada validada contra `openapi.yaml`); `contrato-endpoints.md`: 63 consumidas, 0 pendientes. Sin probar en teléfono.
  - Archivos: `src/features/ai-suggestions/` (api, hooks, pantalla), pruebas, `docs/calidad/contrato-endpoints.md`
  - Agente: `dev-expo` + `qa-mobile` · Depende de: T020 (decisión «implementar») y T031
  - Aceptación: solo si T020 decide implementar; consume `POST /ai/assistant/messages` y `DELETE /ai/assistant/conversations/{id}` con `features.aiSuggestions` activo, errores por campo y moderación, sin datos del chat entre personas; pruebas con la API simulada validadas contra `openapi.yaml`; si T020 decide «fuera de alcance», esta tarea se cierra como no aplicable con la decisión enlazada
  - Refs: RF-30 · C-2
- [x] **T033** Tolerar el 401 `stepUp` (preparación para el backend 019)
  - Cierre 2026-11-27 (D-248): `fromServerError` convierte un 401 con `details[].field == "stepUp"` en el código de cliente `step_up_required` (mensaje en `es.errors`); `request` no renueva ni cierra la sesión ante él, y la restauración no borra el token guardado. Pruebas S-02h/i/j (cliente: sin renovación, sin bucle, el 401 vencido cierra como antes), S-15a/b/c (sesión) y la pantalla «Editar perfil» (conserva lo escrito y reintenta). La pantalla de confirmación de identidad llega con T034.
  - Archivos: `src/features/auth/session.tsx`, `src/lib/api/`, pruebas (`*.security.test.*`)
  - Agente: `dev-expo` + `qa-mobile` · Depende de: T011
  - Aceptación: CA-13; el cliente revisa `error.details` (`field: "stepUp"`) antes de tratar un 401 como sesión vencida; con `stepUp` conserva la sesión, no pierde lo escrito y ofrece reintentar; con sesión vencida cierra la sesión como hoy; pruebas de ambos casos y de que el refresco de sesión no entra en bucle; **debe estar lista antes de que el backend encienda las banderas de la 019**
  - Refs: RF-31 · C-3
- [ ] **T034** **(NEEDS CLARIFICATION)** Identidad fuerte: MFA, recuperación y sesiones
  - Parte de backend (aprobar la 019 y publicar sus rutas): **no corresponde al frontend**, ver B-3.
  - Estado 2026-11-27: **bloqueada**. La spec 019 del backend sigue en borrador y sus rutas no están en `openapi.yaml`.
  - Archivos: `src/features/auth/`, `src/features/profile/` (seguridad de la cuenta), `src/i18n/`, pruebas, `docs/calidad/contrato-endpoints.md`
  - Agente: `dev-expo` + `qa-mobile` · Depende de: T033 y backend 019 aprobada y publicada en `openapi.yaml`
  - Aceptación: CA-14; **bloqueada** hasta que las rutas existan en el contrato (los nombres actuales son tentativos y no se implementa nada fuera de él); al desbloquearse: enrolar/verificar/desactivar MFA, códigos de recuperación, segundo paso de `login`, confirmación de identidad para rutas sensibles, `GET /me/sessions` y `DELETE /me/sessions/{id}`; sin guardar el secreto TOTP ni los códigos fuera de `SecureStore`/memoria, sin registrarlos en logs; dependencia nueva solo con registro (Art. X.4)
  - Refs: RF-32 · C-4
- [ ] **T035** Prueba con compresión HTTP activa (backend 018, T014)
  - Parte de backend (compresión desplegada en staging): **no corresponde al frontend**, ver B-4. La prueba en sí es móvil (el backend la asigna al móvil en su 018-T014).
  - Estado 2026-11-27: **bloqueada**. Depende de T025 (fase 6) y de la compresión en staging (backend 018-T008, sin hacer).
  - Archivos: `src/__e2e__/compression.integration.test.ts`, `.maestro/` (si aplica), `docs/calidad/dispositivo/`
  - Agente: `qa-mobile` · Depende de: T025 y backend 018 (T008, compresión en staging)
  - Aceptación: CA-15; con `Accept-Encoding` activo la app muestra igual listas y perfil; el JSON es idéntico al de sin compresión; las rutas con secretos no llegan comprimidas; resultado archivado con fecha, comando y API usada; si el backend aún no la tiene activa, queda **bloqueada** y se anota
  - Refs: RF-33 · C-5

- [ ] **T036** Notificaciones push: reproducir, diagnosticar y corregir
  - Estado 2026-11-27 (D-250): **reproducido por la persona**: con el permiso concedido, «Activar» muestra «No pudimos activar los avisos». Ese texto sale cuando `registerDevice()` no obtiene token (o falla `POST /me/push-tokens`); como el proyecto no tenía FCM configurado y `getExpoToken()` devuelve `null` ante la excepción de Android, el eslabón roto es **el token**. Corrección de la app: T019 (config preparada y probada). **Falta**: la parte externa de T019, recompilar y verificar en el teléfono token, registro y aviso con la app abierta, en segundo plano y cerrada.
  - Archivos: `src/features/notifications/` (`push.ts`, `usePushRegistration.ts`, `api.ts`, `NotificationsBootstrap.tsx`), `app.config.ts` si falta algo del lado de la app, `docs/calidad/pruebas.md`, `memoria.md` (solo anexar), pruebas
  - Agente: `dev-expo` + `qa-mobile` · Depende de: T002; la parte de Android depende de T019 (FCM y credenciales en EAS, **servicio externo: se pide autorización**)
  - Aceptación: CA-16; primero se **reproduce** en un teléfono (AAB o APK instalado) y se anota el síntoma exacto (¿no hay token?, ¿no se registra en el servidor?, ¿el servidor envía y no llega?); se sigue la cadena permiso → canal → `getExpoPushTokenAsync` con el `projectId` de EAS → `POST` del token → envío → recepción y se identifica el eslabón roto; la corrección lleva una prueba que habría fallado antes; evidencia sin datos personales; lo que Expo Go no permita probar se anota
  - Refs: RF-34 · F-1, M-4
- [x] **T037** Edición de objeto: reproducir, diagnosticar y corregir
  - Cierre 2026-11-27 (D-250): **síntoma** (persona): al guardar «no guarda», «Volver» lleva a otra vista y al regresar a Mis objetos sigue abierta la edición. **Causa**: la edición vivía en la pila de la pestaña Mis objetos (`(tabs)/mis-objetos/[id]/editar`) y se abría desde el detalle, que está en la pila raíz; al terminar, `router.back()` salía a Inicio y la pestaña conservaba la edición. El `PATCH` sí se enviaba y cumple `ItemUpdate`. **Corrección**: la ruta pasa a `objeto/[id]/editar` (pila raíz, registrada en `SIGNED_IN_SCREENS`). `src/features/items/editItem.integration.test.tsx` (árbol real de rutas) fallaba antes (volvía a `/inicio`) y ahora pasa. 409 y 403 ya se explicaban conservando lo escrito (`ItemFormScreen.test.tsx`). **Fuera de esta corrección**: editar fotos (la 005 lo dejó fuera de alcance) y un botón «recargar» ante el 409; el aviso pide volver a abrir el objeto.
  - Archivos: `src/features/items/` (`screens/EditItemScreen.tsx`, `screens/ItemFormScreen.tsx`, `hooks.ts`, `api.ts`), pruebas
  - Agente: `dev-expo` + `qa-mobile` · Depende de: T002
  - Aceptación: CA-17; se reproduce con un objeto propio y se anota el síntoma (¿no abre?, ¿no guarda?, ¿error del servidor?, ¿no refresca el detalle?); se contrasta `PATCH /items/{id}` y su `version` con `../vaiven-backend/api/openapi.yaml` (solo lectura); la corrección lleva una prueba de pantalla y de cliente que habría fallado antes; 409 y 403 se muestran sin perder lo escrito; si la causa está en el backend, se anota y se avisa sin tocarlo
  - Refs: RF-35 · F-2
- [x] **T038** **(NEEDS CLARIFICATION)** Ubicación exacta
  - Cierre 2026-11-27 (D-250): **decisión de la persona: solo la ubicación aproximada.** No cambia nada: `ACCESS_FINE_LOCATION` sigue bloqueado y las reglas S-08a/S-08b/S-12g siguen igual; `cumplimiento.md` ya declara solo la aproximada. Motivo: Art. VIII.4 (mínimo alcance) y sin necesidad funcional definida para la exacta.
  - Archivos: `app.config.ts`, `src/features/items/components/LocationField.tsx`, `src/features/search/useLocation.ts`, `src/app.config.test.ts`, `src/__arch__/rules.security.test.ts` (S-08a/S-08b/S-12g), `docs/play/cumplimiento.md`, `memoria.md` (solo anexar)
  - Agente: `spec-writer` + **persona** (decisión) y después `dev-expo` + `qa-mobile` · Depende de: T012 y la decisión de §7
  - Aceptación: CA-18; **sin decisión no se cambia nada**; con decisión aprobada: permiso de ubicación precisa con texto en español, las reglas S-08a/S-08b/S-12g se actualizan **con la decisión escrita** (no se borran para dar verde), la ubicación exacta no aparece en listados públicos (Art. VIII.4), el aviso de privacidad y `cumplimiento.md` coinciden antes de publicar; si hace falta un campo nuevo en el contrato del backend, se pide y no se inventa; si exige enmienda a la constitución, se **propone** por escrito (no se modifica `constitution.md`)
  - Refs: RF-36 · F-3

#### Trabajo de backend de esta fase — **NO CORRESPONDE al frontend**
> Decisión de la persona responsable del frontend (2026-11-27, D-249): lo que es 100 % del backend no se ejecuta ni se cuenta en esta spec móvil. Se entregó al backend en `../vaiven-backend/docs/pendientes-backend-desde-movil-021.md`. Las tareas móviles que esperan cada punto siguen abiertas con su parte de app.
- **B-1 · NO CORRESPONDE (backend)** Moderación de imágenes en el servidor y su rechazo en `openapi.yaml` (no existe spec en el backend) → desbloquea T017
- **B-2 · NO CORRESPONDE (backend)** Filtro de texto en `PATCH /me` (`displayName`), calificaciones (`comment`), incidencias (`description`) y reportes (`details`), con el formato actual → T018 ya está lista en la app
- **B-3 · NO CORRESPONDE (backend)** Aprobar la spec 019 y publicar sus rutas en el contrato; coordinar antes de encender sus banderas → desbloquea T034
- **B-4 · NO CORRESPONDE (backend)** Compresión HTTP (018-T008) desplegada en staging → desbloquea T035 (= backend 018-T014)
- **B-5 · NO CORRESPONDE (backend)** Datos de demostración en staging (016-T012) → desbloquea T026 (fase 6)
- **B-6 · NO CORRESPONDE (backend)** Verificar el envío de push del servidor, solo si con FCM configurado el token se registra y el aviso no llega → T036

### Fase 5 — DevSecOps CI/CD
- [ ] **T021** [P] Auditoría de dependencias portable y al día
  - Archivos: `.github/scripts/audit.mjs`, `.github/scripts/audit.test.mjs`, `.github/audit-exceptions.json`, `docs/seguridad.md`
  - Agente: `dev-expo` + `qa-mobile` · Depende de: —
  - Aceptación: `audit.mjs` funciona en Windows y en Linux (prueba de ambos casos); la excepción `GHSA-fc5q-39xc-vjpf` se mantiene solo si `npm audit` aún la necesita (si no, se retira), con vencimiento; `docs/seguridad.md` cita las cifras reales de `npm audit`
  - Refs: RF-20 · B-1, M-9
- [ ] **T022** [P] SBOM y análisis estático móvil en el CI
  - Archivos: `.github/workflows/ci.yml`, `docs/devsecops.md`
  - Agente: `gestor-repo` + `dev-expo` · Depende de: T021
  - Aceptación: el CI genera un SBOM CycloneDX como artefacto y corre un análisis estático móvil (por ejemplo `mobsfscan`) sin dependencias nuevas en la app; acciones fijadas por SHA como las actuales; el job nuevo forma parte del *gate*
  - Refs: RF-21 · M-7
- [ ] **T023** **(NEEDS CLARIFICATION)** CD manual preparado
  - Archivos: `.github/workflows/release.yml`, `docs/devsecops.md`, `docs/play/lanzamiento.md`
  - Agente: `gestor-repo` + **administrador** · Depende de: T022
  - Aceptación: CA-09; flujo `workflow_dispatch` con entorno de revisor obligatorio que construye con EAS usando `EXPO_TOKEN` desde secretos; **preparado y sin ejecutar**; la documentación explica cómo se activa y quién aprueba; **se pide autorización antes de crear el secreto o ejecutarlo**
  - Refs: RF-22 · M-7
- [ ] **T024** Método del «porcentaje de seguridad DevSecOps»
  - Archivos: `docs/calidad/seguridad-devsecops.md`
  - Agente: `spec-writer` + `revisor-constitucion` · Depende de: T016, T022
  - Aceptación: lista de prácticas (de pipeline y de la app) con su peso, su estado y su evidencia, y el resultado calculado con la fórmula escrita; reproducible por cualquier evaluador; no se redondea a favor
  - Refs: RF-23 · P-1

### Fase 6 — Evidencia en dispositivo
- [ ] **T025** Flujos Maestro estrictos y nuevos
  - Archivos: `.maestro/*.yaml`, `scripts/device-tests.mjs`, `docs/calidad/dispositivo.md`
  - Agente: `qa-mobile` + `dev-expo` · Depende de: T006
  - Aceptación: `03-solicitud` falla si falta `E2E_ITEM_TITLE`; `02-explorar` exige resultados; nuevos flujos: publicar un objeto con foto, chat y borrar el historial de recomendaciones; la sugerencia de IA se comprueba cuando el servidor la tiene activa; los textos salen de `src/i18n/`
  - Refs: RF-24 · B-2
- [ ] **T026** Ejecución real en el teléfono con informe archivado
  - Archivos: `docs/calidad/dispositivo/` (informe JUnit y registro), `memoria.md` (solo anexar)
  - Agente: `probador-expo` + **persona** · Depende de: T025, T005 y backend 016-T012 (datos en la API de pruebas)
  - Aceptación: CA-10; `adb devices` lista el teléfono, Maestro instalado **con autorización**, `npm run test:device` en verde, `informe-<fecha>.xml` y `ultima-ejecucion.json` en `docs/calidad/dispositivo/` con la API usada; la cuenta de prueba se elimina al final; 016-T009 se vuelve a cerrar con esa evidencia
  - Refs: RF-25 · M-2
- [ ] **T027** [P] Evidencia mínima de las specs 003–012
  - Archivos: `docs/evidencia/003` a `docs/evidencia/012` (capturas), `docs/calidad/evidencia-cierres.md`
  - Agente: `probador-expo` + **persona** · Depende de: T026
  - Aceptación: capturas de una cuenta de demostración (sin datos personales) de los flujos clave de cada spec en un teléfono real, o la ausencia documentada con motivo; la tabla de cierres se actualiza
  - Refs: RF-26 · M-2

### Fase 7 — Medición y cierre
- [ ] **T028** Informe de pruebas actualizado
  - Archivos: `docs/calidad/pruebas.md`, `docs/calidad/conteo.json`, `memoria.md` (solo anexar)
  - Agente: `qa-mobile` + `spec-writer` · Depende de: T007 a T027
  - Aceptación: conteo real de `npm run test:report` (suites, casos, cobertura sobre los archivos medidos), fecha y comando; lo no ejecutado dice «no ejecutado»
  - Refs: RF-27
- [ ] **T029** Reauditoría con los dos prompts
  - Archivos: `docs/calidad/reauditoria.md`, `memoria.md` (solo anexar)
  - Agente: `revisor-constitucion` (rol evaluador) + **persona** · Depende de: T028
  - Aceptación: CA-11; se repiten la auditoría de Claude y la de OpenCode con sus prompts; se registra la nota de cada una con su método, los hallazgos que quedan y por qué; meta **≥ 90 en ambas**; si no se alcanza, se escribe qué falta y de qué depende
  - Refs: RF-27
- [ ] **T030** Verificación final
  - Archivos: `memoria.md` (solo anexar), `PUNTAJE-VERSIONES.md`, `ROADMAP.md`, `docs/evidencia/021/`
  - Agente: `probador-expo` · Depende de: T029 y todas las anteriores `[x]`
  - Aceptación: `npm run typecheck && npm run lint && npm test`, `npm run test:security` y `npm run test:report` en verde; AAB con la versión final instalado en un teléfono (sesión, datos y recomendaciones visibles); recorrer CA-01 a CA-11 y anotar el resultado de cada uno; **la persona decide si se sube a Play**
  - Refs: Art. XIV.4

| Total | 38 tareas |
|---|---|
