# Plan 001 — Servicios y entorno local con MCP de Expo (móvil)

- **Spec:** `spec.md` · **Dueño:** MO-B

## 1. Archivos
```
opencode.json                          # bloque "mcp" con `expo` y permisos (ya declarado)
.opencode/agents/probador-expo.md      # único agente con permiso para el MCP
.opencode/skills/expo-go-verification/SKILL.md   # procedimiento de verificación en Expo Go
docs/entorno-local.md
```

## 2. Decisiones
| # | Decisión | Art. |
|---|---|---|
| P-01 | MCP `expo` remoto con OAuth (sin API key en el repositorio); `opencode mcp auth expo` lo autentica | XIV |
| P-02 | Capacidades locales: paquete `expo-mcp` y `EXPO_UNSTABLE_MCP_SERVER=1` al arrancar el servidor de desarrollo; una sola conexión de servidor de desarrollo a la vez; reconectar el MCP al iniciar o detener `expo start` | XIV |
| P-03 | Sin EAS ni `expo-dev-client`: solo módulos que corran en Expo Go | XIV.1 |
| P-04 | La URL del backend entra por `EXPO_PUBLIC_API_URL` (variable pública, sin secretos) | VI |

## 3. Pruebas
No hay código. Verificación por criterios CA-01…CA-03; CA-03 se cierra en 002-T029.

## 4. Verificación de constitución
| Art. | Cumple |
|---|---|
| VI | Sin secretos; OAuth en lugar de claves |
| XI | Todo por OpenCode y modelos gratuitos |
| XIV | MCP solo en `opencode.json`, solo `probador-expo`; pruebas locales con Expo Go |
