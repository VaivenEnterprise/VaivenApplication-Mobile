# Spec 001 — Servicios y entorno local con MCP de Expo (móvil)

- **Dueño:** MO-B · **Prioridad:** P3 (opcional) · **Depende de:** —
- **Constitución:** v1.2.0 (Art. XIV) · **Estado:** **OPCIONAL, diferida (9 nov 2026)**; no bloquea a ninguna spec

> **Decisión del 9 nov 2026:** por ahora la app corre **solo en local** (Expo Go contra el backend local; sin staging ni producción) y el equipo ya trabaja con Claude, así que **no se configura el MCP de Expo**. Esta spec queda **opcional**: ninguna otra spec depende de ella. Se omiten RF-01, RF-05 y las tareas T001 y T004. Siguen siendo útiles, sin bloquear: RF-02 (Expo Go en un teléfono), RF-03 (registrar el SDK en `memoria.md`) y RF-04 / T003 (`docs/entorno-local.md`). Se retoma si algún día hay staging o se quiere el MCP.

## 1. Objetivo y por qué
Dejar listo el entorno para desarrollar y **probar la app en local con Expo Go**, y conectar OpenCode con el **MCP de Expo**. La app no se compila ni se despliega en las specs de funcionalidad: cada spec se verifica en Expo Go contra el backend de staging.

## 2. Historias
| # | Prio. | Historia |
|---|---|---|
| H-01 | P0 | Como persona del equipo, quiero abrir la app en Expo Go en mi teléfono con un comando, para probar mi trabajo sin compilar. |
| H-02 | P0 | Como persona del equipo, quiero que la app apunte al backend de staging (VM de Azure, `https://<host>:8443`) o al local, para trabajar sin cambiar código. |
| H-03 | P1 | Como persona del equipo, quiero que OpenCode use el MCP de Expo para consultar documentación y tomar capturas de la app en ejecución, para dejar evidencia de cada spec. |

## 3. Requisitos
| ID | Requisito |
|---|---|
| RF-01 | El MCP `expo` (remoto, `https://mcp.expo.dev/mcp`, autenticación OAuth con la cuenta de Expo de cada persona) está declarado en `opencode.json` y conecta tras autenticarse. |
| RF-02 | Cada persona tiene cuenta de Expo y la app **Expo Go** instalada en un teléfono (al menos 2 teléfonos Android en el equipo); un emulador Android es opcional. |
| RF-03 | Se registra en `memoria.md` el SDK de Expo elegido, que debe ser el vigente y, como mínimo, el **54** (requisito de las capacidades locales de `expo-mcp`). |
| RF-04 | `docs/entorno-local.md` explica: arrancar con `npx expo start`; la URL del backend por plataforma (emulador Android `10.0.2.2`, simulador iOS `localhost`, teléfono físico: IP local o la URL HTTPS de staging); `EXPO_UNSTABLE_MCP_SERVER=1` y cómo reconectar el MCP al iniciar o detener el servidor de desarrollo; y las limitaciones de Expo Go (las notificaciones push remotas pueden no funcionar en Android). |
| RF-05 | Solo el agente `probador-expo` usa el MCP; los demás agentes lo tienen denegado. |
| RNF-01 | Ningún secreto en el repositorio. |

## 4. Criterios de aceptación
| ID | Dado / Cuando / Entonces |
|---|---|
| CA-01 | Dada la cuenta de Expo, cuando ejecuto `opencode mcp auth expo` y luego `opencode mcp list`, entonces `expo` aparece conectado. |
| CA-02 | Dado el agente `dev-expo`, cuando intenta una herramienta MCP, entonces se rechaza; con `probador-expo` funciona. |
| CA-03 | Dado `docs/entorno-local.md`, cuando una persona ajena al proyecto lo sigue, entonces entiende cómo arrancar y qué URL usar (se comprueba en 002-T029). |

## 5. Fuera de alcance
Compilar con EAS, `expo-dev-client`, perfiles de `eas.json`, instalar APK y publicar (salvo la spec 013, pendiente de revisión).

## 6. Preguntas abiertas
- [NEEDS CLARIFICATION: ¿Cuenta de Expo compartida o una por persona? Provisional: una por persona; el MCP usa la de quien está trabajando.]
- [NEEDS CLARIFICATION: la herramienta `search_documentation` del MCP de Expo exige un plan de pago de EAS; si no hay plan, se consulta la documentación pública.]
- Esta versión se publica **solo en Google Play (Android)**; iOS queda fuera por costo.
