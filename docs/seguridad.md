# Revisión de seguridad de la app móvil (spec 012, T008)

Revisión hecha leyendo y buscando en el código del repositorio `vaiven-frontend` (rol `revisor-constitucion`). Lo que depende de staging o de un teléfono figura como **pendiente**. No se modificó ningún control para obtener un resultado en verde.

| # | Comprobación | Cómo | Resultado |
|---|---|---|---|
| 1 | Secretos en el código | Búsqueda de claves (`sk_live`, `AKIA…`, llaves privadas, `password = '…'`) en `.ts/.tsx/.js/.json`, sin pruebas | Sin hallazgos; las únicas coincidencias son etiquetas de texto «Contraseña» en `src/i18n` |
| 2 | Archivos sensibles versionados | `git ls-files` filtrando `.pem .key .p12 .jks google-services .env` | Ninguno; solo `.env.example` (plantilla sin valores reales) |
| 3 | Variables públicas | `.env.example` solo define `EXPO_PUBLIC_*` (URL, entorno, sitio legal); su encabezado prohíbe secretos | Conforme |
| 4 | Tokens solo en SecureStore | Búsqueda de `expo-secure-store`, `AsyncStorage`, `localStorage` fuera de pruebas | Solo `src/lib/storage/secureStorage.ts` usa `expo-secure-store`; `AsyncStorage` aparece únicamente en un comentario que lo prohíbe |
| 5 | Sin PII ni tokens en logs | Búsqueda de `console.*` con `token/password/email` en `src` | Sin hallazgos; el único `console.error` (`AppErrorBoundary`) registra solo el nombre del error |
| 6 | Permisos mínimos | `app.config.ts` | Cámara (QR y fotos), fotos (selector), ubicación **aproximada** (Android bloquea `ACCESS_FINE_LOCATION`), notificaciones; micrófono desactivado; cada permiso con texto en es-MX |
| 7 | Todo el tráfico por `request` | Arquitectura (Art. II): un único cliente con esquemas de zod | Conforme; el E2E valida cuerpos contra el contrato |
| 8 | Dependencias | `npm audit --audit-level=high` | Sin vulnerabilidades altas ni críticas (31: 1 baja, 30 moderadas, que el CI no bloquea). Revisar las moderadas antes de producción |
| 9 | HTTPS en producción | `EXPO_PUBLIC_APP_ENV=production` exige URL `https` (ver `.env.example`) | Conforme por configuración; **pendiente** de comprobar contra staging |
| 10 | Comprobaciones contra staging (tokens expirados, 401, cierre de sesión) | Requieren backend desplegado | **Pendiente** (T006/T012, manual) |

Resultado: sin hallazgos bloqueantes en el repositorio. La firma de la revisión (`revisor-constitucion`) queda sujeta a cerrar los puntos 9 y 10.
