# Puntaje de cambios por versión — Vaivén (app móvil)

**Versión actual:** 1.1.2 · **Fecha:** 2026-11-25 · **Alcance:** toda la app móvil (este repositorio).

> **Esto es una estimación**, no una medición. Los puntos son de esfuerzo relativo (estilo _story points_), calculados a partir del número de tareas de cada spec en `specs/*/tasks.md` y de su complejidad. Sirven para comparar el tamaño de cada cambio y ver cuánto pesó cada versión, no para medir horas.

## Escala

| Puntos | Significado |
|---|---|
| 1 | Cambio trivial (texto, ajuste de configuración) |
| 2–3 | Tarea pequeña o mediana, una pantalla o un módulo |
| 5 | Tarea grande: varias pantallas o un flujo completo con pruebas |
| 8 | Muy grande: varias capas (UI, API, seguridad, pruebas) |
| 13+ | Spec completa de tamaño medio |
| 21–34 | Spec completa grande o de base (arquitectura) |

## Cómo se llega a la 1.1.2

| Versión | Qué agrega | Puntos de la versión | Acumulado |
|---|---|---|---|
| **1.0.0** | Núcleo completo (specs 001–013): cuenta, objetos, búsqueda, solicitudes, chat, entrega y pagos, calificaciones, notificaciones, publicación | 217 | 217 |
| **1.1.0** | IA para sugerir título y categoría (014) y recomendaciones con ML (015) | 34 | 251 |
| 1.1.1 | Pruebas de calidad y auditoría (016) y DevSecOps (017) | 46 | 297 |
| **1.1.2** | Corrección de la URL de la API (`:8443`) y reconstrucción para Play; cierre documental de la 013 | 4 | **301** |

Las versiones 0.x de la prueba cerrada (p. ej. 0.2.0) son construcciones intermedias de la 1.0.0 y no suman aparte.

## Detalle por cambio

### Hacia la 1.0.0

| Spec | Cambio | Tareas | Puntos |
|---|---|---|---|
| 001 | Servicios e infraestructura (lado móvil: Expo Go y configuración) | 5 | 3 |
| 002 | Arquitectura base: Expo Router, TanStack Query, cliente de API, i18n, tema | 30 | 34 |
| 003 | Cuenta y autenticación: registro, login, sesión, perfil, baja | 14 | 21 |
| 004 | Imágenes: selector, redimensión y subida con firma | 10 | 13 |
| 005 | Objetos: publicar, editar, pausar, precio sugerido | 13 | 18 |
| 006 | Búsqueda: texto, categoría, zona, modalidad, fechas | 11 | 13 |
| 007 | Solicitudes y reservas: cotización, aceptar, rechazar, cancelar | 15 | 21 |
| 008 | Chat privado por reserva | 11 | 13 |
| 009 | Entrega, devolución y pagos: evidencia, QR, confirmaciones | 13 | 21 |
| 010 | Calificaciones e incidencias | 14 | 16 |
| 011 | Notificaciones y moderación | 13 | 18 |
| 012 | Integración y endurecimiento, AAB final | 12 | 13 |
| 013 | Publicación en Google Play (ficha, cumplimiento, prueba cerrada). **Pendiente de cierre** | 11 | 13 |
| | **Subtotal 1.0.0** | | **217** |

### Hacia la 1.1.0

| Spec | Cambio | Tareas | Puntos |
|---|---|---|---|
| 014 | IA: sugerir título y categoría desde una foto, siempre revisable por quien publica (`AI_ENABLED`) | 7 | 13 |
| 015 | Recomendaciones «Recomendado para ti» con ML (`RECO_ENABLED`) | 8 | 21 |
| | **Subtotal 1.1.0** | | **34** |

### Hacia la 1.1.1

| Spec | Cambio | Puntos |
|---|---|---|
| 016-T001 | Conteo de pruebas por tipo (`scripts/test-report.mjs`) | 3 |
| 016-T002 | Matriz de pantallas × endpoints × pruebas | 3 |
| 016-T003 | Pruebas unitarias de `RestoringScreen` y `SuspendedScreen` | 3 |
| 016-T004 | Suite de seguridad S-01…S-13 (OWASP Mobile): 10 suites, 94 pruebas | 8 |
| 016-T005 | Reglas estáticas de seguridad (S-12) | 5 |
| 016-T006 | Integración del perfil (editar, baja, errores) | 3 |
| 016-T007 | Accesibilidad automatizada en 6 pantallas clave | 3 |
| 016-T008 | Suite y scripts de dispositivo (Maestro, `device-tests`) | 5 |
| 017 | DevSecOps (8 tareas) | 13 |
| — | Cambio de versión a 1.1.1 en `app.config.ts` | 1 |
| | **Subtotal 1.1.1** | **46** |

### Hacia la 1.1.2

| Cambio | Puntos |
|---|---|
| `eas.json`: URL de la API con el puerto `:8443` en `preview` y `production` | 2 |
| Cambio de versión a 1.1.2 en `app.config.ts` | 1 |
| Spec 013: actualización de `tasks.md` y `seguimiento.md` (T002 y T007 cerradas) | 1 |
| **Subtotal 1.1.2** | **4** |

## Puntos aún sin cerrar (no suman a la 1.1.1)

| Pendiente | Puntos |
|---|---|
| 016-T009 Ejecución en dispositivo físico | 5 |
| 016-T010 Informe de pruebas y veredicto | 3 |
| 016-T011 Verificación final | 2 |
| 013 Cierre de la publicación en Play (solicitud de producción y respuesta de Google) | ya contado arriba como parcial |
| **Total pendiente de la 016** | **10** |

## Totales

- **Puntos hasta la 1.1.2: 301** (297 hasta la 1.1.1)
- De ellos, **del código de la app** que cambia usuarios: 1.0.0 + 1.1.0 = 251.
- **Calidad y seguridad** (1.1.1, sin funciones nuevas para la persona usuaria): 46.

## Cómo actualizar este archivo

Al cerrar una tarea: sumar sus puntos a la versión que la incluya y mover la fila de «sin cerrar» a la tabla de su versión. Al subir de versión, añadir una fila a «Cómo se llega a la 1.1.1» (renombrando el título) con su acumulado.
