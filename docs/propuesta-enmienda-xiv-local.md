# Propuesta de enmienda — Art. XIV (MCP opcional y verificación local)

- **Fecha:** 2026-11-09 · **Tipo:** PATCH (relaja un requisito de proceso; no cambia el stack ni los principios de calidad)
- **Estado:** propuesta, pendiente de aprobación humana. No se modificó `constitution.md`.

## Motivo
Por ahora la app corre solo en local y el equipo ya trabaja con Claude. El MCP de Expo y el agente `probador-expo` no se usarán. El Art. XIV.1 ya permite probar «contra el backend de staging (o uno local)»; lo que choca son los puntos 3, 4 y 7.

## Cambios propuestos
| Punto | Hoy | Propuesto |
|---|---|---|
| XIV.3 | Los MCP `expo` y `expo-mcp` se declaran en `opencode.json`; solo `probador-expo` los usa | Su uso es **opcional**. Si se usan, se declaran únicamente en `opencode.json` y solo `probador-expo` los usa |
| XIV.4 | Cada spec termina con «Verificación en Expo Go» hecha por `probador-expo` contra staging | Cada spec termina con «Verificación en Expo Go» hecha **a mano o con Claude**, contra el backend local o contra staging si existe; la evidencia (capturas o notas) se anota en `memoria.md` |
| XIV.7 | La persona se registra en Expo y autentica el MCP | La persona instala Expo Go y aprueba las acciones; la cuenta de Expo y el MCP son opcionales |

## Efecto
Ninguno en el código ni en las specs de funcionalidad. Las tareas de verificación ya dicen «MCP opcional» (decisión D-132 de `memoria.md`). Al aprobarse: versión 1.3.1 y registro en `memoria.md`.
