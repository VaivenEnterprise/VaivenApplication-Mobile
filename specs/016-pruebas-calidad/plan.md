# Plan 016 — Pruebas de calidad y auditoría de evaluación (móvil)

- **Spec:** `spec.md` · **Dueño:** MO-B (coordina) con MO-A · **Constitución:** v1.3.1

## 1. Archivos
```
scripts/test-report.mjs, scripts/test-report.test.mjs        conteo por tipo con jest --json (Node sin dependencias)
scripts/screens-report.mjs, scripts/screens-report.test.mjs  rutas y pantallas × endpoints × pruebas (solo lectura)
scripts/device-tests.ps1, scripts/device-tests.mjs           suite en dispositivo (PowerShell y terminal del IDE)
package.json                                                 solo scripts: test:report, test:security, test:device
jest.config.js                                               proyectos o patrones por tipo (sin tocar umbrales ni exclusiones)
src/**/*.security.test.ts(x)                                 suite de seguridad S-01 a S-13
src/__arch__/rules.security.test.ts                          reglas estáticas S-12 (lee el código, no lo ejecuta)
src/**/*.integration.test.tsx                                flujos que falten (incidencias, perfil, inicio, proyecto)
src/**/*.test.tsx                                            unitarias de pantallas sin prueba propia
src/__a11y__/a11y.test.tsx                                   accesibilidad automatizada de pantallas clave
.maestro/{00-registro,01-login,02-explorar,03-solicitud,04-sesion-persiste,05-logout,06-baja}.yaml
docs/calidad/{pantallas.md, pruebas.md, dispositivo.md, dispositivo/}
memoria.md (solo anexar) · ROADMAP.md (una fila)
```

## 2. Decisiones
| # | Decisión | Art. |
|---|---|---|
| P-01 | **Medir antes de cerrar:** T001 y T002 no cambian la app; producen el conteo y la matriz que ordenan las demás tareas | I |
| P-02 | **Las categorías se distinguen por nombre de archivo**, no por carpeta, para no mover pruebas existentes (RNF-02). `jest.config.js` solo agrega la ejecución por patrón; los umbrales de cobertura y las exclusiones no cambian | IX |
| P-03 | **Maestro como herramienta de dispositivo** (propuesta, §6 de la spec): es una CLI externa, no entra al `package.json` ni al binario de la app; se instala en la máquina de quien ejecuta (con su autorización) y se registra en `memoria.md` con su versión. Sin Maestro, el script falla con instrucciones (CA-08) | X |
| P-04 | **Los scripts son Node sin dependencias**, con pruebas propias (`node --test`), como los de `.github/scripts/`; solo leen el repositorio y escriben en `docs/calidad/` | X |
| P-05 | **Seguridad con pruebas nombradas por ID:** cada `it` lleva `S-NN` y su categoría OWASP en el nombre, para que `trace` y el informe los encuentren; las pruebas existentes se reutilizan como evidencia sin moverlas | IX |
| P-06 | **Reglas estáticas dentro de Jest** (`S-12`): una prueba lee los archivos de `src/` y aplica las reglas; sus casos negativos usan texto en memoria, nunca archivos prohibidos en el repositorio | VIII |
| P-07 | **Cuenta de prueba efímera:** el flujo `00-registro` crea una cuenta con correo único tomado de `E2E_EMAIL` y el flujo `06-baja` la elimina; las credenciales solo existen como variables de entorno. Nunca contra producción: el script muestra la URL activa y se niega si es la de producción | VIII |
| P-08 | **Honestidad de resultados:** el informe copia lo que imprimen los comandos; una categoría que no corrió dice «no ejecutado» | IX |

## 3. Pruebas
Los scripts tienen pruebas con repositorios de ejemplo pequeños (conteo por tipo, cruce de pantallas y endpoints, mensajes de error sin dispositivo). La suite de seguridad, las de integración y las de accesibilidad son Jest con la API simulada (`installFakeApi`). La suite de dispositivo es la prueba en sí; su resultado real lo aporta una persona con el teléfono conectado.

## 4. Verificación de constitución
| Art. | Cumple |
|---|---|
| I | Spec, plan y tareas antes de cualquier prueba nueva |
| VI | Pruebas junto a lo que prueban; sin lógica nueva en `src/` |
| VIII | Sin secretos ni datos personales; cuenta de prueba efímera; nunca producción |
| IX | Typecheck, lint y `npm test` en verde; cobertura mínima intacta |
| X | Sin dependencias de la app; Maestro es externa y se registra en `memoria.md` |
| XI | Herramientas gratuitas; el modelo de OpenCode no cambia |
| XIII | Carpeta `docs/calidad/` propia; solo se anexa a `memoria.md` |
| XIV | Expo Go contra staging; el APK solo como alternativa; última tarea de verificación |
