# VAIVÉN — App móvil — Spec Driven Development con OpenCode

Plataforma móvil de préstamo y renta de objetos entre personas (México, MXN).
Contexto completo: [`docs/VAIVEN_Idea_y_Objetivo.pdf`](docs/VAIVEN_Idea_y_Objetivo.pdf). Calendario, reparto entre personas y políticas confirmadas: [`ROADMAP.md`](ROADMAP.md).

**Stack:** React Native + Expo + TypeScript

Este repositorio es **independiente**. Forma parte de VAIVÉN junto con [`vaiven-backend`](../vaiven-backend) (API) y [`vaiven-landing-page`](../vaiven-landing-page) (sitio informativo). Se asume que los tres repositorios están clonados lado a lado, porque algunos documentos del SDD apuntan al repositorio hermano con rutas `../vaiven-*`.

## Qué contiene

| Archivo / carpeta | Para qué sirve |
|---|---|
| `constitution.md` | Reglas técnicas no negociables. Máxima autoridad. |
| `AGENTS.md` | Instrucciones que OpenCode carga siempre: orden de lectura, flujo, agentes, comandos, reglas. |
| `memoria.md` | Decisiones, estado, modelos asignados, dependencias y aprendizajes. |
| `opencode.json` | Modelos gratuitos por agente, instrucciones cargadas y permisos. |
| `.opencode/agents/` y `.opencode/skills/` | Subagentes propios y skills con plantillas y listas de comprobación. |
| `specs/001…015/` | `spec.md`, `plan.md` y `tasks.md` de cada fase (**servicios por MCP**, arquitectura base, cuenta, imágenes, objetos, búsqueda, reservas, chat, entrega y pagos, calificaciones, notificaciones, integración, publicación en Google Play, IA y ML). Cada una termina con «Verificación en Expo Go». |
| `ROADMAP.md`, `docs/` | Copia del plan maestro y del documento de idea del proyecto. |

Solo consume la API del backend; el contrato oficial es `../vaiven-backend/api/openapi.yaml`.

## Flujo: OpenCode + MCP + Expo Go, spec por spec

1. No hay servidor que desplegar para la app. Cada spec se verifica en local con **Expo Go** contra el staging del backend (`EXPO_PUBLIC_API_URL`). La app **sí se compila** con EAS Build —**APK** (`preview`) para instalar y demostrar, **AAB** (`production`) para Google Play— y se publica en Google Play (spec 013).
2. MCP de Expo: `opencode mcp auth expo`. Solo `@probador-expo` lo usa.
3. Spec **001**: servicios (MCP de Expo; URL de staging en la VM de Azure, `https://<host>:8443`). Desde la **002**: se implementa con `@dev-expo`; la última tarea de cada spec es «Verificación en Expo Go» y exige la spec equivalente del backend ya desplegada. **La spec siguiente no empieza hasta que pase.**
4. Límite conocido: las notificaciones push remotas pueden no funcionar en Expo Go (Android).
5. Repositorio en GitHub: una rama y una PR por spec con `main` protegida, por el MCP de GitHub y `@gestor-repo` (Art. XV); sin pipeline automatizado.

## Cómo se usa con OpenCode

```bash
opencode          # desde la raíz de este repositorio
```
1. Ejecuta `opencode models` y confirma que los modelos de `opencode.json` existen (los gratuitos rotan); si cambias alguno, anótalo en `memoria.md`.
2. Agente `plan`: revisa y ajusta `spec.md`, `plan.md` y `tasks.md`.
3. Con la spec aprobada por una persona, cambia al agente `build` y pide @dev-expo la tarea que toque.
4. Al cerrar una fase, pide `@revisor-constitucion revisa los cambios`.

## Coherencia entre repositorios

- Los Artículos **IV** (contrato de API) y **V** (dinero, fechas, idioma) deben mantenerse idénticos en las constituciones de backend y móvil. Si cambias uno, cámbialo en ambos repositorios y registra la decisión en ambos `memoria.md`.
- `ROADMAP.md` y `docs/VAIVEN_Idea_y_Objetivo.pdf` son copias en cada repositorio; si se actualiza una, hay que actualizar las demás.

## Desarrollo local

La app **no se conecta a MongoDB**: solo habla con la API del backend. Para ver datos reales necesitas tres cosas en marcha: MongoDB, la API en Go y la app en Expo Go.

### Requisitos

| Herramienta | Para qué |
|---|---|
| Node.js (LTS) y npm | Instalar dependencias y correr Expo |
| Expo Go en el teléfono (Android o iOS) | Ver la app; también sirve un emulador o simulador |
| Go 1.26 | Correr la API del backend (`go version`) |
| Docker Desktop (o Podman) | MongoDB local |
| Teléfono y equipo en la **misma red Wi-Fi** | Solo si usas un teléfono físico |

Los repositorios deben estar clonados lado a lado (`vaiven-frontend` y `vaiven-backend` en la misma carpeta).

### 1. Levantar el backend (terminal 1, PowerShell)

```powershell
cd ..\vaiven-backend

# MongoDB como replica set (solo para tu máquina)
docker compose up -d

# Copia la plantilla y ajústala: la sección «API en desarrollo local»
copy .env.example .env
```

En `.env` del backend deben tener valor estas variables (las de Cloudinary pueden ser de relleno, como `dev`, porque la API no llama a Cloudinary al arrancar; el secreto de JWT debe tener al menos 32 caracteres y **nunca** se sube a git):

```
MONGO_URI=mongodb://localhost:27017/?replicaSet=rs0
MONGO_DB=vaiven_dev
HTTP_ADDR=:8080
CLOUDINARY_CLOUD_NAME=dev
CLOUDINARY_API_KEY=dev
CLOUDINARY_API_SECRET=dev
JWT_ACCESS_SECRET=<cadena aleatoria de 32 caracteres o más>
```

La API **no lee el archivo `.env`**, solo variables de entorno: cárgalas en la terminal y arranca.

```powershell
Get-Content .env | Where-Object { $_ -match '^[A-Z_]+=' } | ForEach-Object { $k, $v = $_ -split '=', 2; Set-Item "env:$k" $v }
go run ./cmd/api
```

Debe aparecer `servidor iniciado addr=:8080`. Déjala corriendo y comprueba desde otra terminal:

```powershell
curl http://localhost:8080/api/v1/meta     # {"name":"vaiven-backend","version":"dev",...}
```

`/readyz` puede decir `"redis":"degradado"` en local: es normal, sin `REDIS_URL` se usa memoria.

### 2. Configurar la app (terminal 2)

```powershell
cd ..\vaiven-frontend
npm install
copy .env.example .env
```

Abre `.env` y deja **una sola** línea `EXPO_PUBLIC_API_URL` activa, según dónde corras la app:

| Dónde la corres | Valor |
|---|---|
| Teléfono físico con Expo Go | `http://<IPv4 de tu equipo>:8080` |
| Emulador Android | `http://10.0.2.2:8080` |
| Simulador iOS | `http://localhost:8080` |

> **El error más común.** El valor de `.env.example` (`192.168.1.50`) es solo un ejemplo. Con un teléfono físico debes poner **la IPv4 real de tu equipo**: ejecuta `ipconfig` y usa «Dirección IPv4» del adaptador Wi-Fi. Nunca uses `localhost` ni `10.0.2.2` en un teléfono físico.

Antes de abrir la app, comprueba desde el **navegador del teléfono** que llega al backend: `http://<tu-IP>:8080/api/v1/meta` debe mostrar un JSON. Si no carga, abre el puerto en el firewall de Windows (PowerShell como administrador):

```powershell
New-NetFirewallRule -DisplayName "Vaiven API 8080" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
```

### 3. Abrir la app

```powershell
npx expo start -c
```

Escanea el QR con Expo Go (o pulsa `a` para el emulador Android, `i` para el simulador iOS). **Cada vez que cambies `.env`, reinicia con `-c`**: Expo solo lo lee al arrancar.

- **Inicio:** la pantalla de bienvenida con la marca y el subtítulo.
- **Diagnóstico** (solo con `EXPO_PUBLIC_APP_ENV=development`): no hay botón, se abre por enlace. Con Expo Go en el teléfono, escribe en su navegador `exp://<tu-IP>:8081/--/diagnostico`; en emulador o simulador, `vaiven://diagnostico`. Debe mostrar nombre, versión, entorno y hora del servidor.

### Si algo falla

| Síntoma | Causa probable |
|---|---|
| «Sin conexión. Revisa tu internet.» en Diagnóstico | La API no está corriendo, `EXPO_PUBLIC_API_URL` tiene otra IP (o la de ejemplo), reiniciaste sin `-c`, o el firewall bloquea el puerto 8080. En el log de la API debe verse un `GET /api/v1/meta` cuando pulsas «Reintentar»; si no aparece, la app no está llegando. |
| «La app no está bien configurada» | `EXPO_PUBLIC_API_URL` falta, está vacía o no es una URL `http(s)` válida (en `production` debe ser `https`). |
| `go run` termina al arrancar | Falta una variable obligatoria; el mensaje las lista todas. Recuerda cargar el `.env` en esa terminal. |
| Mongo no conecta | `docker ps` debe mostrar el contenedor de `vaiven-local`; si acaba de crearse, espera unos segundos a que inicie el replica set. |
| La IP cambió | Al cambiar de red cambia tu IPv4: actualiza `.env` y reinicia con `-c`. |

### Comandos de calidad

```powershell
npm run typecheck
npm run lint
npx prettier --check .
npm test -- --coverage
```

### Estructura del código

```
src/
├── app/          Rutas de Expo Router: pantallas delgadas (index, +not-found, (dev)/diagnostico)
├── components/   AppErrorBoundary y ui/ (Screen, AppText, Button, Card, estados de carga y error…)
├── features/     Un módulo por funcionalidad: api/, hooks/, types.ts y keys.ts (hoy: diagnostics)
├── i18n/         es-MX.ts: todos los textos visibles
├── lib/          config, api (cliente y errores), query, storage y format (dinero y fechas)
├── providers/    AppProviders (React Query)
└── theme/        tokens.ts: colores, espaciados, tipografía y sombras
```

Reglas que revisa `src/conventions.test.ts`: ningún texto visible ni color literal fuera de `i18n/` y `theme/`. Las `features` no se importan entre sí; las pantallas de `app/` solo arman componentes y hooks.

## Estado

Spec 002 (arquitectura base): fases 0 a 3 completas (configuración, tokens, textos, cliente de API, componentes base, rutas y pantalla de diagnóstico). Falta la fase 4 (cierre). Detalle por tarea en `specs/002-arquitectura-base/tasks.md` y decisiones en `memoria.md`.
