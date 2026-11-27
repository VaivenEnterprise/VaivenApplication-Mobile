# Informe de pruebas — spec 016

**Fecha del informe:** 2026-11-25 · **Estado:** la parte documental (T010) y las verificaciones locales (T011) están ejecutadas; **T010 y T011 siguen sin marcar** porque la corrida en teléfono (T009 / CA-07) está **no ejecutada**. Este informe no afirma que la spec esté cerrada.

Regla de este informe: cada línea dice qué se ejecutó, con qué comando y qué resultó. Lo que no se ejecutó dice **no ejecutado**.

## 1. Conteo real por tipo y cobertura

**Comando:** `npm run test:report` (ejecuta `npx jest --coverage --coverageReporters=json-summary --json --outputFile=coverage/jest-resultados.json`).
**Fecha:** 2026-11-25 · **Evidencia:** `docs/calidad/conteo.json` (`fecha: 2026-11-25T18:44:01.271Z`, `noEjecutadas: []`) y `coverage/jest-resultados.json`.
**Salida del comando:** `Test Suites: 146 passed, 146 total` · `Tests: 1864 passed, 1864 total`.

| Tipo | Suites | Casos | Pasaron | Fallaron | Omitidas |
|---|---:|---:|---:|---:|---:|
| unitarias | 122 | 1 677 | 1 677 | 0 | 0 |
| integración | 14 | 93 | 93 | 0 | 0 |
| seguridad | 10 | 94 | 94 | 0 | 0 |
| **Total** | **146** | **1 864** | **1 864** | **0** | **0** |

**Cobertura global:** sentencias **99,65 %**, ramas **97,68 %**, funciones **100 %**, líneas **99,6 %** (umbral mínimo 80 % intacto).

Aviso no bloqueante repetido por Jest: `A worker process has failed to exit gracefully and has been force exited`; no hay suites fallidas ni casos omitidos. La línea base anterior a esta spec (132 suites / 1 751 pruebas, persona, 2026-11-25) ya no es el conteo vigente: los 14 suites / 113 casos añadidos por la 016 están incluidos arriba.

### Otras verificaciones de esta fecha

| Verificación | Comando | Resultado real (2026-11-25) |
|---|---|---|
| Tipos, cobertura y guarda de suites no ejecutadas | `npm run test:report` | 146/146 suites y 1 864/1 864 casos en verde; 0 no ejecutadas |
| Comprobación completa | `npm run typecheck && npm run lint && npm test` | `tsc --noEmit` sin errores; `eslint . --max-warnings 0` sin salida; 146/146 suites y 1 864/1 864 casos en verde; misma cobertura; tiempo de la última corrida 65,029 s |
| Solo seguridad | `npm run test:security` | 10/10 suites y 94/94 casos en verde (aviso conocido de Jest al no terminar en 1 s) |
| Scripts Node sin dependencias | `npm run test:scripts` | 22/22 en verde (Fase 3) |
| Guarda sin dispositivo | `npm run test:device` | Código **2**, «No encuentro `adb`…», 0 archivos escritos en `docs/calidad/dispositivo/` (Fase 3) |
| Suite en teléfono | `.\scripts\device-tests.ps1 -Modo apk` | **no ejecutado**: sin teléfono, sin `adb`, sin Maestro y sin autorización para instalarlos (T009) |

## 2. Pantallas × endpoints × pruebas

Generado con `node scripts/screens-report.mjs --out docs/calidad/pantallas.md` el 2026-11-25: **27 rutas y 26 pantallas**; todos los endpoints están en `../vaiven-backend/api/openapi.yaml`. Evidencia: `docs/calidad/pantallas.md` y `docs/calidad/pantallas-notas.md`.

- Unitarias: ninguna pantalla con endpoints sin prueba; `HomeScreen`, las tres de incidencias y `EditItemScreen` se cubren con bloques propios en archivos compartidos.
- Integración: el único hueco detectado por importación es `RegisterScreen`, cubierto por navegación en `features/auth/session.integration.test.tsx` (`pantallas-notas.md` §«Pruebas que el script no ve por importación»).
- Seguridad: las 24 pantallas con endpoints sin suite `*.security.test.*` propia están justificadas por capa con S-01…S-13 (`pantallas-notas.md` §«Columna Seguridad»). «Sin prueba» no significa «sin control».

## 3. Seguridad (OWASP Mobile Top 10)

`npm run test:security`: **10 suites / 94 casos en verde**. Cada control tiene al menos una prueba nombrada con su ID y su categoría OWASP.

| Control | OWASP | Evidencia (archivo) |
|---|---|---|
| S-01 | M9 · M1 | `src/lib/storage/secureStorage.security.test.ts` |
| S-02 | M3 | `src/lib/api/client.security.test.ts` |
| S-03 | M3 · M9 | `src/features/auth/session.security.test.tsx` |
| S-04 | M3 | `src/features/auth/session.security.test.tsx` |
| S-05 | M3 · M6 | `src/features/profile/deleteAccount.security.test.tsx` |
| S-06 | M6 · M9 | `src/lib/api/client.security.test.ts`, `src/features/auth/session.security.test.tsx` |
| S-07 | M5 | `src/lib/config.security.test.ts` |
| S-08 | M6 | `src/__arch__/rules.security.test.ts` |
| S-09 | M4 | `src/features/auth/schemas.security.test.ts` |
| S-10 | M4 | `src/lib/api/moderation.security.test.ts` |
| S-11 | M4 | `src/features/images/upload.security.test.ts` (S-11g/h, spec 021-T013: la subida solo va a la API de Cloudinary por https; cualquier otro destino se rechaza sin abrir conexión) |
| S-12 | M2 · M8 | `src/__arch__/rules.security.test.ts` (incluye casos negativos en memoria, CA-04; spec 021: S-12n sin copia de seguridad, S-12o R8, S-08b con los permisos bloqueados) |
| S-13 | M3 · M4 | `src/features/notifications/push.security.test.ts`; el registro del token lo cubren además `usePushRegistration.test.tsx` y `NotificationsBootstrap.test.tsx` |
| S-14 | M3 · M9 | `src/features/auth/sessionProtection.security.test.tsx` (spec 021-T015): capturas bloqueadas en pantallas sensibles (S-14a), inactividad de 15 min (S-14b, S-14c), bloqueo con biometría opcional (S-14d) y marca solo en el almacén seguro (S-14e). Excepción formal de pinning, root y Play Integrity en `seguridad-nivel.md` |

**Otras pruebas con aserciones de seguridad** (conservadas, no movidas ni debilitadas): `session.test.tsx`, `notifications.integration.test.tsx`, `chat` y `items`. La columna OWASP es cobertura por categoría, **no una certificación**.

## 4. Integración, accesibilidad y otras pruebas

**14 suites de integración** (93 casos, incluidas en el conteo de §1): `session`, `navigation`, `items`, `search`, `bookings`, `chat`, `handover`, `trust`, `notifications`, `profile`, `journey` (`src/__e2e__/`), `reports.wiring` y los `flow.test.tsx` de IA y recomendaciones. Cubren los flujos de la spec §3.2, incluidos los que antes no tenían prueba propia: incidencias, perfil, inicio y proyecto guiado.

- **Accesibilidad automatizada:** `src/__a11y__/a11y.test.tsx` comprueba nombre accesible y área táctil ≥ 44 pt en inicio de sesión, Explorar, detalle de objeto, solicitud, chat y Perfil. **Límite:** los controles cuyo tamaño depende del contenido no se miden.
- **Punta a punta (Jest):** `src/__e2e__/journey.integration.test.tsx` con `src/__e2e__/fakeApi.ts` (esquemas zod estrictos del contrato y registro de `violations`).
- **Contraste de tokens:** `src/theme/tokens.test.ts`.
- **Verificación manual en Expo Go:** ejecutada por la persona y registrada en `memoria.md` para las specs 002–015 (fechas 2026-11-10 a 2026-11-25). En la spec 016 **no se ejecutó** ninguna verificación manual nueva; el recorrido en teléfono es T009.

## 5. Dispositivo físico (RF-07, RF-08)

**No ejecutado.** Flujos preparados en `.maestro/00-registro.yaml` a `06-baja.yaml` y documentación en `docs/calidad/dispositivo.md` §«Comprobaciones previas». Motivo: no hay teléfono conectado, `adb devices -l` y `maestro --version` responden «no se reconoce…», e instalar Maestro o tocar el teléfono requiere autorización expresa. Tampoco se confirmaron los datos de demostración del backend 016-T012 (tarea abierta, `seed` bloqueado).

Sí se ejecutaron las guardas (CA-08): `npm run test:device` sin dispositivo terminó con código 2, mensaje claro y **0 resultados** escritos. No hay informe JUnit en `docs/calidad/dispositivo/` ni capturas en `docs/evidencia/016/`. Riesgo registrado: el host de `eas.json` sin puerto responde `/api/v1/meta` con `environment: production`; la corrida debe fijar `E2E_API_URL=https://vaiven-staging.westus2.cloudapp.azure.com:8443` o usar Expo Go con `.env`. Las credenciales `E2E_*` solo existen como variables de entorno; nunca se versionan.

## 6. Correspondencia con la auditoría (spec §3.3)

| Pregunta o petición de la auditoría | Dónde se responde | Evidencia real / resultado |
|---|---|---|
| ¿Se implementaron pruebas unitarias? ¿Cuántas resultaron? | RF-01, RF-09 | §1: `npm run test:report`, 122 suites / 1 677 casos en verde; `docs/calidad/conteo.json` |
| ¿Se implementaron pruebas de seguridad? ¿Cuántas resultaron? | RF-04, RF-09 | §1 y §3: `npm run test:security`, 10 suites / 94 casos en verde; S-01…S-13 con archivo por control |
| ¿Se implementaron pruebas de integración? ¿Cuántas resultaron? | RF-05, RF-09 | §1 y §4: 14 suites / 93 casos en verde; lista de archivos de integración y §3.2 |
| ¿En qué pantallas con endpoints no se implementaron pruebas…? Flujos y qué prueba faltó | RF-02 | `docs/calidad/pantallas.md` (27 rutas, 26 pantallas) y `pantallas-notas.md`: 0 huecos de unitaria, `RegisterScreen` cubierto por navegación, 24 huecos de seguridad justificados por capa |
| ¿Qué otras pruebas se realizaron? | RF-06, RF-07, RF-09 | §4: `a11y.test.tsx`, `journey.integration.test.tsx`, `tokens.test.ts`; Expo Go manual de specs anteriores en `memoria.md`. Suite en dispositivo de la 016: **no ejecutado** (§5) |
| ¿Se valida la carga de imágenes / el texto inapropiado? | S-10, S-11 | `upload.security.test.ts` (S-11a–f) y `moderation.security.test.ts` (S-10a–b), ambos en verde |
| ¿Hay módulo para eliminar la cuenta? ¿Persiste la sesión? ¿El logout consume un endpoint? | S-05, S-04, S-03 | `deleteAccount.security.test.tsx` y `session.security.test.tsx` (S-03a–d, S-04a–d, S-05a–d), en verde |
| ¿Push? ¿En qué flujo? | S-13, flujo de notificaciones §3.2 | `push.security.test.ts` (S-13a–d), `notifications.integration.test.tsx` y `usePushRegistration.test.tsx` / `NotificationsBootstrap.test.tsx` |
| ¿Cumple OWASP Mobile Top 10? | Columna OWASP de §3.1 | §3: categorías M1–M9 cubiertas por S-01…S-13 en la corrida de seguridad; cobertura por categoría, no certificación |
| §3: suite automatizada con dispositivo físico desde PowerShell o terminal del IDE | RF-07, RF-08 | Guardas ejecutadas (CA-08, código 2 sin resultados); flujos en teléfono **no ejecutados** (§5, T009) |

## 7. Revisión de constitución v1.3.1 (rol `revisor-constitucion`)

**Veredicto: CONFORME con observaciones.** Este veredicto evalúa el cumplimiento constitucional del trabajo de la Fase 4; **no equivale a dar por cerradas T010 ni T011**.

- **Art. I:** spec, plan y tasks existen antes del informe; no se escribió código de aplicación.
- **Art. II, III y IX:** todo pasa por el cliente de API y se valida con zod; `npm run typecheck && npm run lint && npm test` en verde; cobertura 99,65 % y umbrales intactos. Ninguna prueba se movió, debilitó ni omitió para lograr verde (`git diff` de la spec solo agregó archivos).
- **Art. V y VII:** informe y textos en español; sin colores ni valores de diseño literales fuera de `theme/`; accesibilidad automatizada en seis pantallas clave.
- **Art. VIII, X y XIII:** sin secretos ni credenciales en el repositorio; `E2E_*` solo por entorno; sin dependencias nuevas de la app (Maestro es herramienta externa); `memoria.md` solo se anexa y la documentación vive en `docs/calidad/`.
- **Art. XIV y XV:** la verificación prevista es Expo Go contra staging; la corrida en teléfono queda diferida sin autorización; no se hicieron commits, push, merges ni PR.

**Observaciones:** (1) CA-07 no ejecutado bloquea T009 y, por dependencia, el cierre de T010/T011; (2) aviso conocido de worker de Jest al terminar, sin fallos; (3) `eas.json` apunta a `:443` donde `/meta` dice `production`, por lo que la corrida física debe fijar `:8443`; (4) la revisión es estática y no sustituye la verificación en dispositivo ni una certificación de seguridad.

## 8. Criterios de aceptación (recorrido de T011)

| CA | Resultado | Evidencia |
|---|---|---|
| CA-01 | Conforme | `npm run test:report`: conteo por tipo, 0 no ejecutadas y caso negativo probado en Fase 1 |
| CA-02 | Conforme con observación | `pantallas.md` y `pantallas-notas.md`: 27 rutas, 26 pantallas; `RegisterScreen` cubierto por navegación |
| CA-03 | Conforme | `npm run test:security`: 10/94 en verde, S-01…S-13 nombrados |
| CA-04 | Conforme | `rules.security.test.ts` con casos negativos en memoria |
| CA-05 | Conforme | 14 suites de integración en verde, incluidos los flujos nuevos |
| CA-06 | Conforme | `a11y.test.tsx` en las seis pantallas clave; límite de tamaño por contenido declarado |
| CA-07 | **No ejecutado** | Sin teléfono, `adb` ni Maestro; sin autorización (T009) |
| CA-08 | Conforme | `npm run test:device` sin dispositivo: código 2, mensaje claro, 0 resultados |
| CA-09 | Conforme | Este informe con fecha, comando y tabla §3.3 con evidencia; device dice «no ejecutado» |
