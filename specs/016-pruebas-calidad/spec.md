# Spec 016 — Pruebas de calidad y auditoría de evaluación (móvil)

- **Dueño:** MO-B (coordina) con MO-A (pruebas de sus specs) · **Prioridad:** P0 para la entrega · **Ventana:** 26 nov–1 dic · **Depende de:** 001–015 y 017 (las prueba); backend 016 (staging con datos de demostración)
- **Constitución:** v1.3.1 · **Estado:** Borrador (pendiente de aprobación humana, Art. I y XI.5)
- **Antecedente:** el documento «Auditoría de evaluación v2» (18 nov 2026, materia Desarrollo Móvil Integral) pide, para la app móvil, el número de pruebas **unitarias, de seguridad y de integración**, las pantallas con endpoints que no las tienen, **otras pruebas** y una **suite automatizada que se ejecute en un dispositivo físico** conectado a la computadora desde PowerShell o la terminal del IDE. Esta spec convierte esas peticiones en pruebas reales y en un informe con números ejecutados. Es la contraparte móvil de `../vaiven-backend/specs/016-auditoria-calidad` (su §5 prevé auditar el móvil con la misma plantilla).

## 1. Objetivo y por qué
La app tiene hoy 132 suites y 1 751 pruebas en verde con 99,65 % de cobertura (corrida local del 2026-11-25), pero **no se pueden contar por tipo**: no existe la categoría «seguridad», la integración no se distingue de lo demás, hay pantallas con endpoints cubiertas solo de rebote (o sin prueba) y **no hay ninguna prueba que corra en un teléfono real**. Antes de la entrega oficial (1–4 dic) hace falta medir con una misma vara, cerrar las brechas y demostrarlo con resultados que se ejecutaron. Esta spec no agrega funcionalidad a la app: agrega pruebas, scripts y documentación de calidad.

## 2. Historias
| # | Prio. | Historia |
|---|---|---|
| H-01 | P0 | Como equipo, quiero saber cuántas pruebas unitarias, de seguridad y de integración tiene la app, con un comando que lo calcule y no con una cuenta a mano. |
| H-02 | P0 | Como persona que audita, quiero ver qué pantallas con endpoints no tienen cada tipo de prueba y qué prueba falta. |
| H-03 | P0 | Como equipo, quiero una suite de seguridad que demuestre los controles de la app (sesión, tokens, cierre de sesión, baja de cuenta, privacidad, validación de entradas) frente al OWASP Mobile Top 10. |
| H-04 | P0 | Como persona que audita, quiero ejecutar con un solo comando, desde PowerShell, una suite automatizada en un Android físico conectado por USB. |
| H-05 | P1 | Como equipo, quiero un informe de pruebas con fecha, comando y resultado real de cada categoría. |

## 3. Requisitos

### A. Medir (sin cambiar la app)
| ID | Requisito |
|---|---|
| RF-01 | **Convención y conteo por tipo.** Las pruebas se clasifican por nombre de archivo: **unitarias** (`*.test.ts(x)` que no sean de otro tipo), **de integración** (`*.integration.test.tsx`, `*.wiring.test.tsx`, `flow.test.tsx` y `src/__e2e__/`: varias capas reales —pantalla, hooks, cliente de API— con la API simulada) y **de seguridad** (`*.security.test.ts(x)`, nueva). Un script sin dependencias (`scripts/test-report.mjs`, `npm run test:report`) ejecuta Jest con `--json` y cuenta **suites y casos por tipo**, con los resultados reales (pasaron, fallaron, omitidas) y la cobertura. Si una suite no se puede ejecutar, el script falla; nunca reporta lo que no corrió. |
| RF-02 | **Matriz de pantallas** (`docs/calidad/pantallas.md`): por cada ruta de `src/app/` y cada pantalla de `src/features/*/screens/`, los **endpoints que consume** (cruzando `features/*/api.ts` con `../vaiven-backend/api/paths/*.yaml`), y para cada tipo (unitaria, seguridad, integración) la prueba que la cubre (archivo y nombre) o «**sin prueba**» con la prueba que faltó. Línea base del 2026-11-25: 27 rutas y 26 pantallas; `RestoringScreen` y `SuspendedScreen` sin ninguna prueba; `HomeScreen`, las tres de incidencias y `EditItemScreen` cubiertas solo por archivos compartidos (`home.test.tsx`, `screens.test.tsx`, `ItemFormScreen.test.tsx`); incidencias, perfil, proyecto e inicio sin prueba de integración propia. |

### B. Cerrar brechas
| ID | Requisito |
|---|---|
| RF-03 | **Unitarias.** Toda pantalla y todo *hook* de `features/*` con consumo de endpoints tiene al menos una prueba unitaria propia (estados de carga, vacío y error, Art. VII.4), empezando por las que la matriz marque «sin prueba». Se conserva el 80 % mínimo de cobertura de `lib/` y de `features/*/hooks` (Art. IX.1). |
| RF-04 | **Seguridad** (`*.security.test.ts(x)`, `npm run test:security`). Cada control de la tabla §3.1 tiene al menos una prueba, nombrada con su ID (`S-NN`) y su categoría del OWASP Mobile Top 10 (2024). Las pruebas de seguridad que ya existen en otros archivos se **conservan** y se listan en el informe como «otras pruebas con aserciones de seguridad»; no se mueven ni se debilitan. |
| RF-05 | **Integración.** Cada flujo de pantallas con consumo de endpoints tiene una prueba de integración con la API simulada (tabla §3.2). Se agregan los que falten según la matriz. |
| RF-06 | **Otras pruebas.** (a) **Accesibilidad automatizada:** en las pantallas clave, todo botón o control sin texto tiene `accessibilityLabel` y área táctil de al menos 44 pt (Art. VII.3); (b) se conservan y se listan el recorrido de punta a punta de Jest (012), el contraste de los *tokens* y la verificación manual en Expo Go de cada spec. |

### C. Dispositivo físico
| ID | Requisito |
|---|---|
| RF-07 | **Suite en dispositivo** (`.maestro/*.yaml`): flujos automatizados de la app en un Android físico conectado por USB (`adb`), contra staging: registro con cuenta de prueba, inicio de sesión, Explorar con búsqueda y detalle, solicitud de un objeto, **sesión que persiste al cerrar y volver a abrir la app sin cerrar sesión**, cierre de sesión y baja de la cuenta de prueba. Las credenciales llegan por variables de entorno (`E2E_EMAIL`, `E2E_PASSWORD`), nunca en el repositorio. |
| RF-08 | **Ejecución con un comando** (`scripts/device-tests.ps1` para PowerShell y `npm run test:device` para la terminal del IDE): comprueba que hay un dispositivo (`adb devices`), que la herramienta está instalada y a qué API apunta la app, ejecuta los flujos y guarda un informe JUnit en `docs/calidad/dispositivo/`. Sin dispositivo o sin herramienta, **falla con un mensaje claro** y no escribe resultados. Nunca contra producción. |

### D. Informar
| ID | Requisito |
|---|---|
| RF-09 | **Informe de pruebas** (`docs/calidad/pruebas.md`): para unitarias, seguridad, integración, accesibilidad, punta a punta (Jest), dispositivo y Expo Go manual, qué se prueba, dónde, cómo se ejecuta y el último resultado real (número de suites y casos, cobertura, fecha y comando). Incluye la tabla de correspondencia con las preguntas de la auditoría (§3.3). Lo que no se ejecutó dice «no ejecutado». |
| RNF-01 | Sin funcionalidad nueva ni cambios en `src/` más allá de lo que pidan las pruebas (p. ej. `testID`); sin dependencias nuevas de la app (Art. X). Los scripts son Node sin paquetes; la herramienta de dispositivo es externa (plan P-03). |
| RNF-02 | Herramientas gratuitas (Art. XI.1). Ninguna prueba se debilita, se omite ni se borra para obtener verde. |
| RNF-03 | Sin secretos ni datos personales en el repositorio, en los flujos ni en los informes (Art. VIII). La cuenta de prueba se crea y se elimina en la propia corrida. |

### 3.1 Controles de la suite de seguridad (RF-04)
| ID | Control que se prueba | OWASP Mobile Top 10 (2024) |
|---|---|---|
| S-01 | Los tokens solo viajan a `expo-secure-store`: se guardan, se leen y se borran ahí; nunca en `AsyncStorage` ni `localStorage` | M9 · M1 |
| S-02 | `Authorization` solo se envía con sesión y nunca en rutas de autenticación; ante un 401 se renueva una vez y se reintenta una vez; si la renovación falla, se cierra la sesión | M3 |
| S-03 | **Cierre de sesión por endpoint:** `POST /auth/logout`; borra tokens y caché de consultas, da de baja el token de notificaciones y deja a la persona sin sesión aunque el servidor falle | M3 · M9 |
| S-04 | **La sesión persiste** al cerrar y volver a abrir la app sin cerrar sesión: con tokens guardados se restaura sin pedir credenciales y sin llamar a logout | M3 |
| S-05 | **Baja de cuenta:** exige contraseña, un 403 (contraseña incorrecta) y un 409 (reservas activas) se muestran sin cerrar la sesión; al éxito se borra todo lo local | M3 · M6 |
| S-06 | Sin datos personales ni tokens en la consola en login, errores de red, respuesta inválida y *error boundary* | M6 · M9 |
| S-07 | HTTPS obligatorio fuera de desarrollo: una URL `http` se rechaza en configuración de producción | M5 |
| S-08 | Ubicación **aproximada**: la app no pide ubicación precisa (`app.config.ts`), redondea la posición que envía y no muestra la exacta | M6 |
| S-09 | Validación de entradas: los esquemas rechazan lo inválido antes de enviar y un `validation_failed` del servidor se muestra por campo sin romper la pantalla | M4 |
| S-10 | **Texto inapropiado:** una respuesta de moderación del servidor (spec 011) se muestra con salida y no deja el contenido publicado | M4 |
| S-11 | **Imágenes:** solo tipos permitidos y tamaño máximo; se redimensionan (lado mayor ≤ 1 600 px) antes de subir; un rechazo por contenido del servidor se muestra sin subir nada más | M4 |
| S-12 | Reglas estáticas sobre `src/`: sin `any` ni `@ts-ignore` sin justificar, sin `AsyncStorage`, sin `console.*` con datos, sin claves en `EXPO_PUBLIC_*`, sin `fetch` fuera de `lib/api`, sin archivos sensibles versionados; permisos de `app.config.ts` iguales a la lista declarada | M2 · M8 |
| S-13 | Notificaciones: el token se registra solo con sesión y permiso concedido, se da de baja al cerrar sesión, y un aviso solo abre rutas conocidas | M3 · M4 |

### 3.2 Flujos con prueba de integración (RF-05)
Autenticación (registro, inicio, restauración, suspensión) · publicar, editar y pausar objetos · búsqueda y Explorar · solicitud y reserva · chat · entrega y devolución con QR · calificaciones · **incidencias** · notificaciones · **perfil (editar y eliminar cuenta)** · **inicio** · **proyecto guiado** · reportes y moderación · sugerencias con IA (014) · recomendaciones (015). En negrita, los que hoy no tienen prueba de integración propia.

### 3.3 Correspondencia con la auditoría (sección «Móvil» y sección 3)
| Pregunta o petición de la auditoría | Dónde se responde |
|---|---|
| ¿Se implementaron pruebas unitarias? ¿Cuántas resultaron? | RF-01 y RF-09 (conteo del script) |
| ¿Se implementaron pruebas de seguridad? ¿Cuántas resultaron? | RF-04 y RF-09 |
| ¿Se implementaron pruebas de integración? ¿Cuántas resultaron? | RF-05 y RF-09 |
| ¿En qué pantallas con consumo de endpoints no se implementaron pruebas…? Flujos y qué prueba faltó | RF-02 (`pantallas.md`) |
| ¿Qué otras pruebas se realizaron? | RF-06, RF-07 y RF-09 |
| ¿Se valida la carga de imágenes / el texto inapropiado? | S-10 y S-11 |
| ¿Hay módulo para eliminar la cuenta? ¿Persiste la sesión? ¿El logout consume un endpoint? | S-05, S-04 y S-03 |
| ¿Push? ¿En qué flujo? | S-13 y el flujo de notificaciones (§3.2) |
| ¿Cumple OWASP Mobile Top 10? | Columna OWASP de §3.1 (cobertura por categoría; no es una certificación) |
| §3: suite automatizada con dispositivo físico desde PowerShell o terminal del IDE | RF-07 y RF-08 |

## 4. Criterios de aceptación
| ID | Dado / Cuando / Entonces |
|---|---|
| CA-01 | Dado `npm run test:report`, entonces imprime y guarda el número de suites y casos **unitarios, de seguridad y de integración** realmente ejecutados, y falla si una suite no se puede ejecutar. |
| CA-02 | Dada la matriz de pantallas, entonces cada ruta y pantalla con endpoints lista sus endpoints y sus pruebas, y no queda ninguna «sin prueba» sin justificar. |
| CA-03 | Dado `npm run test:security`, entonces ejecuta solo la suite de seguridad, pasa, y cada control `S-01` a `S-13` tiene al menos una prueba nombrada con su ID. |
| CA-04 | Dado código que usa `AsyncStorage`, registra un token en consola, trae un `any` sin justificar o pone una clave en `EXPO_PUBLIC_*`, entonces la prueba estática `S-12` falla con el archivo y la regla (probado con casos negativos en memoria). |
| CA-05 | Dado cada flujo de §3.2, entonces existe su prueba de integración y pasa. |
| CA-06 | Dadas las pantallas clave, entonces todo control sin texto tiene etiqueta accesible y área táctil de al menos 44 pt. |
| CA-07 | Dado un Android físico por USB, la API de staging y las variables `E2E_*`, entonces `scripts/device-tests.ps1` (o `npm run test:device`) ejecuta los flujos, termina en verde y guarda el informe JUnit. |
| CA-08 | Dado un equipo sin dispositivo o sin la herramienta, entonces el script falla con un mensaje claro y no escribe ningún resultado como ejecutado. |
| CA-09 | Dado `docs/calidad/pruebas.md`, entonces cada resultado trae fecha y comando, lo no ejecutado dice «no ejecutado» y la tabla §3.3 apunta a evidencia real. |

## 5. Fuera de alcance
Funcionalidad nueva de la app; cambios a la constitución; pruebas de penetración activas; pruebas contra producción; el resto de las preguntas de la auditoría que no son pruebas (porcentaje de seguridad DevSecOps, MCP, número de agentes y de *skills*, permisos, funciones de ML e IA generativa, CI/CD): se responden aparte con la 017 y con las specs 014 y 015; iOS (Expo Go y Android son el alcance, Art. XIV); regresión visual; pruebas de carga.

## 6. Preguntas abiertas
- [NEEDS CLARIFICATION: herramienta de automatización en dispositivo. Propuesta: **Maestro** (CLI externa gratuita, flujos YAML, funciona por `adb` con Expo Go o con el APK `preview`, sin dependencias npm ni compilación nativa extra). Alternativas (Detox, Appium) piden una compilación de desarrollo o un servidor adicional y chocan con el Art. XIV.1 y el Art. X. Confirmar antes de la T008.]
- [NEEDS CLARIFICATION: modo por defecto de la suite: Expo Go contra staging (propuesta, Art. XIV.1) o el APK `preview` (hoy apunta a **producción**, según 014-T007, y no debe usarse para crear cuentas de prueba).]
- Pendiente del backend 016 (T012): datos de demostración en staging para los flujos de búsqueda, asistente y recomendaciones.
