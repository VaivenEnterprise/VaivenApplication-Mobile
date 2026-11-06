# AGENTS.md — App móvil VAIVÉN (React Native + Expo)

Instrucciones para cualquier agente de OpenCode que trabaje en `vaiven-frontend/`. Este archivo se carga automáticamente. **Subordinado a `constitution.md`.**

## 1. Orden de lectura obligatorio

1. `constitution.md` — reglas no negociables (artículos I a XIII). Para saber qué spec te toca, quién es el dueño y en qué orden, lee `ROADMAP.md`.
2. `memoria.md` — decisiones, estado actual y aprendizajes.
3. `specs/<spec-activa>/spec.md` → `plan.md` → `tasks.md`.
4. Solo entonces, el código.

Si algo no está definido en esos archivos, **no lo inventes**: pregunta a la persona o anótalo como `[NEEDS CLARIFICATION]` en la spec.

## 2. Proyecto en una línea

App móvil (Expo + TypeScript + Expo Router) de VAIVÉN, plataforma de préstamo y renta de objetos en México (MXN). Solo consume la API REST del backend (`../vaiven-backend`, Go + MongoDB).

## 3. Flujo SDD (cómo trabajar)

| Fase | Quién | Resultado |
|---|---|---|
| Especificar | `plan` + subagente `spec-writer` | `spec.md` (qué y por qué, sin tecnología) |
| Planificar | `plan` + `spec-writer` | `plan.md` (cómo) |
| Dividir | `plan` + `spec-writer` | `tasks.md` (tareas pequeñas) |
| Implementar | `build` + `dev-expo` | código + pruebas, **una tarea por vez** |
| Probar | `qa-mobile` | pruebas y cobertura |
| Revisar | `revisor-constitucion` | informe de conformidad |

Detalle en la skill `sdd-workflow`.

## 4. Agentes disponibles

Agentes nativos de OpenCode (se reutilizan tal cual):

| Agente | Modo | Uso en este proyecto |
|---|---|---|
| `plan` | primario | Especificar, planificar y dividir tareas. Solo lectura de código. |
| `build` | primario | Implementar tareas aprobadas. |
| `explore` | subagente | Buscar en el código sin modificarlo. |
| `general` | subagente | Investigación de varios pasos. |

Subagentes propios (`.opencode/agents/`):

| Agente | Responsabilidad | Edita código |
|---|---|---|
| `spec-writer` | Redacta `spec.md`, `plan.md`, `tasks.md` y actualiza `memoria.md` | No (solo `specs/` y `memoria.md`) |
| `dev-expo` | Implementa tareas en TypeScript/Expo siguiendo la constitución | Sí |
| `gestor-repo` | Crea ramas, commits y PR en GitHub por MCP; único agente con permiso para el MCP de GitHub; nunca fusiona ni borra | No |
| `probador-expo` | Verifica cada spec en Expo Go contra staging con el MCP de Expo; único agente con permiso para el MCP | No (solo `memoria.md` y evidencia) |
| `qa-mobile` | Escribe y ejecuta pruebas Jest/RNTL, mide cobertura | Solo `*.test.ts(x)` |
| `revisor-constitucion` | Verifica conformidad con la constitución | No |

Invocación: `@dev-expo implementa la tarea T006 de specs/002-arquitectura-base/tasks.md`.

## 5. Skills disponibles (`.opencode/skills/`)

| Skill | Cuándo cargarla |
|---|---|
| `sdd-workflow` | Al crear o ejecutar spec, plan o tareas |
| `expo-router-structure` | Al crear rutas, layouts, pantallas o carpetas de `features/` |
| `react-query-api-client` | Al tocar el cliente de API, errores, consultas o mutaciones |
| `rn-testing` | Al escribir o corregir pruebas |
| `expo-go-verification` | Al cerrar una spec: verificación en Expo Go (solo `probador-expo`) |

## 5b. MCP y verificación (Art. XIV)

- El MCP `expo` (remoto, OAuth) está en `opencode.json`; se autentica con `opencode mcp auth expo`. **Trabajo humano mínimo:** registrarse en Expo, autenticar el MCP, instalar Expo Go y aprobar acciones; el resto lo hace `probador-expo` desde OpenCode. **Solo `probador-expo` lo usa.**
- No hay servidor que desplegar: cada spec se prueba en Expo Go contra staging. La app **sí se compila** con EAS Build (APK `preview` y AAB `production`) en la spec 013, y los comandos `eas build` se ejecutan con aprobación humana. Cada spec termina con su tarea «Verificación en Expo Go» (`@probador-expo`), que exige la spec de backend equivalente ya desplegada. No empieces la siguiente spec hasta que pase.

## 6. Comandos

```bash
npm install            # instala dependencias
npx expo start         # servidor de desarrollo (Expo Go / emulador)
npm run typecheck      # tsc --noEmit
npm run lint           # eslint
npm run format         # prettier --write .
npm test               # jest --coverage
```

La app necesita el backend en marcha. En emulador Android, `localhost` del equipo es `http://10.0.2.2:8080`; en un dispositivo físico, la IP local del equipo.

## 7. Reglas de oro

1. **Una tarea a la vez.** Termina y verifica antes de pasar a la siguiente.
2. **Toca solo los archivos listados** en la tarea. Si necesitas otro, avisa y justifica.
3. **Sin dependencias nuevas** sin registrarlas en `plan.md` y `memoria.md`. Instala con `npx expo install <paquete>` para módulos de Expo.
4. **Nunca** escribas texto visible literal en componentes (va en `src/i18n/es-MX.ts`) ni colores/espaciados literales (van en `src/theme/`).
5. **Nunca** uses `any`, `@ts-ignore`, `AsyncStorage` para tokens, ni pongas secretos en `EXPO_PUBLIC_*`.
6. **Nunca** conectes la app directamente a MongoDB; todo pasa por `lib/api`.
7. **Nunca** modifiques `constitution.md`; propón la enmienda por escrito.
8. Al terminar una tarea: ejecuta `npm run typecheck && npm run lint && npm test`, marca `[x]` en `tasks.md` y actualiza `memoria.md` si aprendiste algo.
9. Si un comando falla dos veces con el mismo error, **detente** y explica el problema en lugar de probar variaciones al azar.
10. Responde en español; el código y los identificadores, en inglés.

## 8. Trabajo en paralelo (4 personas, Art. XIII)

- Trabaja **solo en la spec asignada** a tu persona en `ROADMAP.md` y solo si su contrato (`../vaiven-backend/api/paths/<modulo>.yaml`) ya está publicado y la spec de backend equivalente está **desplegada**.
- No edites `src/app/_layout.tsx` ni `src/app/(tabs)/_layout.tsx` (los crea la spec 003). Agrega archivos solo dentro de tu carpeta de ruta y de tu feature.
- Textos en `src/i18n/<funcionalidad>.ts` (una línea de reexport en `es-MX.ts`); claves de consulta en `features/<f>/keys.ts`.
- Reutiliza `components/ui/`; no dupliques componentes.
- `memoria.md` es solo-anexar: escribe al final de tu sección con tu etiqueta (`[MO-A]` o `[MO-B]`).

## 9. Alcance

Specs `001` a `015` en `specs/`, en el orden y con los dueños de `ROADMAP.md`. Las tareas aún **no se ejecutan** hasta la fecha de arranque del calendario y la aprobación de cada spec.

## Repositorio y PR (Art. XV)
- Una rama de integracion por spec (`spec/SCRUM-NN-SPEC-NN`), creada desde `develop`: implementar sus tareas ahi o en ramas `tipo/SCRUM-NN-SPEC-NN-TNNN` con PR hacia la misma SPEC. Al completar la spec, PR hacia `develop`; publicar con PR `develop` -> `main`. Se conserva tarea -> `develop`. Titulos de PR libres; completar Resumen, Validación y Seguridad. Solo `@gestor-repo` usa el MCP de GitHub; nunca fusiona ni borra: una persona revisa y fusiona. Nunca se suben secretos.

