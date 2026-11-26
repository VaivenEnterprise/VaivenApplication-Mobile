# Pendientes — Auditoría de entrega-recepción, app móvil VAIVÉN

> Auditoría externa (rol evaluador/QA) contra «Auditoría de evaluación v2 (18/nov/2026)», secciones 2 (Móvil) y 3 (Pruebas de automatización).
> Fecha: 2026-11-26 · Rama: `spec/SPEC-16` · HEAD: `f73c92e` · Modo: solo lectura (no se modificó código ni configuración).

---

## 0. Calificación

**60 / 100 — No aprobado (en el límite)**

No existe en el repositorio la rúbrica oficial con pesos por pregunta; la cifra usa un método propio y transparente:

**Método:** cada fila vale 1 = Cumple, 0,5 = Parcial, 0 = No cumple / No verificable.

| Bloque | Cálculo | Resultado |
|---|---|---|
| Sección 2 — Móvil (25 preguntas) | 13 Cumple + 9 Parcial (4,5) + 3 No cumple (fintech, CD, moderación de imágenes) = 17,5 / 25 | **70 %** |
| Sección 3 — Dispositivo (7 criterios) | existe 1 · ejecutable 1 · guarda sin teléfono 1 · guarda contra producción 0,5 · flujos cubiertos 0,5 · flujos faltantes 0 · ejecución real 0 = 4 / 7 | **57 %** |
| Ponderado | 70 % × 0,7 + 57 % × 0,3 | **66** |
| Penalización por integridad de la entrega | Conflictos de merge commiteados (A-1), `eas.json`/versión distintos de lo documentado (A-2), tareas `[x]` sin evidencia (M-2, M-3) | **−6** |
| **Total** | | **60 / 100** |

**Proyección si se resuelven las 5 prioridades (§ 7):**

| Acción | Impacto estimado |
|---|---|
| Resolver conflictos + conciliar `eas.json` / `tasks.md` / memoria | +6 (elimina penalización) |
| Ejecutar suite de dispositivo con evidencia JUnit | +8 a +10 |
| Moderación de imágenes + texto ampliado | +3 a +4 |
| Cobertura real de la app | +1 a +2 |
| Endurecer `allowBackup`, permisos, FCM | +2 a +3 |
| **Resultado esperado** | **≈ 80–85 → «Conforme con observaciones»** |

---

## 1. Comandos ejecutados (resultado real)

| Comando | Resultado |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npx jest --coverage --ci` | 146/146 suites, 1 864/1 864 pruebas (aviso «worker failed to exit gracefully») |
| `npm run test:security` | 10 suites / 94 pruebas, exit 0 |
| `npm run test:report` (salida a scratchpad) | unitarias 122/1 677 · integración 14/93 · seguridad 10/94 · cobertura 99,65 % sent. / 97,68 % ramas / 100 % func. / 99,6 % líneas |
| `npm run test:scripts` | 22/22 |
| `node --test .github/scripts/{policy,audit}.test.mjs` | 20/20 |
| `npm audit --json` | 0 critical, 0 high, 27 moderate (20 en dependencias de producción) |
| `node .github/scripts/audit.mjs` | Falla en Windows: `SyntaxError: "undefined" is not valid JSON` (ver B-1) |
| `npx expo config --type introspect` | Manifiesto Android efectivo (ver pregunta 20) |
| `npm run test:device` / `device-tests.ps1` sin teléfono | exit 2, mensaje claro, 0 archivos escritos |

---

## 2. Sección 2 — Móvil

| # | Pregunta | Respuesta | Evidencia | Estado |
|---|---|---|---|---|
| 1 | % seguridad DevSecOps | **≈ 64 % (14/22).** 22 prácticas (12 pipeline + 10 app/MASVS), 1/0,5/0. **Pipeline 7/12:** SAST 1, secretos 1, SCA 1, Dependabot 1, acciones fijadas por SHA + token mínimo 1, política de archivos sensibles 1, protección de ramas 0,5 (solo JSON), tests+cobertura en CI 0,5 (cobertura parcial), DAST 0, análisis de binario (MobSF) 0, SBOM/firma 0, CD con controles 0. **App 7/10:** almacén seguro 1, HTTPS forzado 1, validación zod 1, sesión/refresh 1, logs sin PII 1, baja de cuenta/privacidad 1, permisos/backup 0,5, moderación 0,5, pinning 0, anti-tamper/root/ofuscación 0 | `.github/workflows/ci.yml:21-138`, `.github/dependabot.yml`, `src/lib/storage/secureStorage.ts`, `src/lib/config.ts:78-91`, `jest.config.js:11-15` | Parcial |
| 2 | OWASP Mobile Top 10 | Ver § 2.1 | — | Parcial |
| 3 | ¿Vulnerabilidades críticas? | **Sin críticas ni altas en dependencias** (0/0/27 moderate). La excepción `GHSA-fc5q-39xc-vjpf` ya no aplica. Sin secretos en código; `.env` nunca versionado (solo 2 `EXPO_PUBLIC_*`). Sí hay riesgos altos de configuración/proceso (§ 4) | `npm audit`, `git log --all -- .env` vacío, `.github/audit-exceptions.json` | Cumple (deps) / con observaciones |
| 4 | ¿Nivel bancario/fintech? | **No.** Cumple: SecureStore, access token solo en memoria (`authInterceptor.ts:14`), rotación single-flight, HTTPS forzado. Falta: certificate pinning, detección root/jailbreak, Play Integrity, ofuscación (sin `expo-build-properties`/R8), biometría (sin `expo-local-authentication`), `FLAG_SECURE`, timeout por inactividad; `allowBackup: true` | grep sin coincidencias; introspect `allowBackup: true` | No cumple |
| 5 | DevSecOps en CI | GitHub Actions: **CodeQL** (bloquea severity ≥ 7, `check-sarif.mjs`), **Gitleaks 8.30.1** (historial + árbol, SHA-256 verificado), **npm audit** con compuerta y excepciones con vencimiento, **Dependabot** (npm + actions), **policy** (PR/ramas/archivos sensibles), tsc, ESLint, Jest + cobertura, gate «Required checks» | `ci.yml:21-138`, `.github/scripts/*` | Cumple |
| 6 | DevSecOps en CD | **No existe CD.** Solo `ci.yml`; `docs/devsecops.md`: «CI no construye APK/AAB». Builds EAS manuales; sin firma, SBOM, escaneo de binario ni envío automatizado | `.github/workflows/` (1 archivo), `eas.json` sin `submit` | No cumple |
| 7 | Endpoints consumidos | **61 de 69 operaciones del contrato** (55 rutas si se agrupan `delivery`/`return` en `{stage}`). No consumidos: 6 `/admin/*` (correcto) y 2 `/ai/assistant/*`. `/healthz` y `/readyz` solo en `(dev)/diagnostico` (redirige fuera de development) → **59 en producción**. +1 destino externo: Cloudinary vía `XMLHttpRequest` (`cloudinary.ts:87`). Cero endpoints fuera del contrato | grep `request(` en `src/features/*/api.ts`; resolución de `openapi.yaml` + `paths/*.yaml` | Cumple |
| 8 | Agentes de IA | **6 propios** (`.opencode/agents/`: dev-expo, gestor-repo, probador-expo, qa-mobile, revisor-constitucion, spec-writer) + **4 nativos OpenCode** (plan, build, explore, general) = 10. `opencode.json` asigna modelo a 8 | `ls .opencode/agents` → 6; `opencode.json:9-40` | Cumple |
| 9 | Skills | **5 en el repo**: sdd-workflow, expo-router-structure, react-query-api-client, rn-testing, expo-go-verification. AGENTS.md y `.ux-profile.md` citan ~10 skills UI/UX (page-patterns, ux-audit…) **que no están en el repo** | `find . -name SKILL.md` → 5 | Cumple (5) / UX no verificable |
| 10 | ¿memoria.md? | **Sí**: 533 líneas, 35 commits, cargada por `opencode.json:5-8`. Pero contiene **marcadores de conflicto sin resolver** (`memoria.md:523-533`) y entradas que contradicen el código (A-2, M-3) | `git log -- memoria.md \| wc -l` → 35 | Parcial |
| 11 | Pruebas unitarias | **122 suites / 1 677 casos, 100 % en verde** | `test:report` | Cumple |
| 12 | Pruebas de seguridad | **10 suites / 94 casos** (S-01…S-13 con categoría OWASP) | `npm run test:security` | Cumple |
| 13 | Pruebas de integración | **14 suites / 93 casos** (11 `*.integration` + 1 `wiring` + 2 `flow`), todas contra API falsa; ninguna contra backend real | `test:report` | Parcial |
| 14 | Pantallas sin prueba | Ver § 2.2 | `docs/calidad/pantallas.md` contrastado con grep | Parcial |
| 15 | Otras pruebas | Accesibilidad (`src/__a11y__/a11y.test.tsx`), arquitectura/reglas (`__arch__/rules.security.test.ts`, 21), convenciones (`conventions.test.ts`, 13), configuración/permisos (`app.config.test.ts`, 6), E2E con API falsa (`__e2e__/journey.integration.test.tsx`), scripts (22), políticas CI (20), 7 flujos Maestro **sin ejecutar**. Sin contrato real, rendimiento ni DAST | archivos citados | Parcial |
| 16 | MCP | **2 configurados**: `expo` (remoto OAuth, `https://mcp.expo.dev/mcp`, solo probador-expo) y `github` (remoto, PAT por variable de entorno, solo gestor-repo). La documentación menciona Render/Azure/Cloudinary (otros repos) | `opencode.json:55-69` | Cumple |
| 17 | Moderación de imágenes | **No.** El cliente solo limita cantidad (1–5), tamaño (1 600 px) y formato (recompresión JPEG); Cloudinary recibe `allowed_formats` firmado. **Ningún análisis de contenido** (NSFW, etc.) ni en app ni en backend (moderación del backend = solo texto). Única vía: reporte manual `POST /reports` | `resize.ts:5-29`, `cloudinary.ts:62-73`, `vaiven-backend/internal/moderation/checker.go:1-3` | No cumple |
| 18 | Moderación de texto | **Parcial.** Blocklist en servidor (4 categorías, `blocklist.go`) aplicada a objetos, chat, sugerencias IA y asistente; la app muestra el rechazo en formulario de objetos (`ItemFormScreen.tsx:168-171`) y chat (`chat/[id].tsx`). **Sin moderar:** nombre/bio de perfil, comentarios de calificaciones, incidencias, reportes. Lista corta, sin ML | grep `Moderation.Check` en backend | Parcial |
| 19 | Eliminar cuenta | **Sí.** `DELETE /me` con contraseña, hoja de confirmación en Perfil, cierre local, prueba de seguridad y flujo Maestro `06-baja.yaml` | `profile/api.ts:17-18`, `ProfileScreen.tsx:83-150`, `deleteAccount.security.test.tsx` | Cumple |
| 20 | Permisos | **Declarados** (`app.config.ts`): cámara, fotos, ubicación aproximada (FINE bloqueada), notificaciones. **Manifiesto efectivo** (introspect): INTERNET, CAMERA, ACCESS_COARSE_LOCATION, VIBRATE, **SYSTEM_ALERT_WINDOW, READ_EXTERNAL_STORAGE, WRITE_EXTERNAL_STORAGE**; removidos ACCESS_FINE_LOCATION y RECORD_AUDIO. POST_NOTIFICATIONS se fusiona en build (no verificable sin APK). `docs/play/cumplimiento.md:55` («sin… archivos amplios») **contradice** el manifiesto. iOS plist incluye `NSLocationAlways*` y `NSMicrophoneUsageDescription` | `app.config.ts:16-73`, introspect | Parcial |
| 21 | ¿Persiste la sesión? | **Sí en código y pruebas**: refresh token en SecureStore, restauración al arrancar (`session.tsx:120-147`), S-04 y Maestro `04-sesion-persiste.yaml`. **No verificable en teléfono.** Observación: si arranca sin red muestra login aunque conserva el token | `session.tsx:136-144` | Cumple (código) / No verificable (dispositivo) |
| 22 | Machine Learning | «Recomendado para ti» (`GET /recommendations`, eventos, borrado de historial). Modelo **en el servidor**: híbrido coseno por contenido + coocurrencia + populares (arranque en frío). Sin ML en el dispositivo | `features/recommendations/api.ts`; `vaiven-backend/internal/reco/domain/model/{cosine,cooccurrence,hybrid,popular}.go` | Cumple (servidor) |
| 23 | IA Generativa | Sugerencia de título/categoría/descripción a partir de foto al publicar (`POST /ai/listing-suggestions`), con **Gemini** en backend y moderación de la salida. El asistente de proyectos (`/ai/assistant/*`) **no se consume** | `ai-suggestions/api.ts:13-22`; `internal/suggest/usecase/suggest.go:6,51,188` | Cumple |
| 24 | ¿Logout por endpoint? | **Sí.** `POST /auth/logout` con refresh token, tras limpiar estado local y dar de baja el token push; si el servidor falla, el dispositivo cierra igual (S-03) | `auth/api.ts:234-239`, `session.tsx:175-186` | Cumple |
| 25 | Push | **Implementado en código**: permiso, canal Android, registro/baja de token (`/me/push-tokens`), navegación al tocar. Flujos: 18 tipos (reservas solicitada/aceptada/rechazada/cancelada/vencida/afectada, mensajes, entrega/devolución, pagos, devolución tardía, incidencias, calificación, sanción, contenido retirado). **Riesgo:** sin `googleServicesFile`/FCM en el repo → en un AAB Android normalmente no se obtiene token Expo. Sin evidencia de push recibida | `push.ts`, `routing.ts`, `openapi.yaml:1790-1807`; grep `fcm\|firebase\|google-services` → 0 | Parcial / No verificable |

### 2.1 OWASP Mobile Top 10 (2024)

| Cat. | Estado | Evidencia |
|---|---|---|
| M1 Uso indebido de credenciales | Cumple | Sin secretos en bundle; firma de Cloudinary desde backend (`images/api.ts:11-12`); `.env` solo URLs públicas |
| M2 Cadena de suministro | Parcial | Lockfile, `npm ci`, Dependabot, compuerta de audit; 27 moderate (20 prod), sin SBOM ni firma/proveniencia |
| M3 Autenticación/autorización | Cumple (cliente) | Refresh single-flight, sin reintento en `/auth/*`, cierre ante refresh fallido (S-02); sin biometría |
| M4 Validación entrada/salida | Cumple con observación | Todas las respuestas validadas con zod (`client.ts:91`); `encodeURIComponent` en ids; `uploadUrl` solo `z.url()` sin lista de dominios |
| M5 Comunicación insegura | Parcial | HTTPS forzado con `APP_ENV=production` (`config.ts:80-90`); sin pinning |
| M6 Privacidad | Parcial | Ubicación aproximada con 2 decimales (`policy.ts:26`), baja de cuenta; `allowBackup: true` y permisos de almacenamiento |
| M7 Protección del binario | No cumple | Sin ofuscación, root/tamper ni Play Integrity |
| M8 Mala configuración | Parcial | Ruta de diagnóstico bloqueada fuera de dev (`(dev)/_layout.tsx:9`), pero `allowBackup`, SYSTEM_ALERT_WINDOW y build de producción apuntando a un host «staging» |
| M9 Almacenamiento inseguro | Cumple | SecureStore para refresh, access en memoria, caché borrada al cerrar sesión (`session.tsx:79-86`) |
| M10 Criptografía insuficiente | Cumple / N/A | Sin criptografía propia (TLS y SecureStore); `Math.random` solo para request-id, documentado y no secreto |

### 2.2 Pregunta 14 — pantallas con endpoints y prueba faltante

| Flujo / pantalla | Falta |
|---|---|
| Registro (`RegisterScreen`) | Integración y seguridad propia (el registro se cubre por la capa de sesión, no por la pantalla) |
| Login, Inicio, Actividad, Detalle de reserva, Solicitar, Chat, Conversaciones, Evidencia, QR, Escanear, Incidencias (3), Editar/Detalle/Nuevo/Mis objetos, Notificaciones, Perfil, Editar perfil, Perfil público, Proyecto, Explorar (24) | **Seguridad a nivel pantalla** (el proyecto lo justifica «por capa» en `pantallas-notas.md`: cliente, sesión, almacén) |
| Editar objeto (`EditItemScreen`) | Unitaria propia (comparte `ItemFormScreen.test.tsx`); integración solo vía `navigation.integration` |
| Diagnóstico `(dev)` (`/healthz`, `/readyz`, `/meta`) | Prueba de la ruta (solo hooks); no llega a producción |
| Todas (26) | Integración contra backend real (toda la integración usa API falsa) |

---

## 3. Sección 3 — Pruebas de automatización en dispositivo físico

| Aspecto | Resultado | Evidencia | Estado |
|---|---|---|---|
| ¿Existe la suite? | Sí: 7 flujos Maestro + 2 subflujos, `scripts/device-tests.mjs`/`.ps1`, `docs/calidad/dispositivo.md` | `.maestro/00…06-*.yaml`, `_shared/` | Cumple |
| ¿Ejecutable desde terminal/PowerShell? | Sí: `npm run test:device` y `.\scripts\device-tests.ps1 -Modo apk` | `package.json` | Cumple |
| Guarda sin dispositivo | Ejecutada: «No encuentro `adb`…» **exit 2** (apk); expo-go sin `--link`: mensaje claro, exit 2; PowerShell: exit 2. **0 archivos** en `docs/calidad/dispositivo/` antes y después | salida de comandos | Cumple |
| Guarda contra producción | `E2E_API_URL=https://api.vaiven.mx` → se niega (exit 2). **Falla de diseño:** según memoria D-227 el host «staging» **es** producción; la guarda por nombre lo deja pasar y la suite crearía/borraría cuentas en producción | `device-tests.mjs:31-51` | Parcial |
| Flujos cubiertos | Registro, login (+ credencial incorrecta), explorar/búsqueda, solicitud, persistencia de sesión, logout, baja | `.maestro/` | Parcial |
| Flujos NO cubiertos | Publicar objeto con fotos (cámara/galería), sugerencia IA, chat, entrega/devolución con QR y cámara, pagos, calificación, incidencias, push, permisos del sistema. `03-solicitud` **se omite en silencio** si `E2E_ITEM_TITLE` está vacía; `02-explorar` acepta el estado vacío | `03-solicitud.yaml:6-8`, `02-explorar.yaml:10-12` | No cumple |
| Ejecución real | **No verificable**: `adb` y `maestro` no instalados, sin teléfono; `docs/calidad/dispositivo/` vacía aunque 016-T009 está `[x]`. Falta: Android Platform Tools, Maestro CLI, teléfono con depuración USB, APK `mx.vaiven.app`, `E2E_EMAIL`/`E2E_PASSWORD`/`E2E_ITEM_TITLE` con datos sembrados, y backend de pruebas **separado** de producción | `ls -A docs/calidad/dispositivo` → 0 | No verificable |

---

## 4. Hallazgos por severidad (PENDIENTES)

### Alto

- [ ] **A-1 — Conflictos de merge commiteados.** `memoria.md:523-533`, `PUNTAJE-VERSIONES.md:24-29,78-102`, `docs/play/seguimiento.md:89-107` contienen `<<<<<<< Updated upstream` / `>>>>>>> Stashed changes`, introducidos en `f73c92e` («Spec 16 Cierre»). Riesgo: la memoria que los agentes cargan como instrucción es contradictoria; documentos de evaluación no fiables. Además queda `stash@{0}` pendiente sobre `develop`.
- [ ] **A-2 — `eas.json` no tiene la corrección `:8443` que afirma D-227.** `eas.json:14,25` apunta a `https://vaiven-staging.westus2.cloudapp.azure.com` sin puerto; el último commit que lo toca (`3ebc50e`, 22/nov) **quitó** `:8443`. `app.config.ts:12` sigue en `1.1.1`, no `1.1.2`. Riesgo: una build desde HEAD reproduce el fallo descrito en D-227.
- [ ] **A-3 — Producción apunta a un host llamado «staging»** (`EXPO_PUBLIC_APP_ENV=production` + host staging). Sin separación de entornos: las E2E destructivas, la guarda del script y el criterio «solo staging» de AGENTS.md quedan sin efecto.
- [ ] **A-4 — Sin moderación de imágenes.** Cualquier foto de objeto, perfil o evidencia se publica sin análisis; riesgo legal y de tienda en un marketplace público.
- [ ] **A-5 — Sin controles de nivel fintech (M7).** Sin pinning, root/tamper, ofuscación ni Play Integrity.

### Medio

- [ ] **M-1 — Cobertura 99,65 % medida sobre 17 de 352 archivos fuente** (`jest.config.js:11-15`). Excluye los 12 `src/features/*/hooks.ts` aunque el Art. IX exige `features/*/hooks`. Corregir `collectCoverageFrom` (p. ej. añadir `'src/features/*/hooks.ts'` y `'src/features/**/use*.ts'`).
- [ ] **M-2 — Tareas cerradas sin evidencia.** 016-T009 `[x]` con `docs/calidad/dispositivo/` vacía; D-228/D-229 cierran «por indicación» sin capturas; sin evidencia de Expo Go para specs 003–012 en `docs/evidencia/`.
- [ ] **M-3 — `tasks.md` contradice `memoria.md`.** 013 T001/T002/T003/T007 sin marcar en `specs/013-publicacion-google-play/tasks.md`, pero D-227/D-228 las dan por cerradas (probable stash mal aplicado).
- [ ] **M-4 — Push Android probablemente no funcional en el AAB:** sin FCM ni `google-services.json` configurado; sin evidencia en teléfono.
- [ ] **M-5 — Permisos efectivos no declarados** (SYSTEM_ALERT_WINDOW, READ/WRITE_EXTERNAL_STORAGE) y `allowBackup: true`; contradice `docs/play/cumplimiento.md:55`. Añadirlos a `android.blockedPermissions` y desactivar backup.
- [ ] **M-6 — Moderación de texto incompleta:** perfil (nombre/bio), calificaciones, incidencias y reportes no pasan por `Moderation.Check`.
- [ ] **M-7 — Sin CD ni controles del binario** (firma, SBOM, MobSF/análisis estático del APK).

### Bajo

- [ ] **B-1 — `.github/scripts/audit.mjs:41`** usa `execFileSync('npm')` sin `shell`; en Windows falla con `SyntaxError`. En CI (Ubuntu) funciona; no es portable ni da mensaje claro.
- [ ] **B-2 — Flujos Maestro débiles:** `03-solicitud` se omite en silencio; `02-explorar` acepta el estado vacío (pueden pasar en verde sin probar nada).
- [ ] **B-3 — Jest:** aviso de worker que no termina bien (fuga de timers).
- [ ] **B-4 — `uploadUrl`** de la firma no se restringe al dominio de Cloudinary (ni a `https`).
- [ ] **B-5 — Arranque sin red** muestra el login aunque conserva la sesión.
- [ ] **B-6 — 27 vulnerabilidades moderate** pendientes; la excepción de picomatch ya no aplica (quitarla de `.github/audit-exceptions.json`). `docs/seguridad.md:8` cita cifras desactualizadas (31).

---

## 5. No verificable y por qué

- Ejecución en dispositivo físico, persistencia real de sesión, recepción de push y permisos en runtime: sin teléfono, `adb` ni Maestro.
- Activación del ruleset, CODEOWNERS y resultados reales de GitHub Actions: requieren GitHub con credenciales (excluido por las reglas de la auditoría).
- Manifiesto final fusionado (POST_NOTIFICATIONS): requiere construir el APK.
- Estado en Play Console (testers, ficha, revisión): externo.
- Skills de UI/UX citadas en AGENTS.md: no están en el repositorio.

---

## 6. Discrepancias documentación ↔ código

1. D-227 afirma `eas.json` con `:8443` y versión `1.1.2` → HEAD sin puerto y `1.1.1`.
2. «Cobertura 99,65 %» (memoria, `docs/calidad/pruebas.md`) → medida sobre 17 archivos, no la app.
3. 016-T009 «completada y probada» → sin informe JUnit ni archivos de dispositivo.
4. 013: memoria da T001/T002/T003/T007 por cerradas → `tasks.md` las tiene abiertas.
5. `docs/play/cumplimiento.md` «sin archivos amplios» → el manifiesto efectivo pide almacenamiento.
6. AGENTS.md (Art. XIV) «cada spec termina con verificación en Expo Go» → sin evidencia de specs 003–012.
7. `docs/seguridad.md:8` «31 vulnerabilidades (1 baja, 30 moderadas)» → hoy 27 moderate.
8. Script de dispositivo «nunca corre contra producción» → staging es producción.

---

## 7. Veredicto y prioridades

**Veredicto: No conforme (cerca de «Conforme con observaciones»).** Base técnica y CI sólidas; lo que bloquea la recepción es la integridad de la entrega (conflictos commiteados, configuración de build contradictoria con lo documentado, tareas cerradas sin evidencia).

**Las 5 prioridades:**

1. [ ] Resolver conflictos de merge (A-1), conciliar `tasks.md` ↔ `memoria.md` con el estado real y restaurar `:8443` + versión en `eas.json`/`app.config.ts`, o documentar por qué no (A-2, M-3).
2. [ ] Separar staging de producción (A-3) y ejecutar de verdad la suite de dispositivo, con informe JUnit versionado en `docs/calidad/dispositivo/` (§ 3, M-2).
3. [ ] Moderación de imágenes en backend y ampliar la de texto a perfil, calificaciones e incidencias (A-4, M-6).
4. [ ] Ampliar `collectCoverageFrom` a `features/*/hooks.ts` y reportar la cobertura real de la app (M-1).
5. [ ] Endurecer binario y configuración: `allowBackup: false`, bloquear permisos sobrantes, configurar y verificar FCM/push, evaluar pinning y Play Integrity (A-5, M-4, M-5).
