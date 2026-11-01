---
name: expo-go-verification
description: Procedimiento para verificar una spec de la app móvil en Expo Go contra el backend de staging usando el MCP de Expo (tarea final «Verificación en Expo Go»). Úsala al cerrar cada spec móvil.
---

# Skill: verificación en Expo Go (móvil)

## Requisitos previos
- `opencode mcp list` muestra `expo` conectado (si no: `opencode mcp auth expo`).
- La spec de backend equivalente está desplegada y `curl <staging>/readyz` devuelve 200 (reintenta hasta 90 s por el arranque en frío).
- `.env` local con `EXPO_PUBLIC_API_URL=<URL de staging>` (sin secretos).
- Un teléfono con Expo Go en la misma red, o un emulador.

## Pasos
1. `npm run typecheck && npm run lint && npm test` en verde.
2. `EXPO_UNSTABLE_MCP_SERVER=1 npx expo start`. Reconecta el MCP `expo` cada vez que inicies o detengas el servidor (solo admite un servidor de desarrollo a la vez).
3. Abre la app en Expo Go (escanea el QR).
4. Por cada criterio CA-xx de la `spec.md`: ejecuta el recorrido en la app, comprueba el resultado esperado y toma una captura con el MCP. Nombre: `docs/evidencia/<NNN>/CA-xx.png`.
5. Revisa estados de carga, vacío, error y reintento de las pantallas de la spec.
6. Anota en `memoria.md` (solo anexar) el resultado por criterio y lo «no verificable» en Expo Go.
7. La spec queda **cerrada** solo si todos los criterios verificables pasaron.

## Límites conocidos de Expo Go
- Las notificaciones push remotas pueden no funcionar en Android.
- Las capacidades locales del MCP exigen SDK 54 o superior, el paquete `expo-mcp` y `EXPO_UNSTABLE_MCP_SERVER=1`; iOS solo en simulador de macOS.
- La herramienta de búsqueda de documentación del MCP exige un plan de pago de EAS.
