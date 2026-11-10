# Constitución de la App Móvil — VAIVÉN

> **Versión 1.3.1** · Ratificada el 2026-10-26 · Enmendada el 2026-10-28 (Cloudinary para imágenes; dependencias previstas; Art. XIII trabajo en paralelo) y el 2026-11-01 (repositorios separados; **MINOR:** se elimina todo lo de repositorio y pipeline, se agrega el Art. XIV de MCP y pruebas locales con Expo Go) y el 2026-11-02 (**PATCH:** aclara que la app sí se compila —APK y AAB con EAS Build— y se publica en Google Play; solo no hay servidor que desplegar) · Proyecto: `vaiven-frontend/` (React Native + Expo + TypeScript)
>
> **Enmienda 1.3.1 (2026-11-10, PATCH, aprobada por la persona dueña de la spec 002 del móvil):** el Art. IV agrega `invalid_response` a los códigos propios del cliente (respuesta que no cumple el esquema esperado; RF-07 y CA-06 de la spec 002) y el Art. III.3 permite además las clases de error `ApiError` y `ConfigError`. Registro D-135 en `memoria.md`; la misma aclaración del Art. IV se aplica en la constitución del backend (2.0.1).
>
> **Enmienda 1.3.0 (2026-11-02, MINOR):** se agrega el Art. XV (repositorio y pull requests en GitHub, con MCP de GitHub); se reemplaza la declaración de «sin repositorio».
>
> Esta es la máxima autoridad técnica de la app móvil. Si `AGENTS.md`, `memoria.md`, `spec.md`, `plan.md`, `tasks.md`, un agente o una skill la contradicen, **gana la constitución** y el otro archivo debe corregirse.
> Comparte con `../vaiven-backend/constitution.md` el contrato de API (Art. IV de ambas) y las reglas de dinero, fechas e idioma (Art. V de ambas). Deben mantenerse idénticas en esos puntos.

---

## 1. Propósito y alcance

VAIVÉN es una plataforma móvil de préstamo y renta de objetos entre personas, que opera en México y expresa todos los importes en pesos mexicanos (MXN). Contexto completo en `docs/VAIVEN_Idea_y_Objetivo.pdf`.

La app móvil es el cliente de la plataforma. **Solo habla con la API del backend** (que persiste en MongoDB); nunca accede a la base de datos.

**Alcance de esta constitución:** arquitectura, reglas técnicas y forma de trabajo. **No** define funcionalidad de negocio (pantallas de objetos, solicitudes, chat, QR, etc.); eso se especifica en specs posteriores (`specs/002-*` en adelante) sin contradecir lo aquí escrito.

---

## 2. Principios no negociables

### Art. I — Spec primero (Spec Driven Development)
1. Ningún código se escribe sin una `spec.md` aprobada, un `plan.md` y un `tasks.md` de la misma carpeta `specs/NNN-nombre/`.
2. El orden es siempre: **constitución → spec → plan → tasks → implementación → revisión**.
3. Si durante la implementación se descubre que la spec es incorrecta, se **corrige la spec primero** y luego el código.
4. Cada tarea cambia un conjunto pequeño y verificable de archivos y se marca como hecha solo si cumple sus criterios de aceptación.

### Art. II — El backend es la única fuente de verdad
1. Los datos se obtienen y modifican **solo** mediante la API REST del backend (`/api/v1`). Prohibido conectarse a MongoDB o a cualquier base desde la app.
2. La app puede guardar localmente solo cosas efímeras o de preferencia (caché de consultas, sesión en almacenamiento seguro). No hay lógica de negocio crítica del lado del cliente: el servidor decide y valida.
3. La URL base de la API proviene de configuración de entorno, nunca de una constante en el código.
4. **Imágenes (enmienda 1.1.0):** la app pide una firma al backend y sube el archivo **directamente a Cloudinary**; después envía al backend solo la referencia (`publicId`, ancho, alto, formato, bytes, `delivery`). Antes de subir, las fotos se redimensionan (lado mayor ≤ 1600 px) y se comprimen (JPEG, calidad ≈ 0.8). La app nunca conoce el `API secret`.

### Art. III — TypeScript estricto
1. `strict: true` en `tsconfig.json`. Prohibido `any` implícito y, salvo justificación escrita, `any` explícito y `@ts-ignore`.
2. Los datos que llegan de la red se tratan como desconocidos y se validan/convierten antes de usarse (`zod`).
3. Componentes de función con *hooks*; sin clases salvo el *error boundary* y las clases de error (`ApiError`, `ConfigError`).

### Art. IV — Contrato de API estable y compartido con el backend
1. API REST JSON bajo `/api/v1`. Campos en `camelCase`; fechas ISO-8601 UTC; identificadores como cadenas.
2. Los errores del servidor llegan siempre con este formato único, y la app los normaliza en **un solo lugar** (`lib/api`):
   ```json
   { "error": { "code": "validation_failed", "message": "texto legible en español",
                "details": [{ "field": "email", "issue": "formato inválido" }],
                "requestId": "01J..." } }
   ```
   Códigos del servidor: `validation_failed`, `unauthorized`, `forbidden`, `not_found`, `conflict`, `rate_limited`, `internal_error`, `service_unavailable`.
   Códigos propios del cliente: `network_error` (sin conexión), `timeout` e `invalid_response` (la respuesta no cumple el esquema esperado).
3. Listas paginadas por cursor: `{ "items": [...], "nextCursor": "..." | null }`.
4. La app envía `X-Request-Id` (≤ 64 caracteres alfanuméricos y guiones) para correlacionar con los logs del servidor.
5. El contrato oficial es `../vaiven-backend/api/openapi.yaml`. Un cambio incompatible exige nueva versión de ruta, nunca una adaptación silenciosa en la app.

### Art. V — Dinero, fechas e idioma
1. Moneda única: **MXN**. Los importes viajan y se guardan como **enteros en centavos** (`…Cents`). Prohibido usar `number` con decimales para operar dinero; la conversión a texto ocurre solo al mostrar (`formatMXN`).
2. Fechas en **UTC** en la red; se muestran en la zona horaria del dispositivo con `Intl` (`es-MX`).
   - **Excepción (v1.1.0):** los periodos de reserva (`startDate`, `endDate`) son **fechas de calendario** `YYYY-MM-DD` (zona `America/Mexico_City`). Se manejan como cadenas con utilidades puras; no se convierten con `new Date()` ni a la zona del teléfono.
3. Todo texto visible está en **español (es-MX)** y centralizado en `src/i18n/es-MX.ts`. Prohibido texto visible literal dentro de componentes. Identificadores de código en inglés.
4. VAIVÉN **no ejecuta cobros ni verifica pagos**: la app nunca debe sugerir que un pago fue procesado o verificado automáticamente.

### Art. VI — Arquitectura por funcionalidades con Expo Router
1. Navegación con **Expo Router** (rutas por archivos en `src/app/`). Las pantallas son delgadas: componen componentes y *hooks*, sin lógica de datos.
2. El código de negocio vive por funcionalidad en `src/features/<nombre>/` (`api/`, `hooks/`, `components/`, `types.ts`). Una funcionalidad no importa de otra; lo compartido va a `components/`, `lib/` o `theme/`.
3. Dependencias permitidas: `app → features → components/lib/theme`. Nunca hacia arriba.
4. Alias de importación `@/` → `src/`. Prohibidas las rutas relativas que suban más de dos niveles (`../../../`).

### Art. VII — Sistema de diseño centralizado
1. Colores, espaciados, tipografías, radios y sombras **solo** existen como *tokens* en `src/theme/`. Prohibidos valores de diseño literales (`'#0F7B6C'`, `16`) dentro de componentes y pantallas.
2. Toda pantalla se construye con los componentes base de `src/components/ui/` (`Screen`, `AppText`, `Button`, `LoadingState`, `ErrorState`, …). Un componente nuevo solo se crea si ninguno existente sirve, y se agrega a esa carpeta.
3. Accesibilidad mínima: `accessibilityLabel` en controles sin texto, áreas táctiles de al menos 44×44 puntos y contraste legible.
4. Toda pantalla con datos remotos contempla sus tres estados: **cargando, error y vacío**.

### Art. VIII — Seguridad y privacidad por defecto
1. Tokens y credenciales solo en `expo-secure-store`; nunca en `AsyncStorage`, en el código ni en variables `EXPO_PUBLIC_*`.
2. Las variables `EXPO_PUBLIC_*` son **públicas** (viajan dentro de la app): jamás contienen secretos.
3. No se registran en consola datos personales, tokens ni cuerpos completos de respuesta.
4. Permisos del dispositivo (cámara, ubicación, notificaciones) solo cuando una spec los exija, con el mínimo alcance y un texto de justificación en español. La ubicación exacta no se muestra en listados públicos.
5. Comunicación solo por HTTPS fuera de desarrollo.

### Art. IX — Pruebas y calidad
1. Toda tarea con lógica incluye pruebas (Jest + `jest-expo` + React Native Testing Library). Mínimo **80 %** de cobertura en `lib/` y `features/*/hooks`.
2. `npm run typecheck`, `npm run lint` y `npm test` deben pasar sin errores antes de dar una tarea por hecha.
3. Las pruebas se ejecutan **en local**. El repositorio y las PR siguen el Art. XV; no hay pipeline automatizado.

### Art. X — Simplicidad y dependencias mínimas
1. Se prefieren los módulos de Expo (`expo-*`) y la API de React Native sobre bibliotecas de terceros. Una dependencia nueva exige justificación en `plan.md` y registro en `memoria.md`.
2. Prohibido construir abstracciones "por si acaso": solo lo que una spec vigente necesita.
3. Estado: datos del servidor con **TanStack Query**; estado local con `useState`/`useReducer`; la sesión con un contexto de React; un almacén global (p. ej. Zustand) solo si una spec lo justifica.
4. **Dependencias previstas** (ya aprobadas, se registran en `memoria.md` al instalarse): `react-hook-form` y `@hookform/resolvers` (formularios); `expo-image-picker`, `expo-image-manipulator`, `expo-image` (fotos); `expo-location` (zona aproximada); `@react-native-community/datetimepicker` (fechas); `expo-camera` (escaneo QR); `react-native-qrcode-svg` y `react-native-svg` (generar QR); `expo-notifications` y `expo-device` (push); `expo-linking` (enlaces profundos). Se instalan con `npx expo install`.

### Art. XI — Desarrollo asistido con OpenCode y modelos gratuitos
1. Este proyecto se desarrolla **100 % con OpenCode** y **modelos gratuitos**, apoyado en **servidores MCP** (Art. XIV). Ninguna herramienta o modelo de pago es requisito.
2. Los modelos se asignan en `opencode.json` (un solo lugar). Los identificadores gratuitos rotan: al cambiarlos se registra en `memoria.md`.
3. Como los modelos gratuitos tienen menos capacidad, **las tareas se escriben pequeñas y explícitas**: archivos exactos, criterios de aceptación verificables y contexto mínimo.
4. Los agentes operan con **permisos mínimos** (ver `.opencode/agents/`). Un agente nunca ejecuta comandos destructivos ni modifica `constitution.md` sin aprobación humana.
5. Una persona revisa y aprueba cada spec, plan y conjunto de tareas antes de implementar.

### Art. XII — Gobernanza y enmiendas
1. Cambiar la constitución requiere: propuesta escrita, registro en `memoria.md` (sección *Decisiones*), incremento de versión y revisión de coherencia de todos los archivos (incluida la constitución del backend si toca un artículo compartido).
2. Versionado: **MAJOR** cambia o elimina un principio; **MINOR** agrega un principio o sección; **PATCH** aclara redacción.

### Art. XIII — Trabajo en paralelo (4 personas, cada una con su OpenCode)
1. Cada spec tiene **una persona dueña** (ver `ROADMAP.md`). Solo el dueño edita el `tasks.md` y el código de su spec; si necesita tocar algo de otra persona, lo avisa antes.
2. **Contrato primero:** la app se desarrolla contra `../vaiven-backend/api/paths/<modulo>.yaml`. Mientras el backend no esté listo, la persona usa datos simulados en pruebas, nunca endpoints inventados.
3. **Concha de navegación:** `src/app/_layout.tsx` y `src/app/(tabs)/_layout.tsx` los crea la spec 003 con todas las pestañas definidas (Explorar, Mis objetos, Actividad, Mensajes, Perfil). Las demás specs solo agregan archivos dentro de su propia carpeta de ruta.
4. **Textos por funcionalidad:** `src/i18n/<funcionalidad>.ts` por spec, reexportado en `src/i18n/es-MX.ts` con **una línea**. Igual con las claves de consulta (`features/<f>/keys.ts`).
5. **Componentes compartidos:** un componente nuevo de `components/ui/` solo lo crea el dueño de la spec que lo necesita primero y lo avisa; las demás lo reutilizan sin copiarlo.
6. **`memoria.md` es solo-anexar:** cada persona agrega líneas al final de su sección con su etiqueta (`[MO-A]`, `[MO-B]`); ante un conflicto se conservan ambas.

### Art. XIV — MCP y pruebas locales con Expo Go (enmienda 1.2.0)
1. La app se prueba **en local con Expo Go** (`npx expo start`) contra el backend de staging (o uno local). No hay servidor ni hosting que desplegar. **Sí se compila la app** con **EAS Build** para entregarla: un **APK** (perfil `preview`, para instalar directo en teléfonos de prueba y demostración) y un **AAB** (perfil `production`, para Google Play). Esas compilaciones y la publicación son de la spec 013; las specs de funcionalidad (002–012) no compilan: cada una se cierra con su verificación en Expo Go. No se usa `expo-dev-client`.
2. Por eso solo se usan módulos que funcionen en Expo Go. Las notificaciones push remotas pueden no funcionar en Expo Go en Android: lo que no pueda probarse ahí se anota en `memoria.md` y no bloquea el cierre de la spec.
3. Los MCP se declaran **únicamente en `opencode.json`**: `expo` (remoto, autenticación OAuth: documentación y datos de EAS) y las capacidades locales de `expo-mcp` (capturas, DevTools; requieren SDK 54 o superior y `EXPO_UNSTABLE_MCP_SERVER=1`). Ningún secreto en el repositorio. Solo el agente `probador-expo` los usa.
4. **Cada spec termina verificada.** La última tarea de cada spec es «Verificación en Expo Go»: con la spec de backend equivalente ya **desplegada** (backend Art. XIII), `probador-expo` arranca la app en Expo Go contra staging, recorre los criterios de aceptación de la spec, guarda la evidencia (capturas) y lo anota en `memoria.md`. No se empieza la siguiente spec hasta que esa verificación pase.
7. **Trabajo humano mínimo:** la persona solo se registra (cuenta de Expo), autentica el MCP (`opencode mcp auth expo`), instala Expo Go en su teléfono y aprueba las acciones (incluidas las compilaciones con EAS y la subida a Play Console, que sube el administrador). Arrancar la app, recorrer los criterios de aceptación, tomar capturas y registrar el resultado lo hace `probador-expo` desde OpenCode con el MCP de Expo.

---

## 3. Stack tecnológico fijo

| Área | Decisión |
|---|---|
| Plataforma | React Native con Expo (SDK estable vigente al crear el proyecto; versión fijada en `memoria.md`) |
| Lenguaje | TypeScript (`strict`) |
| Navegación | Expo Router (`src/app/`) |
| Datos remotos | `@tanstack/react-query` v5 + cliente `fetch` propio |
| Validación | `zod` |
| Almacenamiento seguro | `expo-secure-store` |
| Formularios | `react-hook-form` + `zod` |
| Imágenes | `expo-image-picker`, `expo-image-manipulator`, `expo-image`; subida directa a Cloudinary con firma del backend |
| QR | `expo-camera` (escanear), `react-native-qrcode-svg` (generar) |
| Notificaciones | `expo-notifications` (push de Expo) |
| Estilos | `StyleSheet` de React Native + *tokens* en `src/theme/` |
| Pruebas | Jest + `jest-expo` + `@testing-library/react-native` |
| Calidad | ESLint (`eslint-config-expo`) + Prettier + `tsc --noEmit` |
| Gestor de paquetes | `npm` |
| Pruebas en dispositivo | **Expo Go**, en local (`npx expo start`); sin compilación ni despliegue (Art. XIV) |
| MCP | `expo` (remoto) y capacidades locales `expo-mcp`, declarados en `opencode.json` |
| Backend | API REST de `../vaiven-backend` (Go + MongoDB) |

## 4. Estructura del repositorio

```
vaiven-frontend/              # raíz del repositorio
├─ src/
│  ├─ app/                    # rutas Expo Router (pantallas delgadas)
│  ├─ components/ui/          # componentes base reutilizables
│  ├─ features/<nombre>/      # api/ hooks/ components/ types.ts
│  ├─ lib/                    # config, api, query, storage, format
│  ├─ theme/                  # tokens de diseño
│  ├─ i18n/es-MX.ts           # textos visibles
│  └─ providers/              # proveedores globales (Query, etc.)
├─ specs/NNN-nombre/{spec.md, plan.md, tasks.md}
├─ .opencode/{agents, skills}
├─ constitution.md · AGENTS.md · memoria.md · opencode.json
└─ app.config.ts · package.json · tsconfig.json · .env.example
```

## 5. Convenciones de código

- Componentes y tipos en `PascalCase`; funciones y variables en `camelCase`; archivos de componentes `PascalCase.tsx`, el resto `kebab-case.ts` o `camelCase.ts` de forma consistente por carpeta.
- Una exportación principal por archivo de componente; *props* tipadas con `type`.
- Sin lógica de red dentro de componentes: se usa un *hook* de `features/<nombre>/hooks`.
- `useEffect` solo para sincronizar con el exterior; si se puede calcular durante el render, se calcula.
- Comentarios en español, concisos y solo donde el porqué no sea evidente.

## 6. Convenciones de datos del lado cliente

1. Los tipos de respuesta se definen como esquemas `zod` en `features/<nombre>/types.ts` y el tipo TypeScript se deriva (`z.infer`).
2. Claves de consulta de TanStack Query: arreglos jerárquicos, p. ej. `['meta']`, `['things', 'list', filtros]`, definidas en constantes por funcionalidad.
3. Reintentos: 1 para errores de red/5xx; **ninguno** para errores 4xx.
4. Los importes se muestran con `formatMXN(cents)`; las fechas con `formatDate`/`formatDateTime`; nunca con concatenaciones manuales.

## 7. Definición de Hecho (DoD) de una tarea

- [ ] Cumple los criterios de aceptación de la tarea en `tasks.md`.
- [ ] Respeta todos los artículos de esta constitución (revisado por `revisor-constitucion`).
- [ ] `npm run typecheck`, `npm run lint` y `npm test` sin fallos.
- [ ] Sin textos ni valores de diseño literales fuera de `i18n/` y `theme/`.
- [ ] `memoria.md` actualizado si hubo decisión, dependencia nueva o aprendizaje relevante.

### Art. XV — Repositorio y pull requests en GitHub (enmienda 1.3.0)
1. El código vive en un repositorio de GitHub (`vaiven-frontend`). La rama `main` está protegida: no se empuja directo ni se fuerzan pushes; todo cambio entra por pull request.
2. Una rama por spec (`spec/NNN-nombre`) y una PR por spec, que se abre cuando su tarea de cierre pasa. Otra persona la revisa y la fusiona; la spec siguiente puede partir de la rama anterior mientras tanto.
3. La PR cita la spec y las tareas cerradas, el resultado de la verificación (sin secretos) y el veredicto de `revisor-constitucion`. Commits y títulos en español, en imperativo, con el número de spec.
4. Nunca se suben secretos (`.env`, claves, tokens, `*.pem`, cadenas de conexión); `.gitignore` los excluye. Si uno se sube por error, se rota de inmediato.
5. El MCP de GitHub se declara **únicamente en `opencode.json`** y solo lo usa el agente `gestor-repo`: crea ramas, hace commits y abre PR. **Nunca** fusiona, cierra, borra ni cambia la configuración del repositorio. Las acciones de escritura piden aprobación.
6. **Trabajo humano mínimo:** la persona crea el repositorio, protege `main`, crea un token de acceso con permisos mínimos limitado a este repositorio (`GITHUB_PERSONAL_ACCESS_TOKEN` como variable del sistema), y revisa y fusiona las PR. El resto lo hace `gestor-repo` desde OpenCode.
7. No hay pipeline automatizado (CI) definido: las verificaciones son locales y el despliegue lo hace `devops-mcp` o `probador-expo` según el proyecto.
