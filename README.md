# VAIVÉN — App móvil — Spec Driven Development con OpenCode

Plataforma móvil de préstamo y renta de objetos entre personas (México, MXN).
Contexto completo: [`docs/VAIVEN_Idea_y_Objetivo.pdf`](docs/VAIVEN_Idea_y_Objetivo.pdf). Calendario, reparto entre personas y políticas confirmadas: [`ROADMAP.md`](ROADMAP.md).

**Stack:** React Native + Expo + TypeScript

Este repositorio es **independiente**. Forma parte de VAIVÉN junto con [`vaiven-backend`](../vaiven-backend) (API) y [`vaiven-landing-page`](../vaiven-landing-page) (sitio informativo). Se asume que los tres repositorios están clonados lado a lado, porque algunos documentos del SDD apuntan al repositorio hermano con rutas `../vaiven-*`.

## Qué contiene

| Archivo / carpeta | Para qué sirve |
|---|---|
| `constitution.md` | Reglas técnicas no negociables. Máxima autoridad. |
| `AGENTS.md` | Instrucciones que OpenCode carga siempre: orden de lectura, flujo, agentes, comandos, reglas. |
| `memoria.md` | Decisiones, estado, modelos asignados, dependencias y aprendizajes. |
| `opencode.json` | Modelos gratuitos por agente, instrucciones cargadas y permisos. |
| `.opencode/agents/` y `.opencode/skills/` | Subagentes propios y skills con plantillas y listas de comprobación. |
| `specs/001…015/` | `spec.md`, `plan.md` y `tasks.md` de cada fase (**servicios por MCP**, arquitectura base, cuenta, imágenes, objetos, búsqueda, reservas, chat, entrega y pagos, calificaciones, notificaciones, integración, publicación en Google Play, IA y ML). Cada una termina con «Verificación en Expo Go». |
| `ROADMAP.md`, `docs/` | Copia del plan maestro y del documento de idea del proyecto. |

Solo consume la API del backend; el contrato oficial es `../vaiven-backend/api/openapi.yaml`.

## Flujo: OpenCode + MCP + Expo Go, spec por spec

1. La app **no se despliega**: se prueba en local con **Expo Go** contra el staging del backend (`EXPO_PUBLIC_API_URL`). La publicación en Google Play (spec 013) queda aparte, pendiente de revisión.
2. MCP de Expo: `opencode mcp auth expo`. Solo `@probador-expo` lo usa.
3. Spec **001**: servicios (MCP de Expo, URL de staging). Desde la **002**: se implementa con `@dev-expo`; la última tarea de cada spec es «Verificación en Expo Go» y exige la spec equivalente del backend ya desplegada. **La spec siguiente no empieza hasta que pase.**
4. Límite conocido: las notificaciones push remotas pueden no funcionar en Expo Go (Android).
5. Repositorio, ramas, revisión y pipeline: **no están definidos**; se integrarán de cero.

## Cómo se usa con OpenCode

```bash
opencode          # desde la raíz de este repositorio
```
1. Ejecuta `opencode models` y confirma que los modelos de `opencode.json` existen (los gratuitos rotan); si cambias alguno, anótalo en `memoria.md`.
2. Agente `plan`: revisa y ajusta `spec.md`, `plan.md` y `tasks.md`.
3. Con la spec aprobada por una persona, cambia al agente `build` y pide @dev-expo la tarea que toque.
4. Al cerrar una fase, pide `@revisor-constitucion revisa los cambios`.

## Coherencia entre repositorios

- Los Artículos **IV** (contrato de API) y **V** (dinero, fechas, idioma) deben mantenerse idénticos en las constituciones de backend y móvil. Si cambias uno, cámbialo en ambos repositorios y registra la decisión en ambos `memoria.md`.
- `ROADMAP.md` y `docs/VAIVEN_Idea_y_Objetivo.pdf` son copias en cada repositorio; si se actualiza una, hay que actualizar las demás.

## Estado

Todavía no hay código ni se han ejecutado tareas: están definidos los archivos de gobierno, el SDD por spec y la configuración de OpenCode con MCP. El repositorio y el pipeline se integrarán de cero.
