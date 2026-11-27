# Suite automatizada en dispositivo físico

Spec 016 (RF-07, RF-08); flujos estrictos y nuevos en la spec 021-T025 (RF-24). Flujos de Maestro (`.maestro/`) que manejan la app en un **Android físico** conectado por USB, contra la API de staging. **Estado: preparada y verificada en sus guardas y con pruebas estáticas de los flujos; los flujos aún no se han ejecutado en un teléfono** (spec 016-T009 y 021-T026, que necesitan el teléfono, la autorización de instalar Maestro y los datos de demostración del backend 016-T012).

## Requisitos (una vez, en la computadora de quien ejecuta)

1. **Android Platform Tools** (`adb`) en el PATH. En PowerShell: `adb version`.
2. **Maestro**, CLI externa y gratuita (<https://maestro.mobile.dev>); no entra al `package.json` ni a la app (spec 016, P-03). `maestro --version` debe responder.
3. Teléfono Android con **depuración USB** activada, conectado por USB y con el aviso aceptado: `adb devices` debe decir `device` (no `unauthorized`).
4. La app en el teléfono, de una de dos formas:
   - **APK `preview`** (`--modo apk`, paquete `mx.vaiven.app`): se construye con EAS. `eas.json` apunta hoy a la API de staging (`https://vaiven-staging.westus2.cloudapp.azure.com:8443`) con `EXPO_PUBLIC_APP_ENV=production`; el script decide por el **host**, no por esa variable.
   - **Expo Go** (`--modo expo-go --link exp://<IP-de-tu-PC>:8081`, Art. XIV.1): con `npx expo start` corriendo y `.env` apuntando a staging o a una red local.

## Ejecutar

PowerShell (desde la raíz del repositorio):

```powershell
.\scripts\device-tests.ps1 -Modo apk
.\scripts\device-tests.ps1 -Modo expo-go -Link exp://192.168.1.20:8081
```

Terminal del IDE:

```bash
npm run test:device -- --modo apk
```

Variables de entorno opcionales: `E2E_EMAIL` y `E2E_PASSWORD` (si faltan se generan para esta corrida; nunca se imprimen ni se guardan), `E2E_API_URL` (anula la URL leída de `eas.json` o `.env`), `E2E_ALLOW_API_HOST` (añade a la lista de hosts permitidos uno o varios `host:puerto` separados por coma; solo para esa corrida, y no sustituye aprobar el host en `docs/calidad/entornos.md`).

Variables de **demostración** (spec 021-T025). Sin ellas la suite corre, avisa antes de empezar (`⚠ Falta …`) y el flujo que las usa **falla**; ya no se omite en silencio. Salen de cuentas del `seed` del backend (`*.demo@vaiven.example`, 016-T012) **reservadas para la suite**: las controla el equipo, no se usan en presentaciones ni las usa nadie más (`docs/calidad/entornos.md`, regla 2); **nunca** de una persona real:

| Variable | Flujo | Qué es |
|---|---|---|
| `E2E_ITEM_TITLE` | `03-solicitud` | Título exacto de un objeto **activo** de una cuenta de demostración (p. ej. «Taladro percutor 600 W»). Sin caracteres especiales de expresión regular (`\ ^ $ . * + ? ( ) [ ] { } \|`): el script se niega a correr si los trae. |
| `E2E_CHAT_EMAIL`, `E2E_CHAT_PASSWORD` | `08-chat` | Cuenta de demostración con al menos una conversación **abierta** (una reserva aceptada del `seed`). La contraseña nunca se imprime ni se guarda. |

El script genera además `E2E_RUN_ID` (marca de tiempo de la corrida) para el título del objeto que publica `05` y el texto del mensaje de `08`, así cada corrida busca lo suyo. `ultima-ejecucion.json` registra en `variablesFaltantes` qué variables de demostración faltaron.

## Comprobaciones previas (T009 — preparadas, no ejecutadas)

Con la autorización de la persona y el teléfono conectado por USB, en este orden (PowerShell, desde la raíz del repositorio):

```powershell
adb devices -l                       # debe decir "device", nunca "unauthorized"; un emulador no sirve
maestro --version                    # CLI externa: instalarla antes requiere autorización explícita
$env:E2E_EMAIL      = '<cuenta de prueba>'
$env:E2E_PASSWORD   = '<contraseña de la cuenta de prueba>'
$env:E2E_ITEM_TITLE = '<título de un objeto de una cuenta de demostración>'
$env:E2E_CHAT_EMAIL    = '<cuenta de demostración con una reserva aceptada>'
$env:E2E_CHAT_PASSWORD = '<contraseña de esa cuenta de demostración>'
$env:E2E_API_URL    = 'https://vaiven-staging.westus2.cloudapp.azure.com:8443'
.\scripts\device-tests.ps1 -Modo apk # o -Modo expo-go -Link exp://<IP-del-PC>:8081
```

Los valores `E2E_*` nunca se versionan. Si `E2E_EMAIL`/`E2E_PASSWORD` faltan, el script genera una cuenta efímera y el flujo `09-baja.yaml` la elimina; comprobar al final que ya no se puede entrar con ella. **Entornos (spec 021-T005, `docs/calidad/entornos.md`):** hay un solo servidor, `https://vaiven-staging.westus2.cloudapp.azure.com:8443`, y se trata como producción; el script solo corre contra él (o contra una red local) porque figura en `scripts/e2e-allowed-hosts.json`, y solo con la cuenta efímera que la propia corrida crea y elimina. El mismo nombre **sin puerto** (`:443`) no está en la lista y el script se niega. Desde la 021-T025 los flujos 03 y 08 solo usan **cuentas y objetos de demostración** (`seed`), y todo lo que la corrida crea lo deshace: 03 cancela su solicitud, 05 elimina el objeto que publica y 09 elimina la cuenta efímera (corre aunque falle un flujo anterior).

**Estado real (2026-11-25):** `adb` y `maestro` no están instalados en la máquina de la sesión; `npm run test:device` falló con código 2, mensaje claro y sin escribir resultados. No se confirmó la existencia de datos de demostración: el backend 016-T012 sigue abierto y su `seed` está bloqueado. Al terminar la corrida real se archiva `docs/calidad/dispositivo/informe-<fecha>.xml` junto con el comando y la fecha.

**Estado real (2026-11-27, 021-T025):** igual: sin `adb` ni `maestro`; `npm run test:device -- --modo apk` acepta la API (`scripts/e2e-allowed-hosts.json`) y se detiene en «No encuentro `adb`» sin escribir resultados. Los flujos nuevos se verificaron solo de forma estática (`node --test scripts/device-tests.test.mjs`).

## Qué comprueba el script antes de correr (CA-08)

| Condición | Resultado |
|---|---|
| `E2E_ITEM_TITLE` trae caracteres especiales de expresión regular | Se niega (código 2): los flujos buscan el objeto por su título dentro de una expresión regular. |
| La API no es local ni un `host:puerto` de la **lista explícita** (`scripts/e2e-allowed-hosts.json` o `E2E_ALLOW_API_HOST`); el nombre no cuenta, aunque diga «staging», y el puerto sí | Se niega (código 2), muestra la URL y no corre. Si la acepta, imprime la URL activa y por qué (`API aceptada: …`) y lo guarda en `ultima-ejecucion.json` |
| No hay `adb` | Falla con instrucciones (código 2). |
| No hay dispositivo, o solo hay emuladores | Falla con instrucciones (código 2). |
| No hay Maestro | Falla con instrucciones (código 2). |
| Todo en orden | Corre los flujos; escribe `docs/calidad/dispositivo/informe-<fecha>.xml` (JUnit) y `ultima-ejecucion.json`. Código 0 si pasan, 1 si fallan. |

En los cinco primeros casos **no se escribe ningún resultado**.

## Flujos

Corren en el orden fijo de `.maestro/config.yaml` (`executionOrder.flowsOrder`), no en el que elija Maestro, porque comparten la cuenta efímera. Con `continueOnFailure: true`, un fallo intermedio no impide que `09-baja` elimine la cuenta. Del 05 al 09 cada flujo empieza cerrando y abriendo la app (`_shared/reabrir.yaml` o equivalente), para no depender de dónde se quedó el anterior.

| Archivo | Qué hace |
|---|---|
| `00-registro.yaml` | Registro con la cuenta de prueba (empieza sin sesión). |
| `01-login.yaml` | Contraseña incorrecta no entra; la correcta sí. |
| `02-explorar.yaml` | Busca «taladro» y **exige resultados**: falla con el estado vacío («Nada por aquí» o «Aún no hay objetos publicados»). |
| `03-solicitud.yaml` | **Falla si falta `E2E_ITEM_TITLE`.** Solicita ese objeto de demostración, comprueba «Solicitud enviada» y la cancela desde Actividad. |
| `04-sesion-persiste.yaml` | Cierra la app **sin cerrar sesión** y la vuelve a abrir: sigue dentro. |
| `05-publicar.yaml` | Publica un objeto con foto (`media/foto-prueba.jpg`, imagen sintética del `seed`, sin datos personales) elegida de la galería; si el servidor tiene activa la sugerencia con IA (aparece «Sugerir con IA»), **exige** que llegue y la descarta; comprueba el objeto en «Mis objetos» y lo elimina. |
| `06-recomendaciones.yaml` | Borra el historial de recomendaciones desde Perfil y exige «Historial borrado». |
| `07-logout.yaml` | Cierra sesión; al reabrir ya no hay sesión. |
| `08-chat.yaml` | **Falla si faltan `E2E_CHAT_EMAIL`/`E2E_CHAT_PASSWORD`.** Entra con la cuenta de demostración, abre la primera conversación abierta, envía un mensaje único de la corrida, comprueba que quedó enviado y cierra la sesión. |
| `09-baja.yaml` | Si quedó una sesión abierta, la cierra; contraseña incorrecta no elimina; la correcta elimina la cuenta de prueba y ya no se puede entrar. |

Subflujos (`_shared/`): `abrir`, `reabrir`, `iniciar-sesion` y `cerrar-sesion`.

Los textos **de la app** que buscan los flujos salen de `src/i18n/`; una prueba (`scripts/device-tests.test.mjs`, «los textos de la app que buscan los flujos salen de src/i18n/») lo comprueba en cada `npm run test:scripts`. Las únicas excepciones son datos, declarados en esa prueba (`DATOS_DE_PRUEBA`): el término de búsqueda «taladro», la categoría «Herramientas manuales» (POL-14, la manda `GET /categories`) y los textos que la corrida escribe. Si cambia un texto de la app, la prueba falla hasta corregir el flujo.

## Límites conocidos

- Los flujos se escribieron leyendo la app y **no se han probado en un teléfono**: pueden necesitar ajustes de selectores en la primera corrida real (T026).
- `05-publicar` toca el selector de fotos **de Android**, que no es de la app: usa sus ids (`…:id/icon_thumbnail` y, con selección múltiple, `…:id/button_add`). Pueden cambiar entre versiones de Android y son lo primero a revisar si 05 falla al elegir la foto.
- Los campos del formulario se anuncian con su etiqueta, igual que el texto visible encima: `05` usa `index: 1` para escribir en el campo y no en la etiqueta.
- Con Expo Go, `clearState` borra los datos de Expo Go del teléfono, no solo los de Vaivén.
- Los avisos push remotos no se prueban (no funcionan en Expo Go en Android; riesgo del ROADMAP).
