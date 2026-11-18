# Entorno local y de pruebas

La guía paso a paso (backend, `.env`, Expo Go, solución de fallos y comandos de calidad) está en el [README](../README.md#desarrollo-local). Aquí solo lo que cambia al apuntar a otro backend.

## Elegir la API

| Dónde corre | `EXPO_PUBLIC_API_URL` |
|---|---|
| Emulador Android | `http://10.0.2.2:8080` |
| Simulador iOS | `http://localhost:8080` |
| Teléfono físico (Expo Go) | `http://<IP_DE_TU_EQUIPO>:8080`, misma red Wi-Fi |
| Staging | la URL `https` publicada por el equipo de backend, con `EXPO_PUBLIC_APP_ENV=production` si se quiere el comportamiento de producción |

Tras cambiar `.env`: `npx expo start -c`.

## Verificación en Expo Go (T006 y T012) — pendiente, manual

Dejar anotado aquí, con fecha y quién:

- [ ] App abierta en Expo Go en 2 teléfonos contra el backend elegido.
- [ ] `/diagnostico` (solo desarrollo) muestra `/readyz` en verde.
- [ ] Registro, inicio de sesión y recorrido de `docs/demo.md`.

Staging aún no existe o no está validado desde esta fase; mientras tanto la verificación se hace contra el backend local (decisión del 9 de noviembre).
