# Informe de pruebas — spec 016 (borrador de T010)

**Fecha:** 2026-11-25 · **Estado:** BORRADOR. No es el veredicto de CA-09: faltan el conteo real por tipo (`npm run test:report`), la ejecución en dispositivo (T009) y la revisión de `revisor-constitucion`.

Regla de este informe: cada línea dice qué se ejecutó, con qué comando y qué resultó. Lo que no se ejecutó dice **no ejecutado**.

## 1. Conteo por tipo

- **Línea base** de la persona (corrida local del 2026-11-25, antes de esta spec): 132 suites, 1 751 pruebas, cobertura 99,65 %.
- **Añadido por la 016** (corridas parciales en el entorno de desarrollo del asistente, no una corrida completa):

| Tipo | Suites nuevas | Pruebas nuevas | Comando |
|---|---|---|---|
| Seguridad | 10 | 94 | `npm run test:security` (pasó) |
| Unitarias | 2 | 6 | `jest RestoringScreen SuspendedScreen` (pasó) |
| Integración | 1 | 5 | `jest profile.integration` (pasó) |
| Accesibilidad | 1 | 8 | `jest src/__a11y__` (pasó, por casos con `-t`) |
| Scripts (Node) | 3 | 22 | `npm run test:scripts` (22 pasan, 0 fallan) |

- **Conteo real por tipo y cobertura total: no ejecutado.** Hay que correr en Windows `npm run test:report`; escribe `docs/calidad/conteo.json` y copia aquí el resultado.

## 2. Pantallas × endpoints × pruebas

`docs/calidad/pantallas.md` (generado con `node scripts/screens-report.mjs --out docs/calidad/pantallas.md`) y `docs/calidad/pantallas-notas.md` (notas manuales). Resultado: todas las pantallas con endpoints tienen prueba unitaria; integración falta solo en `RegisterScreen` (cubierta por `session.integration`); todos los endpoints existen en `vaiven-backend/api/openapi.yaml`.

## 3. Seguridad (OWASP Mobile Top 10)

| Control | Qué se comprueba | Prueba |
|---|---|---|
| S-01 | Token solo en almacenamiento seguro | `secureStorage.security.test.ts` |
| S-02, S-06 | Cabecera de autorización y errores sin datos sensibles | `client.security.test.ts`, `session.security.test.tsx` |
| S-03, S-04 | Sesión: cierre, expiración y 401 | `session.security.test.tsx` |
| S-05 | Baja de cuenta pide contraseña | `deleteAccount.security.test.tsx` |
| S-07 | HTTPS fuera de desarrollo | `config.security.test.ts` |
| S-08, S-12 | Reglas estáticas (sin `AsyncStorage`, sin `any`, sin `console` fuera del límite de errores, permisos, `.gitignore`) | `src/__arch__/rules.security.test.ts` (con casos negativos en memoria) |
| S-09 | Validación de entradas | `schemas.security.test.ts` |
| S-10 | Moderación | `moderation.security.test.ts` |
| S-11 | Subida de imágenes | `upload.security.test.ts` |
| S-13 | Rutas de notificaciones permitidas y limpieza al salir; el registro del token lo cubren `usePushRegistration.test.tsx` y `NotificationsBootstrap.test.tsx` | `push.security.test.ts` + existentes |

## 4. Integración y accesibilidad

- Perfil (editar nombre, teléfono inválido, contraseña incorrecta 403, baja pendiente 409, baja correcta): `profile.integration.test.tsx`.
- Accesibilidad en 6 pantallas clave: nombre accesible y tamaño táctil declarado ≥ 44 pt. **Límite:** los controles que toman su tamaño del contenido no se miden.

## 5. Dispositivo físico

Preparado (`docs/calidad/dispositivo.md`); guardas verificadas con ejecución real (sin `adb`, `expo-go` sin enlace y API de producción terminan con código 2 sin escribir resultados). **Flujos Maestro: no ejecutados** (sin teléfono ni Maestro). Maestro no está instalado; instalarlo requiere autorización.

## 6. Correspondencia con la auditoría (spec §3.3)

Pendiente de cerrar al tener el conteo real y la corrida en dispositivo (T009, T010).

## 7. Verificación general

- `npx tsc --noEmit`: limpio. `eslint` y `prettier --check`: limpios en las carpetas tocadas.
- `npm test` completo: **no ejecutado** (no cabe en el entorno del asistente).
