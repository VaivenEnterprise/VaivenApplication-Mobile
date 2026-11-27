# Porcentaje de seguridad DevSecOps de la app móvil: método y resultado (spec 021, T024)

- **Hallazgo:** P-1 de la auditoría del 2026-11-26: el «porcentaje de seguridad DevSecOps» no tenía método reproducible (≈ 64 % según la auditoría de Claude; «no inventar una cifra» según la de OpenCode).
- **Requisito:** RF-23 de `specs/021-remediacion-auditoria/spec.md`.
- **Fecha de esta medición:** 2026-11-27, rama `spec/SPEC-21`, árbol de trabajo sin commitear (fase 5 de la spec 021).
- **Quién la hizo:** Claude como `spec-writer` y `revisor-constitucion`, leyendo el repositorio. **No es la reauditoría**: la nota de las dos auditorías la mide T029 con sus propios prompts.

## 1. Método

Se conserva **el método de la auditoría de Claude** (`Pendientes_claude.md`, pregunta 1) para que la cifra sea comparable y no mejore por cambiar la forma de medir: las mismas **22 prácticas** (12 del pipeline y 10 de la app, alineadas con OWASP MASVS), **todas con peso 1**, y la misma escala.

| Estado | Puntos | Criterio (se aplica el más bajo que encaje) |
|---|---|---|
| Cumple | 1 | El control existe en el repositorio, cubre todo el alcance de la práctica **y** hay evidencia de que funciona (prueba automatizada en verde, ejecución del CI o comprobación registrada con fecha) |
| Parcial | 0,5 | El control existe pero cubre solo parte del alcance, **o** está preparado y falta activarlo o ejecutarlo fuera de la sesión (GitHub, EAS, teléfono), **o** su activación solo consta por indicación de una persona sin evidencia en el repositorio |
| No cumple | 0 | El control no existe. Una **excepción formal** (p. ej. `seguridad-nivel.md`) explica por qué falta, pero **no suma puntos** |

**Fórmula:**

```
porcentaje = (Σ puntos_i × peso_i) / (Σ peso_i) × 100
```

con `peso_i = 1` para las 22 prácticas, el resultado **truncado** a un decimal (nunca se redondea hacia arriba). Pipeline y app también se informan por separado con la misma fórmula.

**Cómo reproducirlo:** para cada fila, abrir la evidencia citada, aplicar el criterio de la tabla anterior y sumar. Si un evaluador asigna otro estado, lo anota con su motivo en la columna de evidencia y recalcula; cambiar la lista de prácticas, sus pesos o la escala es **otro método** y se publica como versión nueva de este documento, con las dos cifras lado a lado.

## 2. Prácticas del pipeline (CI/CD) — 12

| # | Práctica | Línea base (2026-11-26) | Estado (2026-11-27) | Puntos | Evidencia |
|---|---|---|---|---|---|
| P1 | SAST del código (CodeQL) | 1 | Cumple | 1 | `.github/workflows/ci.yml` job `CodeQL`; `.github/scripts/check-sarif.mjs` bloquea `security-severity ≥ 7` o nivel `error` |
| P2 | Búsqueda de secretos (Gitleaks) | 1 | Cumple | 1 | Job `Secrets`: Gitleaks 8.30.1 con SHA-256 verificado, historial completo y árbol actual |
| P3 | Análisis de dependencias (SCA) | 1 | Cumple | 1 | `node .github/scripts/audit.mjs` en `Quality`: bloquea high/critical; excepciones con vencimiento. 2026-11-27: 0 críticas, 0 altas, 27 moderadas, sin excepciones (`docs/seguridad.md` punto 8). Funciona también en Windows (T021, `audit.test.mjs`) |
| P4 | Actualizaciones automáticas (Dependabot) | 1 | Cumple | 1 | `.github/dependabot.yml` (`npm` y `github-actions`) |
| P5 | Acciones fijadas por SHA y token mínimo | 1 | Cumple | 1 | Todas las `uses:` de `ci.yml` y `release.yml` con SHA de 40 caracteres; `permissions: contents: read` (solo CodeQL escribe resultados) |
| P6 | Política de archivos sensibles, ramas y PR | 1 | Cumple | 1 | `.github/scripts/policy.mjs` + `policy.test.mjs` en el job `Policy` |
| P7 | Protección de ramas | 0,5 | Parcial | 0,5 | `.github/rulesets/protected-branches.json` y `CODEOWNERS` en el repositorio. Su activación en GitHub consta **por indicación** de la persona (memoria, spec 017) y no se puede comprobar desde el repositorio |
| P8 | Pruebas y cobertura en el CI | 0,5 | Cumple | 1 | `Quality` corre typecheck, lint y Jest con cobertura; `.github/scripts/coverage.mjs` aplica el 80 %. Desde T007, `collectCoverageFrom` mide `src/lib` y **todos** los hooks (`hooks.ts`, `hooks/`, `use*.ts`) sin excluir nada; `npm test` 2026-11-27 en verde (D-250) |
| P9 | Análisis dinámico (DAST) | 0 | No cumple | 0 | No hay DAST. `npm run test:contract` (T010) solo hace `GET` de conformidad con el contrato; no es un análisis de seguridad dinámico |
| P10 | Análisis estático móvil / del binario (MobSF) | 0 | Parcial | 0,5 | T022: job `Mobile SAST` con `mobsfscan` 1.2.0 sobre `src`, `app.config.ts` y `eas.json`, decidido por `.github/scripts/mobsf.mjs` (bloquea `error`/`warning` del código de la app; 2 excepciones con vencimiento). Parcial porque **analiza el código fuente, no el APK/AAB**, y porque solo se ejecutó en local (2026-11-27); aún no hay una corrida en GitHub |
| P11 | SBOM y firma de artefactos | 0 | Parcial | 0,5 | T022: job `SBOM` genera `sbom.cdx.json` (CycloneDX 1.5, 1 057 componentes en la corrida local del 2026-11-27) y lo valida con `.github/scripts/sbom.mjs`. Parcial porque **no hay firma ni atestación** del SBOM o del binario en el pipeline (la firma de la app la hace EAS con su llave de carga, fuera del CI) y porque aún no hay una corrida en GitHub |
| P12 | CD con controles | 0 | Parcial | 0,5 | T023: `.github/workflows/release.yml` manual, con entorno `eas-build` de revisor obligatorio, `EXPO_TOKEN` solo de secretos y las mismas pruebas del CI; `release.test.mjs` lo vigila. Parcial porque está **preparado y sin activar ni ejecutar** (falta el entorno y el secreto, con autorización; `docs/devsecops.md`, «CD manual») |
| | **Subtotal pipeline** | **7 / 12** | | **8,5 / 12** | **70,8 %** |

## 3. Prácticas de la app (MASVS) — 10

| # | Práctica | Línea base (2026-11-26) | Estado (2026-11-27) | Puntos | Evidencia |
|---|---|---|---|---|---|
| A1 | Almacenamiento seguro de credenciales | 1 | Cumple | 1 | Refresh token solo en `expo-secure-store` (`src/lib/storage/secureStorage.ts`); token de acceso solo en memoria; S-01 |
| A2 | HTTPS obligatorio | 1 | Cumple | 1 | `src/lib/config.ts`: en producción `EXPO_PUBLIC_API_URL` debe empezar por `https://`; S-07; `eas.json` con `https` |
| A3 | Validación de datos de red (zod) | 1 | Cumple | 1 | Esquemas zod por funcionalidad; `invalid_response` en `lib/api` (Art. III.2, IV) |
| A4 | Sesión y renovación de tokens | 1 | Cumple | 1 | Rotación *single-flight*, restauración sin red (T014), 401 `stepUp` sin bucle (T033), cierre por inactividad y bloqueo de capturas (T015); S-02, S-04, S-14, S-15 |
| A5 | Registros sin datos personales | 1 | Cumple | 1 | `docs/seguridad.md` punto 5; reglas de `src/__arch__/rules.security.test.ts` |
| A6 | Baja de cuenta y privacidad | 1 | Cumple | 1 | `DELETE /me` con confirmación; `deleteAccount.security.test.tsx` |
| A7 | Permisos mínimos y sin copia de seguridad | 0,5 | Cumple | 1 | T012: `allowBackup: false`; `SYSTEM_ALERT_WINDOW`, `READ/WRITE_EXTERNAL_STORAGE` y `ACCESS_FINE_LOCATION` bloqueados; sin `NSLocationAlways*` ni micrófono; confirmado con `npx expo config --type introspect` (D-245); S-08, S-12g, S-12n |
| A8 | Moderación de contenido | 0,5 | Parcial | 0,5 | La app muestra el rechazo de texto en objetos, chat, perfil, calificaciones, incidencias y reportes (T018), pero el backend aún no modera estos cuatro últimos (B-2) y **no hay moderación de imágenes** (T017 bloqueada por B-1) |
| A9 | *Certificate pinning* | 0 | No cumple | 0 | No implementado. Excepción formal aprobada en `docs/calidad/seguridad-nivel.md` (Expo Go, Art. XIV.2); la excepción no suma |
| A10 | Ofuscación, anti-manipulación y detección de root | 0 | Parcial | 0,5 | R8 (minificación y ofuscación) en las compilaciones *release* (T016), probado en teléfono con el APK `preview` (D-247). Sin detección de root/jailbreak ni Play Integrity (excepción formal en `seguridad-nivel.md`, que no suma) |
| | **Subtotal app** | **7 / 10** | | **8 / 10** | **80,0 %** |

## 4. Resultado

| | Línea base (auditoría del 2026-11-26) | Esta medición (2026-11-27) |
|---|---|---|
| Pipeline | 7 / 12 = 58,3 % | 8,5 / 12 = **70,8 %** |
| App | 7 / 10 = 70,0 % | 8 / 10 = **80,0 %** |
| **Total** | 14 / 22 = **63,6 %** (la auditoría lo redondeó a «≈ 64 %») | **16,5 / 22 = 75,0 %** |

Cálculo: (1+1+1+1+1+1+0,5+1+0+0,5+0,5+0,5) + (1+1+1+1+1+1+1+0,5+0+0,5) = 8,5 + 8 = 16,5; 16,5 / 22 × 100 = 75,0 (exacto, sin redondeo).

**Respuesta a «¿qué porcentaje de seguridad DevSecOps tiene la app?»: 75,0 % con este método**, con fecha y evidencia de cada punto. No es una certificación ni la nota de la reauditoría (T029).

## 5. Qué subiría la cifra (y de qué depende)

| Práctica | Para pasar a «Cumple» | Depende de |
|---|---|---|
| P7 | Evidencia de que el ruleset está activo (captura de *Settings > Rules* o un PR con controles fallidos que GitHub no deja fusionar) | Administrador del repositorio |
| P10, P11 | Primera corrida en GitHub de `SBOM` y `Mobile SAST` en verde; para P10 completo, además analizar el APK/AAB; para P11, firmar o atestiguar el SBOM | Subir la rama (la persona); decisión de alcance |
| P12 | Crear el entorno `eas-build` y el secreto `EXPO_TOKEN`, y una primera compilación `preview` aprobada | Administrador de GitHub y de Expo, con autorización |
| P9 | Un DAST contra la API de pruebas (p. ej. ZAP en modo base) | Decisión nueva: no está en el alcance de la spec 021 |
| A8 | Moderación de texto en los cuatro campos (B-2) y de imágenes (B-1 → T017) | Backend |
| A9, A10 | Pinning, root y Play Integrity | Enmienda de la constitución (Art. XIV.2, `seguridad-nivel.md` §2, «Qué se haría con una enmienda»); decisión humana |

Esta lista no es un compromiso: describe el método. La spec 021 solo cubre lo que ya está en sus tareas.
