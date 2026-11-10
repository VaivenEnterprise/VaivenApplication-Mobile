# Evidencia de la verificación en Expo Go (spec 002, T029)

Aquí se guardan las capturas o notas de la verificación manual de la spec 002 (sin secretos ni datos personales).

Con el backend local arriba (`go run ./cmd/api`) y `EXPO_PUBLIC_API_URL` apuntando a la IP del equipo:

1. La app abre en Expo Go en el teléfono y muestra el Inicio (captura `01-inicio.png`).
2. `/diagnostico` muestra la URL activa, nombre, versión, entorno, hora, `/healthz` y `/readyz` (captura `02-diagnostico.png`).
3. Con el backend detenido, `/diagnostico` muestra «Sin conexión» y «Reintentar» (captura `03-sin-conexion.png`).
4. Anota en `memoria.md` la fecha, el teléfono y el resultado.
