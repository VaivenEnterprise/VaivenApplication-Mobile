# DevOps y DevSecOps

Solicitud del responsable: integrar CI, seguridad y validacion de ramas y PRs en los tres repositorios (2026-11-02). Esta integracion es independiente de las specs funcionales y no cambia la constitucion.

## Ramas y revisores

- Cambios en tipo/SPEC-01-T001 (feat, feature, fix, bugfix, hotfix, chore, ci, docs, refactor, test, perf, security, release, build o revert) hacia develop.
- Publicaciones de develop hacia main; urgencias en hotfix/SPEC-01-T001 hacia main y despues sincronizacion de main hacia develop.
- Titulos libres; completar Resumen, Validación y Seguridad en el PR.
- Revisores obligatorios: @JesusTrz y @JosephYanez27, ambos en `.github/CODEOWNERS` (`* @JesusTrz @JosephYanez27`) y con `require_code_owner_review: true` en `.github/rulesets/protected-branches.json`. Al preparar esta configuracion (2026-11-02) JosephYanez27 tenia solo lectura y su aprobacion no contaba; la persona responsable informa que ya se le concedio escritura. **No se puede comprobar desde el repositorio**: los permisos de la cuenta se confirman en GitHub (Settings > Collaborators).
- Una aprobacion de un code owner distinto al autor, aprobacion del ultimo cambio, conversaciones resueltas y rama actualizada. Cambios nuevos invalidan aprobaciones anteriores.

## Controles

CI corre en PRs, push a main/develop/spec/**, manualmente y semanalmente. Required checks agrega Policy, Quality, Secrets, CodeQL, SBOM y Mobile SAST (estos dos desde la spec 021, ver abajo); falla si un control requerido falla o se cancela. CodeQL, SBOM y Mobile SAST solo se omiten cuando no hay aplicacion inicializada.

Policy verifica nombres, destino, secciones del PR y archivos sensibles. Gitleaks examina el historial alcanzable completo y los archivos actuales, con salida redactada, binario versionado y SHA-256 verificado. Las acciones se fijan por commit y Dependabot propone actualizaciones hacia develop. El token es de lectura salvo la carga de resultados de CodeQL. No se usan secretos de despliegue en PRs.

Al existir package.json: package-lock.json obligatorio, npm ci, typecheck, lint, Jest con cobertura y auditoria de dependencias con .github/scripts/audit.mjs (equivale a npm audit y bloquea high/critical; solo tolera los avisos listados en .github/audit-exceptions.json, cada uno con justificacion, aprobacion y fecha de vencimiento: una excepcion vencida falla). Cobertura minima del 80% por archivo de src/lib y hooks de features; Jest debe incluir todos esos archivos con collectCoverageFrom. CI no construye APK/AAB ni sustituye la verificacion manual en Expo Go.

Mientras solo exista documentacion, Quality informa que no aplican las pruebas de aplicacion; los controles de politica y secretos siguen siendo reales. Agregar codigo sin su manifiesto/verificador hace fallar CI. Dependabot para npm empezara a trabajar cuando exista su manifiesto.

## Activacion administrativa pendiente

Los archivos de este PR no activan por si solos proteccion de ramas ni ajustes de seguridad. La conexion usada no expone administracion de repositorios.

1. Revisar y fusionar este PR en develop con sus comprobaciones en verde; promover los mismos archivos a main mediante PR develop -> main.
2. Conceder escritura a JosephYanez27 si debe ser revisor obligatorio y agregarlo a la linea de CODEOWNERS. Si el autor es JesusTrz, necesitara a JosephYanez27 o al propietario VaivenEnterprise como code owner habilitado para aprobar.
3. En Settings > Rules > Rulesets > New ruleset > Import a ruleset, importar .github/rulesets/protected-branches.json. Revisar que ambas ramas tienen el workflow antes de activarlo. Requiere Required checks proveniente de GitHub Actions, una aprobacion de code owner, ultimo cambio aprobado y conversaciones resueltas; bloquea eliminaciones, force push y push directo, sin excepciones.
4. En Settings > Code security, habilitar Dependabot alerts/security updates, secret scanning, push protection y private vulnerability reporting cuando esten disponibles. No activar CodeQL default setup porque este PR ya define advanced setup.
5. En Actions > General: token de lectura, no permitir que Actions apruebe PRs, y requerir aprobacion de workflows para contribuciones externas. Revisar ejecuciones antes de aprobar codigo externo.

## Despliegue y recuperacion

Backend y landing conservan el despliegue por MCP a Render; movil conserva Expo Go y la publicacion de la spec 013. Este cambio no crea servicios ni publica produccion. Antes de desplegar se exige CI en verde, aprobacion humana y las verificaciones de cada spec. Render no debe publicar automaticamente cada push sin estos controles. La cuenta administradora debe revisar esa configuracion cuando conecte Render al origen.

Para volver a una version anterior: PR de revert, mismos controles y despliegue por MCP del commit aprobado. No usar force push. No hay credenciales nuevas en el repositorio; el unico flujo que compila la app es el CD manual de la spec 021 (ver «CD manual»), que no tiene acceso a Play y no esta activado.

CodeQL exporta SARIF y el workflow bloquea hallazgos con security-severity >= 7 o nivel error. No basta con que la carga de resultados termine correctamente.

## Nombres de ramas con trazabilidad

Formato para ramas de tareas: `tipo/SPEC-NN-TNNN`. SPEC requiere al menos dos digitos; la tarea al menos tres; se admiten numeros mayores. Ejemplo: `chore/SPEC-01-T001`. No se permiten sufijos ni segmentos adicionales. La validacion comprueba el formato, no la existencia del ticket en Jira.

Se conservan las promociones develop -> main, la sincronizacion main -> develop y las ramas automaticas dependabot/* solo para PRs del bot autentico hacia develop. La regla se ejecuta en Policy; para bloquear la fusion se debe exigir Required checks en la proteccion de ramas. No impide crear una rama en GitHub.


## Trabajo por spec completa

Crear `spec/SPEC-02` desde `develop`. No lleva sufijo de tarea. SCRUM y SPEC requieren al menos dos digitos, sin texto adicional.

Implementar las tareas en esa rama, una a la vez, o crear ramas de tarea desde ella y abrir sus PRs hacia la rama de spec. Por ejemplo, `feat/SPEC-02-T001` -> `spec/SPEC-02`. El segmento opcional SCRUM-NN- puede variar por tarea; el numero SPEC debe coincidir (02 y 002 son equivalentes). Los titulos de PR son libres; Resumen, Validación y Seguridad siguen siendo obligatorios.

Al completar la spec: PR de la rama de spec hacia `develop`. Para actualizarla: PR `develop` -> rama de spec. No se permite spec -> main ni integrar tareas de otra SPEC. Se conserva el flujo tarea -> develop y la promocion develop -> main.

CI se ejecuta en push y PR hacia `spec/**`, ademas de main/develop. Primero integrar esta configuracion en develop y despues crear las ramas de spec. Para una spec ya creada, incorporar estos archivos antes de usar el nuevo flujo.

Las protecciones administrativas no se activan con estos archivos. Si se quiere exigir revision y Required checks tambien en specs, un administrador debe incluir las ramas `spec/**` en un ruleset activo. Sin esa configuracion, los checks se ejecutan pero no impiden por si solos una fusion.

## Ticket SCRUM opcional

Formatos: `spec/SPEC-02` para una spec completa y `feat/SPEC-02-T001` para una tarea (con los tipos existentes). Tambien se aceptan `spec/SCRUM-01-SPEC-02` y `feat/SCRUM-15-SPEC-02-T001`. Si se incluye SCRUM, conserva mayusculas y al menos dos digitos. SPEC sigue siendo obligatorio con al menos dos digitos; T sigue siendo obligatorio en ramas de tarea con al menos tres. Los destinos permitidos, las revisiones y los controles de seguridad no cambian.

## Ramas por fase

Tambien se permite `tipo/SPEC-NN-Fase-N`, por ejemplo `feat/SPEC-02-Fase-3`, con los mismos tipos de cambio que las tareas. `SCRUM-NN-` sigue siendo opcional: `feat/SCRUM-01-SPEC-02-Fase-3`. Se escribe `Fase` exactamente asi y su numero lleva uno o mas digitos (incluido 0 si el plan tiene fase cero). SPEC mantiene al menos dos digitos.

Crear la rama de fase desde la rama de spec y abrir su PR hacia esa misma SPEC; tambien se permite fase -> develop. No se permite fase -> main, ni fase -> otra SPEC. Las ramas de fase no son destinos de PR de tareas: implementar las tareas de la fase en ella y conservar el formato por tarea para los flujos existentes. Los titulos de PR siguen siendo libres y se mantienen las secciones de evidencia y los controles de seguridad.

Las ramas de spec existentes deben incorporar esta actualizacion desde develop para validar PRs de fase con la nueva politica.

## SBOM, analisis estatico movil y auditoria portable (spec 021, T021 y T022)

- **Auditoria de dependencias** (`.github/scripts/audit.mjs`): funciona en Linux (CI) y en Windows. En Windows npm es `npm.cmd` y Node solo lo lanza con shell (CVE-2024-27980); la orden es fija (`npm audit --json`), sin argumentos que vengan de fuera. Si npm no se puede lanzar, falla con «No se pudo ejecutar npm audit» en lugar de un error de JSON. Pruebas de ambos sistemas en `audit.test.mjs`. `.github/audit-exceptions.json` queda vacio: `GHSA-fc5q-39xc-vjpf` (`picomatch`) ya no aparece en `npm audit` y se retiro. Cifras reales en `docs/seguridad.md` (punto 8).
- **SBOM** (job `SBOM`): `npm sbom --sbom-format cyclonedx --package-lock-only` (viene con npm; sin dependencias nuevas) genera `sbom.cdx.json` desde el lockfile; `.github/scripts/sbom.mjs` comprueba que sea CycloneDX, que describa esta app y su version, que cada componente tenga `purl` y que esten todas las dependencias directas; se publica como artefacto `sbom-cyclonedx` (90 dias).
- **Analisis estatico movil** (job `Mobile SAST`): `mobsfscan` 1.2.0 (reglas de MobSF para React Native, Expo, Android e iOS) sobre `src`, `app.config.ts` y `eas.json`. Es herramienta del CI, no de la app: version fija y wheel verificado por SHA-256 antes de instalarlo, como Gitleaks; sus dependencias de Python las resuelve pip por version (semgrep queda fijado por el propio mobsfscan) y el job no tiene secretos ni permisos de escritura. `.github/scripts/mobsf.mjs` decide: bloquea todo hallazgo `error` o `warning` del codigo que se empaqueta; no cuenta las pruebas ni sus dobles (`*.test.*`, `src/test/`, `src/__e2e__/`, `src/__a11y__/`, `src/__arch__/`: sus URLs `http://` y secretos falsos no llegan a la app); acepta solo lo listado en `.github/mobsf-exceptions.json` (regla + archivo, con motivo, aprobacion y vencimiento; una vencida falla). El SARIF se publica como artefacto `mobsfscan-sarif`.
- **Excepciones vigentes de mobsfscan** (vencen el 2027-02-27): `js_biometric_without_crypto` en `src/features/auth/biometrics.ts` (la biometria solo confirma presencia; no libera claves; T015) y `js_deeplink_open_url` en `RegisterScreen.tsx` (la URL es `EXPO_PUBLIC_LEGAL_URL` validada mas una pagina fija; D-139). Primera corrida local (2026-11-27): 2 hallazgos de la app, ambos aceptados; 117 en pruebas.
- **Gate**: `Required checks` exige ahora `SBOM` y `Mobile SAST` en verde cuando hay aplicacion (y `skipped` cuando no), igual que CodeQL. Las pruebas de los verificadores (`sbom.test.mjs`, `mobsf.test.mjs`) corren en `Policy`.

## CD manual (spec 021, T023) — preparado y sin ejecutar

`.github/workflows/release.yml` («Release (EAS Build)») compila la app con EAS Build. **No se ha ejecutado** y no puede ejecutarse hasta que se activen los pasos administrativos de abajo; ninguno se hizo desde la sesion que lo preparo.

- **Como arranca**: solo a mano (`workflow_dispatch`, Actions > Release (EAS Build) > Run workflow), eligiendo el perfil de `eas.json`: `preview` (APK de prueba; desde `main`, `develop` o `spec/*`) o `production` (AAB para Play; solo desde `main`). No tiene `push`, `schedule` ni `pull_request`.
- **Que hace**: el job `verify` repite los controles del CI (`npm ci`, typecheck, lint, Jest con cobertura, cobertura minima y `audit.mjs`). Despues el job `build` queda **en espera de aprobacion** del entorno `eas-build`; al aprobarse, recibe `EXPO_TOKEN` y lanza `eas-cli@27.11.0 build --platform android --profile <perfil> --non-interactive --no-wait` (EAS compila en sus servidores; el enlace sale en el registro del job). **No ejecuta `eas submit`**: el AAB lo sube el administrador desde Play Console (Art. XIV.7, `docs/play/lanzamiento.md`).
- **Quien aprueba**: los revisores obligatorios del entorno `eas-build`. Se propone a los code owners (@JesusTrz y @JosephYanez27, los mismos de `.github/CODEOWNERS`); lo confirma y configura quien administra el repositorio.
- **Controles**: permisos del flujo `contents: read`; acciones fijadas por SHA; `eas-cli` con version exacta; el perfil pasa por variable de entorno (nunca dentro de `run`); `EXPO_TOKEN` solo desde `secrets.EXPO_TOKEN` y solo en el job con entorno. `.github/scripts/release.mjs` lo comprueba sobre el texto del flujo (`release.test.mjs`, con casos negativos; corre en `Policy`), asi que un cambio que lo relaje rompe el CI.

**Activacion (requiere autorizacion; servicios externos):**

1. Quien administra la cuenta de Expo crea un *access token* de un usuario robot o de la cuenta con permisos minimos (expo.dev > Account settings > Access tokens).
2. Quien administra el repositorio crea el entorno `eas-build` (Settings > Environments) con **Required reviewers** (los aprobadores acordados), marca «Prevent self-review» y limita las ramas de despliegue a `main`, `develop` y `spec/*`.
3. Guarda el token como **secreto del entorno** `eas-build` con el nombre `EXPO_TOKEN` (nunca en el repositorio, nunca como secreto de repositorio ni en `EXPO_PUBLIC_*`).
4. La primera ejecucion se hace con `preview`, con aprobacion explicita, y el resultado (enlace de EAS, fecha y quien aprobo) se anota en `memoria.md`.

Hasta entonces, compilar sigue siendo `eas build` desde la maquina de la persona, con su aprobacion (spec 013).
