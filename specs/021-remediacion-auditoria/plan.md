# Plan 021 — Remediación de la auditoría de entrega-recepción (móvil)

- **Spec:** `spec.md` · **Dueño:** MO-B (coordina) con MO-A · **Constitución:** v1.3.1

## 1. Archivos
```
memoria.md, ROADMAP.md, PUNTAJE-VERSIONES.md                 limpiar conflictos; solo anexar a memoria.md
specs/013-publicacion-google-play/tasks.md, docs/play/*.md   conciliar con memoria.md y con el manifiesto efectivo
docs/calidad/evidencia-cierres.md                            tabla de cierres con su evidencia
docs/calidad/{entornos.md, seguridad-nivel.md, seguridad-devsecops.md}
app.config.ts, package.json, eas.json, .env.example          versión y URL de API coherentes
scripts/device-tests.mjs (+ prueba)                          guarda por lista explícita de hosts
scripts/contract-check.mjs (+ prueba)                        solo lecturas contra la API configurada (opcional)
jest.config.js                                               collectCoverageFrom ampliado; umbrales intactos
src/__arch__/rules.security.test.ts                          reglas nuevas: sin marcadores de conflicto, versión coherente
src/__e2e__/contract.test.ts                                respuestas simuladas vs openapi.yaml
src/features/images/cloudinary.ts, src/features/auth/session.tsx, src/features/*/api.ts   endurecimiento (RF-12 a RF-14)
src/lib/api/moderation.ts y pantallas de perfil, calificaciones, incidencias, reportes      rechazo de moderación
.github/workflows/ci.yml, .github/workflows/release.yml      SBOM, análisis móvil y CD manual (preparado)
.github/scripts/audit.mjs                                    portable a Windows
.maestro/*.yaml                                              flujos más estrictos y nuevos
docs/calidad/dispositivo/                                    informe JUnit real
docs/calidad/contrato-endpoints.md, src/__e2e__/contract-coverage.test.ts   inventario de las 69 operaciones
src/features/notifications/, src/features/items/            push y edición de objeto: reproducir, diagnosticar y corregir (F-1, F-2)
src/features/items/components/LocationField.tsx, src/features/search/useLocation.ts   ubicación exacta, solo tras decisión (F-3)
src/features/auth/session.tsx, src/lib/api/                  tolerar 401 stepUp; MFA y sesiones cuando exista el contrato
src/features/ai-suggestions/                                 asistente, solo si T020 decide implementarlo
```

## 2. Decisiones
| # | Decisión | Art. |
|---|---|---|
| P-01 | **Primero la integridad (fase 0):** sin conflictos ni contradicciones, nada de lo demás es creíble. Una prueba estática impide que vuelvan los marcadores | I, IX |
| P-02 | **Se documenta lo que no se puede cumplir:** pinning, root y Play Integrity no existen para Expo Go (Art. XIV.2); se escribe una excepción formal con riesgo y alcance en lugar de forzar una dependencia nativa. La enmienda, si se quisiera, es decisión humana (Art. XII) | XII, XIV |
| P-03 | **Una sola fuente de versión y de URL:** una prueba compara `app.config.ts`, `package.json`, `eas.json` y `.env.example` | VIII, IX |
| P-04 | **La guarda decide por lista explícita:** el nombre «staging» no es una garantía; el host debe figurar en una lista que revisa una persona | VIII |
| P-05 | **La moderación de imágenes es del servidor:** la app solo muestra el rechazo y no sube más; no se agrega un clasificador al cliente | II |
| P-06 | **Contrato en dos niveles:** una prueba sin red valida las respuestas simuladas contra `openapi.yaml`; un script opcional solo lee (`GET`) contra la API configurada | IV |
| P-07 | **Cobertura honesta:** se amplía lo medido y no se bajan umbrales ni se excluyen archivos; si baja el porcentaje, se escriben las pruebas que faltan | IX |
| P-08 | **Dependencias de Expo solo si se aprueban:** `expo-screen-capture`, `expo-local-authentication`, `expo-build-properties`; cada una con justificación y registro en `memoria.md` | X |
| P-09 | **El CD queda preparado, no ejecutado:** `release.yml` con `workflow_dispatch` y entorno con revisor obligatorio; sin `EXPO_TOKEN` en el repositorio; se ejecuta solo con autorización | VIII, XV |
| P-10 | **La nota se mide, no se promete:** T029 repite las dos auditorías con sus prompts y registra el resultado, sea el que sea | IX |
| P-12 | **Contrato primero:** nada se implementa fuera de `openapi.yaml`; las rutas de la 019 (borrador) esperan a estar publicadas y T034 queda bloqueada hasta entonces | IV |
| P-13 | **El 401 `stepUp` se tolera antes de que el backend encienda las banderas:** T033 va primero y no depende de la 019; evita que la app expulse a la persona | IV, VIII |
| P-14 | **Administración fuera del móvil:** las 6 operaciones `/admin/*` se documentan, no se construyen (RF-29) | II |
| P-15 | **Los defectos reportados se reproducen antes de corregirse:** push (F-1) y edición de objeto (F-2) se diagnostican con el síntoma exacto y la causa escrita; cada corrección lleva una prueba que fallaba antes. La parte externa de push (FCM, credenciales en EAS) la hace T019 con autorización | VIII, IX |
| P-16 | **La ubicación exacta no cambia sin decisión:** hoy es solo aproximada por Art. VIII.4 y por S-08a/S-08b/S-12g; T038 se desbloquea cuando la persona define el alcance, y si exige enmienda se propone por escrito (Art. XII). Las reglas de seguridad se actualizan con la decisión, nunca se borran | VIII, XII |
| P-11 | **Evidencia sin datos personales:** capturas de una cuenta de demostración; nada con nombres, correos o fotos de otras personas | VIII |

### Dependencias aprobadas (T011, 2026-11-27)
Aprobadas por la persona responsable (P-08, Art. X.1). Las tres son módulos de Expo del SDK 58, funcionan en Expo Go (Art. XIV.2) y se instalaron con `npx expo install`; registro en `memoria.md` (D-244).

| Paquete | Versión | Para qué | Por qué no basta lo que ya hay |
|---|---|---|---|
| `expo-screen-capture` | ~58.0.6 | Bloquear capturas y grabación de pantalla en las pantallas sensibles (T015, RF-14) | React Native no expone `FLAG_SECURE` ni el aviso de captura de iOS |
| `expo-local-authentication` | ~58.0.3 | Biometría **opcional** para volver a entrar tras el cierre por inactividad (T015, RF-14) | No hay otra API de huella/rostro; no guarda nada: solo confirma presencia |
| `expo-build-properties` | ~58.0.12 | Activar R8 (minificación y ofuscación) en la compilación nativa (T016, RF-15) | Solo es un *config plugin* de compilación; no entra en el JS de la app |

## 3. Pruebas
Las nuevas reglas estáticas y de coherencia son Jest sobre texto en memoria (con casos negativos). El contrato usa `installFakeApi` y el `openapi.yaml` de solo lectura. El endurecimiento de `app.config.ts` se prueba con la configuración resuelta y se confirma con `npx expo config --type introspect`. La moderación y el endurecimiento de la subida tienen pruebas de pantalla y de cliente. El CI y el CD se prueban con sus scripts (`node --test`); el CD no se ejecuta. La suite de dispositivo se verifica en un teléfono real (T026).

## 4. Verificación de constitución
| Art. | Cumple |
|---|---|
| I | Spec, plan y tareas antes de cualquier cambio |
| II | La moderación y los contratos viven en el backend; la app solo los muestra |
| IV | El contrato se lee, no se modifica |
| VIII | Sin secretos ni datos personales; guarda por lista explícita; backup desactivado |
| IX | Typecheck, lint y `npm test` en verde; umbrales de cobertura intactos |
| X | Dependencias nuevas solo con justificación y registro |
| XII | La excepción de pinning/root no cambia la constitución; la enmienda queda como propuesta humana |
| XIV | Solo módulos compatibles con Expo Go; última tarea de verificación en teléfono |
| XV | Sin commits, push ni PR desde la sesión; el CD no se ejecuta sin autorización |
