# Revisión de seguridad de la app móvil (spec 012, T008)

Revisión hecha leyendo y buscando en el código del repositorio `vaiven-frontend` (rol `revisor-constitucion`). Lo que depende de staging o de un teléfono figura como **pendiente**. No se modificó ningún control para obtener un resultado en verde.

| # | Comprobación | Cómo | Resultado |
|---|---|---|---|
| 1 | Secretos en el código | Búsqueda de claves (`sk_live`, `AKIA…`, llaves privadas, `password = '…'`) en `.ts/.tsx/.js/.json`, sin pruebas | Sin hallazgos; las únicas coincidencias son etiquetas de texto «Contraseña» en `src/i18n` |
| 2 | Archivos sensibles versionados | `git ls-files` filtrando `.pem .key .p12 .jks google-services .env` | Ninguno; solo `.env.example` (plantilla sin valores reales) |
| 3 | Variables públicas | `.env.example` solo define `EXPO_PUBLIC_*` (URL, entorno, sitio legal); su encabezado prohíbe secretos | Conforme |
| 4 | Secretos de sesión solo en SecureStore | Búsqueda de `expo-secure-store`, `AsyncStorage`, `localStorage` fuera de pruebas | Solo `src/lib/storage/secureStorage.ts` usa `expo-secure-store`, y solo guarda el **refresh token** (`vaiven.refreshToken`); el access token vive únicamente en memoria (`authInterceptor.ts`). `AsyncStorage` aparece únicamente en un comentario que lo prohíbe |
| 5 | Sin PII ni tokens en logs | Búsqueda de `console.*` con `token/password/email` en `src` | Sin hallazgos; el único `console.error` (`AppErrorBoundary`) registra solo el nombre del error |
| 6 | Permisos mínimos | `app.config.ts` | Cámara (QR y fotos), fotos (selector), ubicación **aproximada** (Android bloquea `ACCESS_FINE_LOCATION`), notificaciones; micrófono desactivado; cada permiso con texto en es-MX |
| 7 | Todo el tráfico por `request` | Arquitectura (Art. II): un único cliente con esquemas de zod | Conforme; el E2E valida cuerpos contra el contrato |
| 8 | Dependencias | `npm audit --json` (vía `node .github/scripts/audit.mjs`, que bloquea high/critical) | **2026-11-27 (spec 021, T021):** 27 avisos, todos **moderados** (0 bajos, 0 altos, 0 críticos), de dos GHSA: `GHSA-3g3m-2fjr-6pw4` (`glob`) y `GHSA-g3hv-75wg-m249` (`minimatch`); llegan por `@expo/fingerprint` (dentro de `expo`), Jest, `jest-expo` y `typescript-eslint` (herramientas de compilación, lint y pruebas que no procesan entrada de usuarios). El CI no bloquea moderados. La excepción `GHSA-fc5q-39xc-vjpf` (`picomatch`) se **retiró**: `npm audit` ya no la reporta y `.github/audit-exceptions.json` queda vacío. Revisar las moderadas antes de producción |
| 9 | HTTPS en producción | `EXPO_PUBLIC_APP_ENV=production` exige URL `https` (ver `.env.example`) | Conforme por configuración; **pendiente** de comprobar contra staging |
| 10 | Comprobaciones contra staging (tokens expirados, 401, cierre de sesión) | Requieren backend desplegado | **Pendiente** (T006/T012, manual) |

Resultado: sin hallazgos bloqueantes en el repositorio. La firma de la revisión (`revisor-constitucion`) queda sujeta a cerrar los puntos 9 y 10.

## Decisiones de diseño que la revisión no trata como hallazgo

- **Cierre de sesión (S-03).** `signOut` da de baja el token de push, borra la sesión local (tokens y caché de consultas) y **después** llama a `POST /auth/logout` con el refresh token; si esa llamada falla, el error se ignora a propósito (`session.tsx`, `auth/api.ts`). Motivo: la persona debe quedar fuera del dispositivo aunque no haya red o el servidor falle; un cierre que dependiera de la respuesta del servidor dejaría la sesión abierta justo cuando no se puede confirmar. Riesgo aceptado: si el servidor no recibe la llamada, el refresh token no se revoca en el servidor hasta que éste lo venza; el dispositivo ya no lo conserva y el access token vence solo. La prueba `session.security.test.tsx` (S-03) fija este comportamiento. Si se quisiera revocar siempre, haría falta una cola de reintento, que esta spec no incluye (spec 021, B-7).
