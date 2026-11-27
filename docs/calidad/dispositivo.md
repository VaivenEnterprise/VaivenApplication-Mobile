# Suite automatizada en dispositivo físico

Spec 016 (RF-07, RF-08). Flujos de Maestro (`.maestro/`) que manejan la app en un **Android físico** conectado por USB, contra la API de staging. **Estado: preparada y verificada en sus guardas; los flujos aún no se han ejecutado en un teléfono** (tarea T009, que necesita el teléfono y la autorización de instalar Maestro).

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

Variables de entorno opcionales: `E2E_EMAIL` y `E2E_PASSWORD` (si faltan se generan para esta corrida; nunca se imprimen ni se guardan), `E2E_ITEM_TITLE` (título de un objeto de **otra** persona en staging; sin él se omite el flujo 03), `E2E_API_URL` (anula la URL leída de `eas.json` o `.env`), `E2E_ALLOW_API_HOST` (añade a la lista de hosts permitidos uno o varios `host:puerto` separados por coma; solo para esa corrida, y no sustituye aprobar el host en `docs/calidad/entornos.md`).

## Comprobaciones previas (T009 — preparadas, no ejecutadas)

Con la autorización de la persona y el teléfono conectado por USB, en este orden (PowerShell, desde la raíz del repositorio):

```powershell
adb devices -l                       # debe decir "device", nunca "unauthorized"; un emulador no sirve
maestro --version                    # CLI externa: instalarla antes requiere autorización explícita
$env:E2E_EMAIL      = '<cuenta de prueba>'
$env:E2E_PASSWORD   = '<contraseña de la cuenta de prueba>'
$env:E2E_ITEM_TITLE = '<título de un objeto ajeno en staging>'
$env:E2E_API_URL    = 'https://vaiven-staging.westus2.cloudapp.azure.com:8443'
.\scripts\device-tests.ps1 -Modo apk # o -Modo expo-go -Link exp://<IP-del-PC>:8081
```

Los valores `E2E_*` nunca se versionan. Si `E2E_EMAIL`/`E2E_PASSWORD` faltan, el script genera una cuenta efímera y el flujo `06-baja.yaml` la elimina; comprobar al final que ya no se puede entrar con ella. **Entornos (spec 021-T005, `docs/calidad/entornos.md`):** hay un solo servidor, `https://vaiven-staging.westus2.cloudapp.azure.com:8443`, y se trata como producción; el script solo corre contra él (o contra una red local) porque figura en `scripts/e2e-allowed-hosts.json`, y solo con la cuenta efímera que la propia corrida crea y elimina. El mismo nombre **sin puerto** (`:443`) no está en la lista y el script se niega. El flujo 03 pide un objeto de otra persona: no se corre contra el servidor único hasta que T025/T026 definan un objeto de demostración propio.

**Estado real (2026-11-25):** `adb` y `maestro` no están instalados en la máquina de la sesión; `npm run test:device` falló con código 2, mensaje claro y sin escribir resultados. No se confirmó la existencia de datos de demostración: el backend 016-T012 sigue abierto y su `seed` está bloqueado. Al terminar la corrida real se archiva `docs/calidad/dispositivo/informe-<fecha>.xml` junto con el comando y la fecha.

## Qué comprueba el script antes de correr (CA-08)

| Condición | Resultado |
|---|---|
| La API no es local ni un `host:puerto` de la **lista explícita** (`scripts/e2e-allowed-hosts.json` o `E2E_ALLOW_API_HOST`); el nombre no cuenta, aunque diga «staging», y el puerto sí | Se niega (código 2), muestra la URL y no corre. Si la acepta, imprime la URL activa y por qué (`API aceptada: …`) y lo guarda en `ultima-ejecucion.json` |
| No hay `adb` | Falla con instrucciones (código 2). |
| No hay dispositivo, o solo hay emuladores | Falla con instrucciones (código 2). |
| No hay Maestro | Falla con instrucciones (código 2). |
| Todo en orden | Corre los flujos; escribe `docs/calidad/dispositivo/informe-<fecha>.xml` (JUnit) y `ultima-ejecucion.json`. Código 0 si pasan, 1 si fallan. |

En los cuatro primeros casos **no se escribe ningún resultado**.

## Flujos

| Archivo | Qué hace |
|---|---|
| `00-registro.yaml` | Registro con la cuenta de prueba (empieza sin sesión). |
| `01-login.yaml` | Contraseña incorrecta no entra; la correcta sí. |
| `02-explorar.yaml` | Explorar con búsqueda (resultados o estado vacío). |
| `03-solicitud.yaml` | Solicita un objeto de staging (`E2E_ITEM_TITLE`). |
| `04-sesion-persiste.yaml` | Cierra la app **sin cerrar sesión** y la vuelve a abrir: sigue dentro. |
| `05-logout.yaml` | Cierra sesión; al reabrir ya no hay sesión. |
| `06-baja.yaml` | Contraseña incorrecta no elimina; la correcta elimina la cuenta de prueba y ya no se puede entrar. |

Los textos de los flujos salen de `src/i18n/`. Si cambia un texto de la app, hay que cambiarlo también aquí.

## Límites conocidos

- Los flujos se escribieron leyendo la app y **no se han probado en un teléfono**: pueden necesitar ajustes de selectores en la primera corrida real.
- Con Expo Go, `clearState` borra los datos de Expo Go del teléfono, no solo los de Vaivén.
- Los avisos push remotos no se prueban (no funcionan en Expo Go en Android; riesgo del ROADMAP).
