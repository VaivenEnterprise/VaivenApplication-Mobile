# Entornos: producción, pruebas y datos

**Spec 021 · T005 (RF-05)** · Fecha: 2026-11-26 · **Aprobada por la persona responsable en la sesión del 2026-11-26** (opción «un solo servidor»). Hallazgo que cierra: A-3.

## 1. Decisión

**Hay un solo servidor de la API.** Es el que usa la app publicada en Google Play (D-227) y es también el único contra el que se prueba en teléfono. No existe un servidor de pruebas separado.

| Entorno | Host de la API | Quién lo usa | Notas |
|---|---|---|---|
| **Producción y pruebas (único)** | `https://vaiven-staging.westus2.cloudapp.azure.com:8443` | La app 1.1.2 de Play (`eas.json`, perfiles `preview` y `production`) y la suite de dispositivo | El nombre dice «staging» y `/api/v1/meta` responde `environment: staging`, pero **se trata como producción**: sus datos son reales (D-227). El nombre **no** es garantía de nada (P-04) |
| Desarrollo local | `localhost`, `10.0.2.2` (emulador Android) o una IP de red privada con el backend local | Quien programa | Datos propios y descartables. Es el único entorno donde se puede probar sin límites |

La misma URL con otro puerto o sin puerto (`https://vaiven-staging.westus2.cloudapp.azure.com`, es decir `:443`) **no** es lo que usa la app: el 2026-11-25 respondía `environment: production` y sin `features` (`docs/calidad/dispositivo.md`). El puerto forma parte de la identidad del host y por eso la guarda de `device-tests` lo compara (T006).

## 2. Qué datos puede tocar cada prueba

| Prueba | Contra el servidor único | Contra el servidor local |
|---|---|---|
| Pruebas Jest (unitarias, integración, seguridad) | No tocan la red: usan la API simulada | Igual |
| `npm run test:device` (Maestro, destructiva: registra y elimina una cuenta) | **Solo con cuentas creadas y eliminadas en la propia corrida** (correo `vaiven.e2e.<marca de tiempo>@example.com` y contraseña aleatoria generadas por el script); el flujo `09-baja.yaml` elimina la cuenta al final; los flujos 03 y 08 usan además **cuentas de demostración reservadas para la suite** (regla 2) | Sin restricción |
| `npm run test:contract` (T010, futura) | Solo `GET`, sin credenciales ni escrituras | Igual |
| Cualquier prueba que modifique o borre datos de **personas reales** | **Prohibida** | Permitida con datos propios |

Reglas que se derivan:

1. Las pruebas destructivas **nunca** usan una cuenta real ni una cuenta de demostración que alguien más use. `E2E_EMAIL` y `E2E_PASSWORD` solo se fijan para una cuenta que la propia corrida crea.
2. El flujo `03-solicitud` pide un objeto de otra persona (`E2E_ITEM_TITLE`). En un servidor con datos reales eso crea una solicitud a una persona real: **no se corre así**. ~~Hasta que T025/T026 definan un objeto de demostración propio (de una cuenta de prueba que el equipo controle y que se crea y elimina), ese flujo se omite o se corre contra el servidor local.~~ **Definido en T025 (2026-11-27, D-253):** `E2E_ITEM_TITLE` es un objeto de una cuenta del `seed` (`*.demo@vaiven.example`, backend 016-T012) **reservada para la suite**: no se usa en presentaciones ni la usa nadie más. El flujo cancela su solicitud al terminar. Lo mismo vale para `E2E_CHAT_EMAIL` (flujo `08-chat`, que envía un mensaje en una conversación de demostración). Sin esas variables, 03 y 08 **fallan** (ya no se omiten). Qué cuentas se reservan lo decide quien administra el `seed` y se anota, sin contraseñas, en el registro de la corrida (T026).
3. Las cuentas de prueba se eliminan al final de la corrida; se comprueba que ya no se puede entrar con ellas (`docs/calidad/dispositivo.md`).
4. Capturas e informes de pruebas no incluyen datos personales (RNF-04).

## 3. Cómo se hace cumplir

- `scripts/device-tests.mjs` solo corre contra un host de la **lista explícita** `scripts/e2e-allowed-hosts.json` (o `E2E_ALLOW_API_HOST`) o contra una red local; cualquier otro, incluso con «staging» en el nombre, se rechaza (CA-04, T006). La lista la revisa una persona en cada cambio (Art. XV).
- El único host de la lista versionada es el de la tabla de §1. Para añadir otro hay que actualizar este documento y que la persona responsable lo apruebe.

## 4. Riesgos aceptados

- **Datos reales en el entorno de pruebas.** Con un solo servidor, un error en una prueba destructiva puede afectar datos reales. Se mitiga con la regla 1 (solo cuentas efímeras) y con la guarda por lista; no se elimina.
- **Etiqueta engañosa.** `/meta` dice `staging`. No se cambia desde el móvil (es el backend); se documenta aquí.
- **Aviso de privacidad y Play.** Si alguna vez se separan los entornos, hay que revisar las declaraciones de datos.

## 5. Si se crea un segundo servidor

Requiere infraestructura y autorización de quien administra la cuenta (RNF-05). Pasos: escribir aquí el host nuevo y quién lo administra, moverlo a la lista de hosts permitidos, apuntar `preview` de `eas.json` al de pruebas y `production` al de producción, y volver a aprobar este documento. Hasta entonces, nada de esto se hace.
