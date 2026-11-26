# Pendientes OpenCode — Auditoría de entrega-recepción (móvil)

> Auditoría en solo lectura contra la «Auditoría de evaluación v2 (18/nov/2026)», secciones 2 (Móvil) y 3 (Pruebas de automatización).
> Fecha de la auditoría: 26/nov/2026. Rama: `spec/SPEC-16`, HEAD `f73c92e`.
> Estado del árbol al terminar: `git status --porcelain` vacío. No se hicieron commits, push ni PRs. No se modificó `constitution.md`.
> Los scripts auxiliares usados para contar endpoints viven en `%TEMP%`, fuera del repositorio.

---

## A) Tablas

### 1. Cuestionario sección 2 (Móvil)

| Pregunta | Respuesta | Evidencia | Estado |
|---|---|---|---|
| 1. ¿Qué porcentaje de seguridad tiene el proyecto según mejores prácticas DevSecOps? | No existe una métrica porcentual definida en el repositorio: dar un número sería inventarlo. Metodología aplicada: (a) compilación estática, (b) 10 suites de seguridad, (c) reglas arquitectónicas S-01…S-13, (d) `npm audit`, (e) Gitleaks y CodeQL en CI, (f) revisión OWASP manual. Desglose cualitativo: 6 prácticas cumplen (validación, secretos, almacenamiento, comunicaciones HTTPS, permisos, CI), 3 son parciales (cadena de suministro, configuración, cifrado), 1 no cumple (protección de binario). | `npm run typecheck` exit 0; `npm run lint` exit 0; `npm run test:security` → 10 suites / 94 pruebas; `npm audit --json` → `high=0, critical=0, moderate=27`; `.github/workflows/ci.yml:74-88,103-112`; `src/__arch__/rules.security.test.ts:30-74`; búsqueda de `pinning\|jailbreak\|rootDetection\|frida\|antiDebug\|antiTamper\|obfuscat\|Biometrics` en `src/` → 0 coincidencias | Parcial |
| 2. ¿Cumple OWASP Mobile Top 10 (M1–M10)? | Ver tabla OWASP separada abajo. Resumen: 5 Cumple, 3 Parcial, 2 No cumple/Parcial profunda. | Tabla siguiente | Parcial |
| 3. ¿Vulnerabilidades críticas DevSecOps? | `npm audit`: 0 críticas, 0 altas, 27 moderadas, 1.391 dependencias. Excepción vigente `GHSA-fc5q-39xc-vjpf` (`picomatch` ReDoS, herramientas de build) hasta `2026-12-18`. Búsqueda de secretos en código: sin hallazgos reportables. Gitleaks corre en CI con checksum verificado. | `npm audit --json` → `{"info":0,"low":0,"moderate":27,"high":0,"critical":0,"total":27}`, exit 1 por moderadas; `.github/audit-exceptions.json`; `.github/workflows/ci.yml:74-88`; `docs/seguridad.md:5-10` | Cumple con observación |
| 4. ¿Nivel bancario/fintech? | No. Hay SecureStore + HTTPS + validación zod, pero **no** hay certificate pinning, detección de root/jailbreak, biometría, ofuscación ni cifrado propio. Además la app no ejecuta pagos (Art. V.4 de la constitución), así que el nivel fintech no es exigible ni está implementado. | Búsqueda en `src/` de `certificatePinning\|sslPinning\|pinning\|jailbreak\|isRooted\|rootDetection\|frida\|antiDebug\|antiTamper\|obfuscat\|LocalAuthentication\|authenticateAsync\|AES\|CryptoJS` → 0 coincidencias; `src/lib/storage/secureStorage.ts:9-35`; `src/lib/config.ts:81-88`; `constitution.md` Art. V.4 | No cumple |
| 5. ¿Herramientas DevSecOps en CI? | GitHub Actions con 5 jobs: `policy`, `quality`, `secrets`, `sast`, `gate`. Gitleaks v8.30.1 con SHA-256 verificado, CodeQL v4 fijado por SHA de commit, `npm ci`, Jest con cobertura, script de cobertura, `policy.mjs` y `audit.mjs`. | `.github/workflows/ci.yml:58,61-62,74-88,91-112,114-138`; `npm run test:scripts` → 22/22 | Cumple |
| 6. ¿Herramientas DevSecOps en CD? | Ninguna automatizada. Solo hay `ci.yml`; no hay workflow de deploy. La entrega se hace con EAS Build (`eas.json` perfiles `preview`/`production`) y Play Console, ambos manuales y con aprobación humana. | `Get-ChildItem .github/workflows` → solo `ci.yml`; `Select-String 'deploy\|eas build'` en workflows → 0 líneas de deploy; `eas.json:6-29` | Parcial |
| 7. ¿Cuántos endpoints se consumen? | Contrato: **60 paths** en `openapi.yaml`. Cliente: **47 sitios** de `request()` detectados por AST en archivos no-test, **43 operaciones únicas**, **37 rutas únicas**. De esas 37, 6 no figuran en el contrato: 2 reales (`/healthz`, `/readyz`, fuera de `/api/v1` y documentados como excepción) y 4 artefactos del normalizador que, revisados a mano, corresponden a rutas del contrato construidas con helpers. No hay endpoints inventados. Sin consumo en el móvil: `/ai/assistant/messages`, `/ai/assistant/conversations/{id}` y los 6 `/admin/*`. La cifra de "29 paths del contrato sin consumo" del script no es fiable porque las rutas con `itemPath`/`bookingPath`/`stagePath` no se normalizan solas. Lista de operaciones detectadas, abajo. | Conteo de `^  /api/v1/` en `../vaiven-backend/api/openapi.yaml` → 60; script AST con `typescript` del proyecto → `CALL_SITES=47, CLIENT_UNIQUE_OPS=43, CLIENT_UNIQUE_PATHS=37`; `src/features/diagnostics/api/getHealth.ts:12,18` (`prefix: ''`); `grep assistant` en `openapi.yaml:177-180`; `grep assistant` en `src/app` → 0 | Cumple con observación |
| 8. ¿Cuántos agentes de IA? | **8 declarados** en `opencode.json` (`plan`, `build`, `spec-writer`, `dev-expo`, `qa-mobile`, `probador-expo`, `revisor-constitucion`, `gestor-repo`) y **6 archivos** propios en `.opencode/agents/`. Los dos primeros son agentes nativos sin archivo local. | `opencode.json:9-39`; `Get-ChildItem .opencode/agents` → 6 `.md` | Cumple |
| 9. ¿Cuántas Skills? | **5** `SKILL.md`: `sdd-workflow`, `expo-router-structure`, `react-query-api-client`, `rn-testing`, `expo-go-verification`. | `Get-ChildItem -Recurse .opencode/skills -Filter SKILL.md` → 5 rutas | Cumple |
| 10. ¿Se usó `memoria.md` para el aprendizaje? | Sí: 229 entradas `D-001`…`D-229`, con decisiones, dependencias, aprendizajes y cierre por spec. **Observación:** el archivo conserva marcadores de conflicto de git sin resolver (`<<<<<<< Updated upstream`, `=======`, `>>>>>>> Stashed changes`) al final de la sección 016. | `memoria.md` (secciones 2, 4, 5 y cierres 002–017); marcadores conflictivos al final del archivo | Cumple con observación |
| 11. ¿Pruebas unitarias? | Sí: **146 suites / 1.864 pruebas**, todas en verde. Cobertura global 99,65 % sentencias, 97,68 % ramas, 100 % funciones, 99,6 % líneas. Aviso conocido: «A worker process has failed to exit gracefully», sin fallos. | `npm test` → `146 passed, 146 total`, `1864 passed, 1864 total`, exit 0 | Cumple |
| 12. ¿Pruebas de seguridad? | Sí: **10 suites / 94 pruebas**, todas en verde. Incluyen S-01…S-13 con casos negativos reales (reglas que detectan `any`, `AsyncStorage`, `fetch` directo, secretos `EXPO_PUBLIC_*`, precisión alta de ubicación). | `npm run test:security` → `10 passed, 10 total`, `94 passed, 94 total`, exit 0; `src/__arch__/rules.security.test.ts:30-74,106-123` | Cumple |
| 13. ¿Pruebas de integración? | Sí: **14 suites / 93 casos** según `test:report`. 11 archivos `*.integration.test.*` más 3 `*.wiring.test.*`/`flow.test.*`. | `npm run test:report` → `integración 14/93`; listado de archivos reales | Cumple |
| 14. ¿Pantallas con endpoints sin pruebas? | Según la matriz versionada, **ninguna** pantalla con consumo de endpoints se quedó sin prueba unitaria. El único hueco de integración detectado por importación es `RegisterScreen`, cubierto por navegación en `session.integration.test.tsx`. 24 pantallas no tienen suite `*.security.test.*` propia, pero están cubiertas por capa con S-01…S-13. **Límite:** la matriz no incluye los endpoints de los *slots* ni el asistente de proyectos, así que la conclusión solo aplica a lo inventariado. | `docs/calidad/pantallas.md:70-75,93-109`; `docs/calidad/pantallas-notas.md:5-7,23-29`; `node scripts/screens-report.mjs` → 27 rutas / 26 pantallas | Parcial |
| 15. ¿Otras pruebas? | Accesibilidad (`src/__a11y__/a11y.test.tsx`, 6 pantallas, nombre accesible y área ≥ 44 pt), contrato (`src/__e2e__/fakeApi.ts` con zod estricto y `journey.integration.test.tsx`), dispositivo (`.maestro/`, `scripts/device-tests.mjs`, `docs/calidad/dispositivo.md`), scripts (`npm run test:scripts` 22/22). La suite de dispositivo existe pero no se ejecutó en teléfono. | `npm run test:scripts` → 22/22; `npm run test:device` sin dispositivo → exit 2; `docs/calidad/dispositivo.md:63-71`; `src/__a11y__/a11y.test.tsx` | Cumple con observación |
| 16. ¿MCP usados? | Dos declarados: `expo` y `github`, con permisos denegados por defecto. **Observación:** la constitución (Art. XIV.3) menciona `expo-mcp`, que no está declarado; `probador-expo` es opcional por decisión D-132. | `opencode.json:41-53` (denegados por defecto), `:55-68` (serverNames); `constitution.md:116,141` | Cumple con observación |
| 17. ¿Validación de contenido de imágenes? | No hay clasificación de contenido en la app. La app redimensiona (lado ≤ 1600 px, JPEG 0.8) y sube a Cloudinary con una firma del backend que incluye `allowedFormats` y `type`; el backend valida. No hay moderación visual detectable en el móvil. | `src/features/images/cloudinary.ts:4-7,9-18`; `resize.test.ts` (CA-01); búsqueda de moderación de imagen en `src/features/images` → sin clasificación de contenido | Parcial |
| 18. ¿Validación de texto inapropiado? | Sí, vía backend: la app interpreta `400 validation_failed` con `details[].issue` como rechazo por moderación y lo muestra al usuario. No hay filtro local; el servidor es la autoridad. | `src/lib/api/moderation.ts:3-5,22-33`; `src/features/items/screens/ItemFormScreen.test.tsx` (CA-04); D-149, D-175, D-194 en `memoria.md` | Cumple |
| 19. ¿Módulo para eliminar cuenta? | Sí: `DELETE /me` con `{ password }`, pantalla de perfil y flujo de confirmación. La anonimización la ejecuta el servidor; desde el móvil no es verificable. | `src/features/profile/api.ts:16-18`; `src/features/profile/deleteAccount.security.test.tsx`; `.maestro/06-baja` | Cumple en cliente; Parcial global |
| 20. ¿Permisos solicitados? | Cámara (QR y fotos), galería de fotos, ubicación **aproximada** (`ACCESS_FINE_LOCATION` bloqueado), notificaciones. Sin micrófono ni segundo plano. Textos de justificación en español. | `app.config.ts:16-52,64-74`; `src/__arch__/rules.security.test.ts:70-72`; `docs/play/cumplimiento.md:51` | Cumple |
| 21. ¿Persiste la sesión al reabrir sin logout? | Sí: refresh token en `expo-secure-store` (`vaiven.refreshToken`), access token solo en memoria, restauración única con `ref`. Ante 401/403 se borra; ante red/5xx se conserva. | `src/features/auth/session.tsx:118-147,175-186`; `src/lib/api/authInterceptor.ts:14-24`; `src/lib/storage/secureStorage.ts:9-35`; `session.integration.test.tsx`; `.maestro/04-sesion-persiste` | Cumple |
| 22. ¿Funciones de Machine Learning? | Recomendaciones híbridas del **backend** (`similar_to`, populares por categoría/zona), consumidas por `/recommendations`, `/recommendations/events` y `/recommendations/history`. No hay modelo, embeddings ni inferencia local. El algoritmo del servidor no es verificable desde este repositorio. | `src/features/recommendations/api.ts:21,31,39`; `docs/play/cumplimiento.md:17`; D-211…D-213 en `memoria.md` | Cumple en cliente; No verificable el modelo |
| 23. ¿IA Generativa? | Sugerencia de título y categoría a partir de la primera foto al publicar: `POST /ai/listing-suggestions`, activada por `features.aiSuggestions` en `/meta`. Sin SDK de IA local. El asistente de proyectos del contrato (`/ai/assistant/*`) no está implementado en el móvil. | `src/features/ai-suggestions/api.ts:13,22`; `src/features/ai-suggestions/flow.test.tsx`; `grep assistant` en `openapi.yaml:177-180` vs `grep assistant` en `src` → 0 | Parcial |
| 24. ¿Logout consume endpoint? | Sí: `POST /auth/logout` tras borrar la sesión local; ignora el fallo HTTP. `unregisterDevice` corre antes con timeout de 3 s. | `src/features/auth/api.ts:37-42`; `src/features/auth/session.tsx:175-186`; `src/features/auth/signOutHooks.ts`; `.maestro/05-logout` | Cumple con observación |
| 25. ¿Notificaciones Push? | Sí, con `expo-notifications`: permiso tras pantalla previa, registro de token con `projectId` de EAS, canal Android, aviso flotante de 4 s, dedupe de toques y arranque en frío. Se usan en avisos de actividad (reservas, mensajes, incidencias) y se dan de baja al cerrar sesión. El push remoto en Android Expo Go no es verificable aquí. | `src/features/notifications/NotificationsBootstrap.tsx:32-33,45-49,57-70,101-104`; `src/features/notifications/api.ts:45,53`; `push.security.test.ts`; D-196, D-197 | Cumple en cliente; No verificable en dispositivo |

### Tabla OWASP Mobile Top 10 (pregunta 2)

| Categoría | Evaluación | Evidencia | Estado |
|---|---|---|---|
| M1 — Uso indebido de credenciales | Access token en memoria, refresh token en SecureStore, sin secretos en código, `X-Request-Id` por petición. Logout borra local antes de llamar al servidor e ignora su fallo. | `authInterceptor.ts:14-24`, `secureStorage.ts:9-35`, `client.ts:59,82`, `session.tsx:175-186`, `rules.security.test.ts:32-60` | Cumple |
| M2 — Cadena de suministro insuficiente | CI fija Gitleaks por checksum y CodeQL por SHA; `npm audit` sin altas/críticas, pero 27 moderadas y una excepción vigente hasta `2026-12-18`. Sin SBOM ni firma de artefactos. | `.github/workflows/ci.yml:74-88,103-112`, `.github/audit-exceptions.json`, `npm audit --json` | Parcial |
| M3 — Autenticación/autorización insegura | Refresco *single-flight* en 401, `/auth/*` excluido del interceptor, errores 403 traducidos, validación zod de respuestas. | `authInterceptor.ts:14-24`, `client.ts:57-104`, `errors.ts:97-110` | Cumple |
| M4 — Validación insuficiente de entrada/salida | `zod` en todos los bordes de red, `strict: true`, reglas que prohíben `any`/`@ts-ignore`, convención que detecta textos y colores literales. | `errors.ts:55-60,97-110`, `conventions.test.ts`, `rules.security.test.ts:38-40,62-67`, `npm run typecheck` exit 0 | Cumple |
| M5 — Comunicación insegura | HTTPS obligatorio en producción, timeout de 10 s, `X-Request-Id`, cancelación con `signal`. **Sin certificate pinning.** | `src/lib/config.ts:81-88`, `client.ts:57-104`, búsqueda de `pinning` → 0 coincidencias | Parcial |
| M6 — Controles de privacidad insuficientes | Ubicación aproximada con `ACCESS_FINE_LOCATION` bloqueado, coordenadas solo en memoria y redondeadas, valor declarado no visible a terceros, sin logs de PII, baja de cuenta. | `app.config.ts:64-74`, `rules.security.test.ts:70-72`, `profile/api.ts:18`, `rules.security.test.ts:43-54` | Cumple |
| M7 — Protección de binario insuficiente | Sin ofuscación, anti-root/jailbreak, anti-debug ni anti-tamper en el código fuente. No hay controles compensatorios en la app. | Búsqueda en `src/` de `jailbreak\|isRooted\|rootDetection\|frida\|antiDebug\|antiTamper\|obfuscat` → 0 coincidencias | No cumple |
| M8 — Configuración de seguridad incorrecta | Permisos mínimos, reglas S-08a/S-12d, CI con job `gate`, pero `eas.json` usa el host de staging también en `production`, sin el puerto `:8443` que D-227 dice corregido. Declaraciones de Play/CODEOWNERS no verificables desde el repo. | `app.config.ts:16-52`, `rules.security.test.ts:57-72`, `.github/workflows/ci.yml:114-138`, `eas.json:14,25`, `memoria.md` D-227 | Parcial |
| M9 — Almacenamiento inseguro de datos | Solo `expo-secure-store`; sin `AsyncStorage`, sin localStorage, sin caché persistente de evidencia, sin secretos en `EXPO_PUBLIC_*`. | `secureStorage.ts:9-35`, `rules.security.test.ts:32-36,57-59`, `docs/seguridad.md:5-10` | Cumple |
| M10 — Criptografía insuficiente | No hay cifrado propio: se delega en TLS y en el almacenamiento nativo de SecureStore. No se puede evaluar la implementación criptográfica subyacente sin inspeccionar el nativo/el dispositivo. | `src/lib/config.ts:81-88`, `secureStorage.ts:9-35`, búsqueda de `AES\|CryptoJS` → 0 coincidencias | Parcial (no verificable en profundidad) |

### Lista de operaciones detectadas (pregunta 7)

```text
DELETE /items/{}                    DELETE /me                         DELETE /me/push-tokens
DELETE /recommendations/history      GET /bookings/{}                   GET /bookings/{}/{}
GET /categories                      GET /conversations                 GET /conversations/unread-count
GET /healthz                         GET /incidents/{}                  GET /items
GET /items/price-suggestion          GET /items/{}                      GET /me
GET /me/bookings                     GET /me/incidents                  GET /me/items
GET /me/notifications                GET /me/notifications/unread-count GET /meta
GET /readyz                          GET /recommendations               GET /users/{}
GET /users/{}/ratings                PATCH /items/{}                    PATCH /me
POST /ai/listing-suggestions         POST /auth/login                   POST /auth/logout
POST /auth/refresh                   POST /auth/register                POST /bookings
POST /bookings/{}/incidents          POST /items                        POST /me/notifications/read
POST /me/push-tokens                 POST /recommendations/events       POST /reports
POST /uploads/signature              POST /{}}/confirm                  POST /{}}/qr
PUT /{}}/evidence
```

Las últimas tres son artefactos del normalizador del script; corresponden a `/bookings/{id}/{stage}/confirm`, `/qr` y `/evidence` (`src/features/handover/api.ts:24,32,37`).

---

### 2. Sección 3 — Pruebas de automatización en dispositivo físico

| Aspecto | Resultado | Evidencia | Estado |
|---|---|---|---|
| Existencia de la suite | Sí: 7 flujos Maestro y un script con guardas. | `.maestro/00-registro`, `01-login`, `02-explorar`, `03-solicitud`, `04-sesion-persiste`, `05-logout`, `06-baja`; `scripts/device-tests.mjs`; `docs/calidad/dispositivo.md:63-71` | Cumple |
| Ejecutable desde PowerShell/IDE | Sí, con `npm run test:device`. | `package.json` (script `test:device`); `docs/calidad/dispositivo.md` §«Comprobaciones previas» | Cumple |
| Guarda de dispositivo ejecutada sin teléfono | Falló con mensaje claro, código 2 y **0 archivos** de resultados. Imprimió la URL activa `https://vaiven-staging.westus2.cloudapp.azure.com` (fuente `eas.json (preview)`) y «No encuentro `adb`…». | `npm run test:device` → `DEVICE_GUARD_EXIT=2`; `scripts/device-tests.mjs:32-52,63-95`; `docs/calidad/dispositivo/` → 0 archivos | Cumple |
| Guarda de host | El script acepta solo URLs locales o con etiqueta `staging\|stg\|dev\|test\|qa\|sandbox\|preview`, o `E2E_ALLOW_API_HOST`. | `scripts/device-tests.mjs:63-95` | Cumple |
| Herramientas en la máquina de auditoría | `adb` no instalado, `maestro` no instalado. No se instaló nada (sin autorización). | `Get-Command adb` → `False`; `Get-Command maestro` → `False` | No verificable |
| Flujos cubiertos | Registro, inicio de sesión, exploración, solicitud, persistencia de sesión, logout y baja de cuenta. | `.maestro/` (7 flujos); `docs/calidad/dispositivo.md:63-71` | Cumple |
| Flujos no cubiertos | Publicar objeto con fotos, entrega/devolución y QR, chat y notificaciones push, borrado del historial de recomendaciones, sugerencia con IA, administración. | Contraste de `.maestro/` con las 27 rutas de `docs/calidad/pantallas.md` y con `openapi.yaml` | Parcial |
| Ejecución real en teléfono | No ejecutada. Faltan: teléfono con `adb`, Maestro instalado, `E2E_API_URL` fijado a `:8443` (el host `:443` responde `environment: production` sin `features`), credenciales de prueba y el `seed` del backend 016-T012. | `docs/calidad/dispositivo.md:45`; `docs/calidad/dispositivo/` vacío; D-224 en `memoria.md` | No verificable |

---

## B) Resumen de hallazgos

### 1. Lo que cumple

- Calidad ejecutable: `typecheck` y `lint` limpios; **146 suites / 1.864 pruebas** en verde con 99,65 % de cobertura de sentencias.
- Seguridad automatizada: **10 suites / 94 pruebas** de seguridad; **14 suites / 93 casos** de integración; **22/22** pruebas de scripts; accesibilidad y contrato con zod estricto.
- CI con Gitleaks verificado por checksum, CodeQL fijado por SHA, control de políticas y *gate* de merge.
- Secretos: sin credenciales en código; refresh token en SecureStore; access token en memoria; sin `AsyncStorage`.
- Contrato: todo el tráfico pasa por `request()` con zod; `X-Request-Id`, timeout y cancelación; HTTPS obligatorio en producción.
- Permisos mínimos, ubicación aproximada, moderación de texto por backend, baja de cuenta, sesión persistente, logout con endpoint y push registrado.

### 2. Hallazgos por severidad

| Severidad | Hallazgo | Evidencia | Riesgo |
|---|---|---|---|
| Crítico | Ninguno confirmado en código. Las tareas que podrían ser críticas están fuera de alcance (producción, Play Console, backend). | `npm audit` → 0 críticas; Gitleaks en CI; sin secretos | — |
| Alto | Protección de binario ausente: sin pinning, root/jailbreak, biometría, ofuscación ni anti-tamper. | Búsqueda en `src/` → 0 coincidencias | No cumple el estándar fintech (Q4, M7); robo de credenciales y manipulación del cliente sin detección. |
| Alto | `eas.json` apunta a staging en **los dos perfiles** (`preview` y `production`) y sin `:8443`; D-227 afirma lo contrario. | `eas.json:14,25`; `memoria.md` D-227; `docs/calidad/dispositivo.md:45` | Un AAB de producción puede no alcanzar la API con `features` activas y caer en modo «IA apagada» sin aviso. |
| Alto | Suite de dispositivo **no ejecutada**: sin `adb`, sin Maestro y sin resultados JUnit archivados. | `docs/calidad/dispositivo/` → 0 archivos; `npm run test:device` → exit 2; 016-T009 marcada por palabra, sin evidencia | No hay evidencia de entrega-recepción en teléfono para 7 flujos. |
| Medio | `memoria.md` conserva marcadores de conflicto de git sin resolver al final de la sección 016. | `<<<<<<< Updated upstream` / `=======` / `>>>>>>> Stashed changes` en `memoria.md` | Documento de decisiones no fiable como fuente única; D-222 duplicado con D-226. |
| Medio | 27 vulnerabilidades moderadas y excepción `GHSA-fc5q-39xc-vjpf` vigente hasta `2026-12-18`. | `npm audit --json`; `.github/audit-exceptions.json` | La excepción vence en 22 días; si no hay parche, CI volverá a rojo. |
| Medio | Matriz `pantallas.md` incompleta: omite endpoints de *slots* y el asistente `/ai/assistant/*`. | `grep assistant` en `openapi.yaml:177-180` vs `grep assistant` en `src/app` → 0; `pantallas-notas.md:29` | La afirmación «ninguna pantalla sin prueba» es válida solo para lo inventariado. |
| Medio | Asistente de proyectos del contrato no implementado en el móvil. | `openapi.yaml:177-180`; sin consumo en `src/` | Funcionalidad contractual entregada solo en backend. |
| Bajo | Logout ignora el fallo HTTP de `POST /auth/logout`. | `session.tsx:175-186`; `auth/api.ts:37-42` | La sesión local se borra igual; riesgo menor de revocación incompleta del refresh token. |
| Bajo | `/meta` se consulta dos veces (IA y recomendaciones, claves distintas). | `ai-suggestions/api.ts:13`; `recommendations/api.ts:15`; D-211 | Doble petición y caché duplicada. |
| Bajo | Avisos `act(...)` y «worker process has failed to exit gracefully» en Jest; no fallan. | Corrida `npm test` | Deuda técnica de pruebas. |

### 3. No verificable y por qué

- **Teléfono físico / Expo Go**: sin dispositivo, sin `adb` y sin Maestro en la máquina de auditoría; no se instaló nada por falta de autorización. Quedan sin verificar los 7 flujos Maestro y cualquier estado visual.
- **Push remoto en Android Expo Go**: requiere dispositivo y servicio externo; solo se verificó el registro en código.
- **Producción y Play Console**: 013-T010 y T011 siguen abiertas; el auditor no tiene acceso a la consola.
- **Algoritmo de ML del backend y el proveedor de IA**: residen en `../vaiven-backend`; desde este repositorio solo se ve el consumo HTTP.
- **Anonimización real de la baja de cuenta**: la ejecuta el servidor; el móvil solo envía `DELETE /me`.
- **Contraste exacto de endpoints**: el AST no resuelve todas las rutas construidas con helpers; la cifra de 29 paths «no consumidos» del script se reporta como no fiable y se sustituye por revisión manual.
- **Manifiesto efectivo de Android compilado**: no se construyó ningún AAB (prohibido por las reglas de auditoría); solo se leyó `app.config.ts`.

### 4. Discrepancias documentación ↔ código

1. `memoria.md` D-227 dice versión `1.1.2` y puerto `:8443`; `app.config.ts:12` dice `1.1.1`, `package.json:3` dice `1.0.0` y `eas.json:14,25` apunta a `:443` sin puerto.
2. D-227 afirma que `:8443` quedó corregido; el archivo real no lo refleja.
3. `constitution.md:116,141` describe `expo-mcp`; `opencode.json:55-68` declara `expo` y `github`, sin `expo-mcp`.
4. `docs/seguridad.md:10` habla de «tokens» en SecureStore; en código solo el refresh token persiste (`authInterceptor.ts:14-24`).
5. `docs/devsecops.md:10` describe a `@JosephYanez27` con solo lectura, mientras CODEOWNERS/ruleset lo exigen como revisor obligatorio (la persona informó que ya se corrigió; no verificable desde el repo).
6. `docs/play/cumplimiento.md:51` describe notificaciones «Tras iniciar sesión»; el código pide permiso tras pantalla previa y activación (`NotificationsBootstrap.tsx:45-49`).
7. `docs/calidad/pantallas.md` afirma cobertura total de pantallas con endpoints, pero no inventaría los *slots* ni `/ai/assistant/*`.

### 5. Veredicto global y 5 prioridades

**Veredicto: CONFORME CON OBSERVACIONES**, con reservas altas en evidencia de dispositivo y en configuración de producción. La app cumple los controles automatizables y la constitución en lo verificable; no se puede emitir un dictamen de entrega-recepción completa sin la suite física y sin resolver la URL de producción.

Prioridades que exigiría un evaluador:

1. **Ejecutar la suite de dispositivo** (`.maestro/`) en un teléfono real con `adb` + Maestro, con `E2E_API_URL=https://vaiven-staging.westus2.cloudapp.azure.com:8443`, y archivar el informe JUnit en `docs/calidad/dispositivo/`. Cierra 016-T009 y CA-07.
2. **Corregir y congelar la configuración de URL**: definir si producción usa staging y en qué puerto, reflejarlo en `eas.json`, `.env.example`, `docs/` y `memoria.md`, y verificar `/meta` con `features` en el AAB final.
3. **Decidir el nivel de seguridad exigible**: si se pretende nivel fintech, implementar pinning, detección de root/jailbreak y biometría; si no, documentar formalmente la excepción y el alcance académico.
4. **Limpiar `memoria.md`** (marcadores de conflicto y D-222 duplicado) y alinear las 7 discrepancias de documentación con el código antes de la entrega.
5. **Resolver la excepción `GHSA-fc5q-39xc-vjpf` antes del 2026-12-18** o renovarla con justificación, y completar el inventario de endpoints/pantallas con los *slots* y el asistente de proyectos.

---

## C) Porcentaje de aprobación

**72 / 100.**

No es una cifra que exista en el repositorio ni una métrica oficial: es un juicio de evaluación con ponderación explícita, derivado de la evidencia anterior. Si se presenta un número sin esta descomposición, se estaría inventando un porcentaje, como se indicó en la pregunta 1.

| Criterio | Peso | Obtenido | Base |
|---|---:|---:|---|
| Calidad y pruebas automáticas | 25 | 25 | 146/146 suites, 1.864/1.864 pruebas, typecheck y lint limpios, cobertura 99,65 % |
| Seguridad en código (M1–M10) | 25 | 17 | 5 categorías cumplen, 3 parciales, 2 sin control (M7, cifrado profundo) |
| Contrato y arquitectura | 15 | 13 | Todo por `request()` + zod; sin endpoints inventados; matriz incompleta y asistente IA no implementado |
| CI/CD DevSecOps | 10 | 7 | CI completo; CD manual; excepción `picomatch` vigente |
| Gobernanza y documentación | 10 | 6 | `memoria.md` con conflictos sin resolver y 7 discrepancias doc↔código |
| Verificación en dispositivo y entrega | 15 | 3 | Solo guardas ejecutadas; 0 flujos en teléfono, 0 capturas JUnit |
| **Total** | **100** | **72** | **Veredicto: conforme con observaciones** |

Cómo se mueve ese número según el marco de exigencia:

- **Si se evalúa solo código automatizable:** 88/100.
- **Si se exige nivel bancario/fintech (pinning, root/jailbreak, biometría, ofuscación):** 60/100.
- **Si se exige entrega-recepción con evidencia en teléfono:** 65/100.

El factor que más penaliza no es el código: es la ausencia de ejecución real en dispositivo y la configuración de producción inconsistente (`eas.json:14,25` vs D-227). Resolver esas dos cosas elevaría la calificación a ~85 sin tocar una sola prueba.
