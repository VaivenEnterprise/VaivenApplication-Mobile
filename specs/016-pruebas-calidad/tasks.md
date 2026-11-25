# Tareas 016 — Pruebas de calidad y auditoría de evaluación (móvil)

- **Dueño:** MO-B (coordina) con MO-A · **Estado:** sin ejecutar · `[P]` = paralelizable
- Empieza cuando esta spec esté aprobada (Art. I) y la 015 y la 017 estén cerradas. Cada tarea con código termina con `npm run typecheck && npm run lint && npm test` en verde.

### Fase 1 — Medir (sin cambiar la app)

- [ ] **T001** Conteo de pruebas por tipo
  - Archivos: `scripts/test-report.mjs`, `scripts/test-report.test.mjs`, `package.json` (solo scripts `test:report` y `test:security`), `jest.config.js` (ejecución por patrón, sin tocar umbrales)
  - Agente: `qa-mobile` · Depende de: —
  - Aceptación: CA-01; la corrida real reproduce la línea base (132 suites, 1 751 pruebas) repartida en unitarias, integración y seguridad (esta última en 0 hasta T004); el script falla si una suite no corre
  - Refs: RF-01 · P-02, P-04

- [ ] **T002** [P] Matriz de pantallas, endpoints y pruebas
  - Archivos: `scripts/screens-report.mjs`, `scripts/screens-report.test.mjs`, `docs/calidad/pantallas.md`
  - Agente: `qa-mobile` + `spec-writer` · Depende de: —
  - Aceptación: las 27 rutas y 26 pantallas con sus endpoints y su prueba por tipo o «sin prueba» y qué faltó; la línea base de la spec §3 (RF-02) confirmada o corregida; cada hueco pasa a T003, T005 o T006
  - Refs: RF-02, CA-02 · P-01

### Fase 2 — Cerrar brechas

- [ ] **T003** [P] Pruebas unitarias de pantallas y hooks sin prueba propia
  - Archivos: `src/features/auth/screens/{RestoringScreen,SuspendedScreen}.test.tsx` y los que marque T002
  - Agente: `qa-mobile` · Depende de: T002
  - Aceptación: CA-02 para unitarias; estados de carga, vacío y error; cobertura mínima intacta
  - Refs: RF-03

- [ ] **T004** Suite de seguridad S-01 a S-11 y S-13
  - Archivos: `src/lib/storage/secureStorage.security.test.ts`, `src/lib/api/client.security.test.ts`, `src/features/auth/session.security.test.tsx`, `src/features/profile/deleteAccount.security.test.tsx`, `src/features/images/upload.security.test.ts`, `src/features/notifications/push.security.test.ts` (y los que haga falta, con el ID `S-NN` y la categoría OWASP en cada nombre)
  - Agente: `qa-mobile` · Depende de: T001
  - Aceptación: CA-03 salvo S-12; `npm run test:security` en verde; ninguna prueba existente movida ni debilitada
  - Refs: RF-04 · P-05

- [ ] **T005** [P] Reglas estáticas de seguridad (S-12)
  - Archivos: `src/__arch__/rules.security.test.ts`
  - Agente: `qa-mobile` · Depende de: T001
  - Aceptación: CA-04 (casos negativos en memoria); permisos de `app.config.ts` iguales a la lista declarada en `docs/play/cumplimiento.md`; pasa sobre el código actual sin excepciones nuevas
  - Refs: RF-04 · P-06

- [ ] **T006** [P] Pruebas de integración de los flujos que faltan
  - Archivos: `src/features/incidents/incidents.integration.test.tsx`, `src/features/profile/profile.integration.test.tsx`, `src/features/home/home.integration.test.tsx`, `src/features/project-guide/project.integration.test.tsx` (los que confirme T002)
  - Agente: `qa-mobile` · Depende de: T002
  - Aceptación: CA-05; cada flujo de la spec §3.2 con prueba de integración
  - Refs: RF-05

- [ ] **T007** [P] Accesibilidad automatizada
  - Archivos: `src/__a11y__/a11y.test.tsx`
  - Agente: `qa-mobile` · Depende de: T002
  - Aceptación: CA-06 en las pantallas clave (inicio de sesión, Explorar, detalle, solicitud, chat, Perfil)
  - Refs: RF-06

### Fase 3 — Dispositivo físico

- [ ] **T008** Suite y scripts de dispositivo
  - Archivos: `.maestro/*.yaml`, `scripts/device-tests.ps1`, `scripts/device-tests.mjs`, `package.json` (script `test:device`), `docs/calidad/dispositivo.md`, `memoria.md` (herramienta externa)
  - Agente: `dev-expo` + `qa-mobile` · Depende de: T004 y la confirmación de la herramienta (spec §6)
  - Aceptación: CA-08 (sin dispositivo o sin Maestro falla con mensaje claro y sin resultados); el script muestra la URL activa y se niega con la de producción; sin credenciales en el repositorio. **Instalar Maestro en la máquina de la persona requiere su autorización.**
  - Refs: RF-07, RF-08 · P-03, P-07

- [ ] **T009** Ejecución en el dispositivo físico
  - Archivos: `docs/calidad/dispositivo/` (informe JUnit y registro), `memoria.md` (solo anexar)
  - Agente: `probador-expo` + **persona** (teléfono por USB, `E2E_*`) · Depende de: T008 y backend 016-T012 (datos en staging)
  - Aceptación: CA-07; la corrida real en verde con su fecha y comando; la cuenta de prueba eliminada al final
  - Refs: RF-07, RF-08

### Fase 4 — Informar y cerrar

- [ ] **T010** Informe de pruebas y revisión
  - Archivos: `docs/calidad/pruebas.md`, `memoria.md` (solo anexar)
  - Agente: `spec-writer` + `revisor-constitucion` · Depende de: T003–T009
  - Aceptación: CA-09; conteo real por tipo copiado de `npm run test:report`; tabla de correspondencia con la auditoría (spec §3.3) con evidencia; veredicto **CONFORME**
  - Refs: RF-09, DoD

- [ ] **T011** Verificación final (local y en dispositivo)
  - Archivos: `memoria.md` (solo anexar), `docs/evidencia/016/` (capturas)
  - Agente: `probador-expo` · Depende de: T010 y todas las anteriores `[x]`
  - Aceptación: `npm run typecheck && npm run lint && npm test` y `npm run test:security` en verde; `npm run test:device` ejecutado una vez en el teléfono con el informe archivado (o anotado como no ejecutado con su motivo); recorrer los CA-01 a CA-09 y anotar el resultado. **La spec siguiente no empieza hasta que esta tarea pase.**
  - Refs: Art. XIV.4

| Total | 11 tareas |
|---|---|
