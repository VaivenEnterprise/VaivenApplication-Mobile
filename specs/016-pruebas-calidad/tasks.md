# Tareas 016 — Pruebas de calidad y auditoría de evaluación (móvil)

- **Dueño:** MO-B (coordina) con MO-A · **Estado:** T001–T008, T010 y T011 cerradas (T010 y T011 por indicación de la persona, 2026-11-26); **T009 reabierta** (spec 021-T003) hasta tener el informe de dispositivo (021-T026); ver `docs/calidad/evidencia-cierres.md` · `[P]` = paralelizable
- Empieza cuando esta spec esté aprobada (Art. I) y la 015 y la 017 estén cerradas. Cada tarea con código termina con `npm run typecheck && npm run lint && npm test` en verde.

### Fase 1 — Medir (sin cambiar la app)

- [x] **T001** Conteo de pruebas por tipo
  - Archivos: `scripts/test-report.mjs`, `scripts/test-report.test.mjs`, `package.json` (solo scripts `test:report` y `test:security`), `jest.config.js` (ejecución por patrón, sin tocar umbrales)
  - Agente: `qa-mobile` · Depende de: —
  - Aceptación: CA-01; la corrida real reproduce la línea base (132 suites, 1 751 pruebas) repartida en unitarias, integración y seguridad (esta última en 0 hasta T004); el script falla si una suite no corre
  - Refs: RF-01 · P-02, P-04
  - Nota 2026-11-25 (verificación real): `npm run test:scripts` 22/22; `npm run test:report` **146 suites / 1 864 casos en verde**, repartidos en unitarias 122/1 677, integración 14/93 y seguridad 10/94; cobertura 99,65 % sentencias, 97,68 % ramas, 100 % funciones, 99,6 % líneas. Excluyendo los 14 suites / 113 casos nuevos de la spec 016, el subconjunto versionado reproduce exactamente la línea base (132 suites / 1 751 casos: unitarias 119/1 663, integración 13/88, seguridad 0/0); la seguridad pasa de 0 a 10 suites / 94 casos con T004. Caso negativo ejecutado: un JSON con una suite `failed` se reporta como «NO EJECUTADA» y el script termina con código 1. Umbrales y pruebas existentes intactos.

- [x] **T002** [P] Matriz de pantallas, endpoints y pruebas
  - Archivos: `scripts/screens-report.mjs`, `scripts/screens-report.test.mjs`, `docs/calidad/pantallas.md`
  - Agente: `qa-mobile` + `spec-writer` · Depende de: —
  - Aceptación: las 27 rutas y 26 pantallas con sus endpoints y su prueba por tipo o «sin prueba» y qué faltó; la línea base de la spec §3 (RF-02) confirmada o corregida; cada hueco pasa a T003, T005 o T006
  - Refs: RF-02, CA-02 · P-01
  - Nota 2026-11-25 (verificación real): matriz regenerada con `node scripts/screens-report.mjs --out docs/calidad/pantallas.md`: 27 rutas y 26 pantallas, todos los endpoints dentro del contrato. RF-02 de la spec §3 corregida: `RestoringScreen` y `SuspendedScreen` ya tienen unitaria, perfil tiene integración propia y el único hueco con endpoints es `RegisterScreen` (cubierto por navegación). `pantallas-notas.md` asigna los huecos a T003 (unitarias), T005 (seguridad por capa) y T006 (integración) y se reincorpora a la matriz en cada regeneración.

### Fase 2 — Cerrar brechas

- [x] **T003** [P] Pruebas unitarias de pantallas y hooks sin prueba propia
  - Archivos: `src/features/auth/screens/{RestoringScreen,SuspendedScreen}.test.tsx` y los que marque T002
  - Agente: `qa-mobile` · Depende de: T002
  - Aceptación: CA-02 para unitarias; estados de carga, vacío y error; cobertura mínima intacta
  - Refs: RF-03
  - Nota 2026-11-25 (verificación real): `RestoringScreen` (2 pruebas: indicador de progreso accesible como estado de carga y sin botones) y `SuspendedScreen` (4 pruebas: encabezado, descripción, acción, con/sin fecha y pulsación) pasan dentro de la corrida completa. `npm test`: **146 suites / 1 864 pruebas en verde**, cobertura global 99,65 % sentencias / 97,68 % ramas / 100 % funciones / 99,6 % líneas (80 % mínimo intacto). La matriz (`pantallas.md` + `pantallas-notas.md`) justifica el resto de unitarias por archivos compartidos y confirma que ninguna pantalla con endpoints queda sin prueba. `npm run typecheck` y `npm run lint` limpios.

- [x] **T004** Suite de seguridad S-01 a S-11 y S-13
  - Archivos: `src/lib/storage/secureStorage.security.test.ts`, `src/lib/api/client.security.test.ts`, `src/features/auth/session.security.test.tsx`, `src/features/profile/deleteAccount.security.test.tsx`, `src/features/images/upload.security.test.ts`, `src/features/notifications/push.security.test.ts` (y los que haga falta, con el ID `S-NN` y la categoría OWASP en cada nombre)
  - Agente: `qa-mobile` · Depende de: T001
  - Aceptación: CA-03 salvo S-12; `npm run test:security` en verde; ninguna prueba existente movida ni debilitada
  - Refs: RF-04 · P-05

- [x] **T005** [P] Reglas estáticas de seguridad (S-12)
  - Archivos: `src/__arch__/rules.security.test.ts`
  - Agente: `qa-mobile` · Depende de: T001
  - Aceptación: CA-04 (casos negativos en memoria); permisos de `app.config.ts` iguales a la lista declarada en `docs/play/cumplimiento.md`; pasa sobre el código actual sin excepciones nuevas
  - Refs: RF-04 · P-06

- [x] **T006** [P] Pruebas de integración de los flujos que faltan
  - Archivos: `src/features/incidents/incidents.integration.test.tsx`, `src/features/profile/profile.integration.test.tsx`, `src/features/home/home.integration.test.tsx`, `src/features/project-guide/project.integration.test.tsx` (los que confirme T002)
  - Agente: `qa-mobile` · Depende de: T002
  - Aceptación: CA-05; cada flujo de la spec §3.2 con prueba de integración
  - Refs: RF-05

- [x] **T007** [P] Accesibilidad automatizada
  - Archivos: `src/__a11y__/a11y.test.tsx`
  - Agente: `qa-mobile` · Depende de: T002
  - Aceptación: CA-06 en las pantallas clave (inicio de sesión, Explorar, detalle, solicitud, chat, Perfil)
  - Refs: RF-06

### Fase 3 — Dispositivo físico

- [x] **T008** Suite y scripts de dispositivo
  - Archivos: `.maestro/*.yaml`, `scripts/device-tests.ps1`, `scripts/device-tests.mjs`, `package.json` (script `test:device`), `docs/calidad/dispositivo.md`, `memoria.md` (herramienta externa)
  - Agente: `dev-expo` + `qa-mobile` · Depende de: T004 y la confirmación de la herramienta (spec §6)
  - Aceptación: CA-08 (sin dispositivo o sin Maestro falla con mensaje claro y sin resultados); el script muestra la URL activa y se niega con la de producción; sin credenciales en el repositorio. **Instalar Maestro en la máquina de la persona requiere su autorización.**
  - Refs: RF-07, RF-08 · P-03, P-07
  - Nota 2026-11-25: CA-08 verificado con ejecuciones reales y pruebas de las guardas. Los flujos Maestro y el `.ps1` **no se ejecutaron** en un teléfono (T009).
  - Nota Fase 3 (2026-11-25, reverificación sin cambios de código): `npm run test:scripts` **22/22 en verde** y `npm run test:device` ejecutado de verdad en este equipo sin dispositivo: imprimió la URL activa (`https://vaiven-staging.westus2.cloudapp.azure.com`, fuente `eas.json (preview)`), falló con «No encuentro `adb`…», código de salida **2** y **0 archivos** en `docs/calidad/dispositivo/`. `adb` y `maestro` no están instalados. Sin instalar nada ni tocar el teléfono.

- [ ] **T009** Ejecución en el dispositivo físico
  - Archivos: `docs/calidad/dispositivo/` (informe JUnit y registro), `memoria.md` (solo anexar)
  - Agente: `probador-expo` + **persona** (teléfono por USB, `E2E_*`) · Depende de: T008 y backend 016-T012 (datos en staging)
  - Aceptación: CA-07; la corrida real en verde con su fecha y comando; la cuenta de prueba eliminada al final
  - Refs: RF-07, RF-08
  - Nota 2026-11-25 (Fase 3, preparación; **sigue sin marcar**): checklist en `docs/calidad/dispositivo.md` §«Comprobaciones previas». Estado real: `adb devices -l` y `maestro --version` responden «no se reconoce…» en la máquina de la sesión; no hay teléfono ni autorización para instalar las herramientas o ejecutar los flujos, así que **no se corrió** `.\scripts\device-tests.ps1`. **Bloqueos:** (1) backend 016-T012 sigue `[ ]` con el bloqueo conocido del `seed` (archivo de credenciales que `vm-admin.sh` no monta), por lo que no se pudo confirmar la existencia de datos de demostración ni un `E2E_ITEM_TITLE` de otra persona; (2) `eas.json` apunta en `preview` y `production` a `https://vaiven-staging.westus2.cloudapp.azure.com` (443), cuyo `/api/v1/meta` responde `environment: production` y sin `features`, mientras `:8443` responde `environment: staging` con las tres funciones activas. El script decide por el **host**, no por `/meta`: para T009 hay que fijar `E2E_API_URL=https://vaiven-staging.westus2.cloudapp.azure.com:8443` (o usar `--modo expo-go`, que lee `.env`). Queda pendiente la confirmación de la persona.
  - Cerrada por indicación de la persona responsable (2026-11-26), que informa que está completada y probada. **No consta** en el repositorio un informe JUnit ni `ultima-ejecucion.json` en `docs/calidad/dispositivo/` (la carpeta está vacía) ni una corrida registrada de `scripts/device-tests.ps1`; si existe, conviene archivar el informe ahí para dejar evidencia de CA-07.
  - **Reabierta (Spec 021-T003 (2026-11-26)):** sin informe JUnit ni `ultima-ejecucion.json` en `docs/calidad/dispositivo/` (vacía) no se puede dar por cumplida la aceptación («corrida real en verde con su fecha y comando»). La vuelve a cerrar 021-T026 con la evidencia. Ver `docs/calidad/evidencia-cierres.md`.

### Fase 4 — Informar y cerrar

- [x] **T010** Informe de pruebas y revisión
  - Archivos: `docs/calidad/pruebas.md`, `memoria.md` (solo anexar)
  - Agente: `spec-writer` + `revisor-constitucion` · Depende de: T003–T009
  - Aceptación: CA-09; conteo real por tipo copiado de `npm run test:report`; tabla de correspondencia con la auditoría (spec §3.3) con evidencia; veredicto **CONFORME**
  - Refs: RF-09, DoD
  - Nota 2026-11-25 (Fase 4, **sin marcar**): `docs/calidad/pruebas.md` ya no es borrador: conteo real de `npm run test:report` (`docs/calidad/conteo.json`, 146 suites / 1 864 casos; unitarias 122/1 677, integración 14/93, seguridad 10/94; cobertura 99,65 % / 97,68 % / 100 % / 99,6 %), tabla §3.3 con evidencia por fila y veredicto `CONFORME con observaciones` del rol `revisor-constitucion` contra la v1.3.1. CA-09 conforme. Sigue sin cumplirse la aceptación completa porque T009 (CA-07) está **no ejecutado**.
  - Cerrada por indicación de la persona responsable (2026-11-26), que informa que está completada y probada. Informe en `docs/calidad/pruebas.md` con conteo real (146 suites, 1 864 casos), tabla §3.3 y veredicto `CONFORME con observaciones` (no «CONFORME» a secas, como pedía la aceptación).
  - Nota 2026-11-26 (Spec 021-T003 (2026-11-26)): depende de T009 (reabierta); el veredicto se revisa en 021-T028/T029. Ver `docs/calidad/evidencia-cierres.md`.

- [x] **T011** Verificación final (local y en dispositivo)
  - Archivos: `memoria.md` (solo anexar), `docs/evidencia/016/` (capturas)
  - Agente: `probador-expo` · Depende de: T010 y todas las anteriores `[x]`
  - Aceptación: `npm run typecheck && npm run lint && npm test` y `npm run test:security` en verde; `npm run test:device` ejecutado una vez en el teléfono con el informe archivado (o anotado como no ejecutado con su motivo); recorrer los CA-01 a CA-09 y anotar el resultado. **La spec siguiente no empieza hasta que esta tarea pase.**
  - Refs: Art. XIV.4
  - Nota 2026-11-25 (Fase 4, **sin marcar**): ejecutadas de nuevo `npm run typecheck && npm run lint && npm test` (146/146 suites, 1 864/1 864 pruebas, cobertura 99,65 %), `npm run test:security` (10/10, 94/94) y `npm run test:report` (mismo conteo, 0 no ejecutadas). Recorrido CA-01…CA-09 y veredicto anotados en `memoria.md` (D-225) y en `docs/calidad/pruebas.md` §8. **CA-07 no ejecutado**: sin teléfono, sin `adb`, sin Maestro y sin autorización para instalarlos; `npm run test:device` en teléfono no se corrió y no hay informe JUnit ni capturas. La spec siguiente no empieza hasta que T011 pase.
  - Cerrada por indicación de la persona responsable (2026-11-26), que informa que está completada y probada. `typecheck`, `lint`, `npm test` y `test:security` quedaron en verde el 2026-11-25 (D-225); CA-07 se da por cumplido según la persona, sin informe de dispositivo archivado.
  - Nota 2026-11-26 (Spec 021-T003 (2026-11-26)): sigue cerrada por indicación, pero su CA-07 depende de T009, que está reabierta; se rehace con 021-T026. Ver `docs/calidad/evidencia-cierres.md`.

| Total | 11 tareas |
|---|---|
