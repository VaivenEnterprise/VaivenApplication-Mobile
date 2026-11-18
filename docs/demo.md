# Guion de demostración de la app móvil

El guion completo y los datos de la demostración viven en el backend (`vaiven-backend/docs/demo.md`). Este documento solo dice qué hacer **desde la app**.

> Nunca lleva contraseñas: están en el archivo `SEED_CREDENTIALS_FILE` de quien presenta, fuera del repositorio.

## Antes de empezar

- [ ] Backend de staging (o local) arriba y con el `seed` aplicado; `/readyz` verde en `/diagnostico` (modo `development`).
- [ ] Dos teléfonos con Expo Go apuntando a la misma API (`EXPO_PUBLIC_API_URL`, ver `docs/entorno-local.md`).
- [ ] Sesiones abiertas de antemano: **Ana** (dueña, teléfono A) y **Carla** o **Beto** (solicitante, teléfono B).

## Cuentas del `seed`

| Cuenta | Rol en la demo |
|---|---|
| `ana.demo@vaiven.example` | Dueña (taladro, escalera, desarmadores) |
| `beto.demo@vaiven.example` | Dueño y solicitante (su bicicleta ya tiene una reserva aceptada de Carla) |
| `carla.demo@vaiven.example` | Solicitante |
| `diego.demo@vaiven.example` | Solicitante (tiene una solicitud cancelada) |
| `elena.demo@vaiven.example`, `fer.demo@vaiven.example` | Dueñas |
| `admin.demo@vaiven.example` | Administración (no se usa en la app) |

## Recorrido (≈ 8 min)

1. **Teléfono B**: iniciar sesión, buscar «taladro» y abrir el detalle.
2. **B**: elegir «mañana», aceptar el total y enviar la solicitud.
3. **Teléfono A**: abrir Actividad, entrar a la solicitud y aceptarla.
4. **A**: registrar el estado del objeto y mostrar el QR de entrega. **B** lo escanea.
5. **A y B**: abrir el chat de la reserva e intercambiar un mensaje.
6. **B**: registrar el estado de devolución y mostrar su QR; **A** lo escanea.
7. **B**: calificar a Ana.
8. **Cualquiera**: activar el modo avión unos segundos para mostrar el aviso «Sin conexión» y la recuperación.

**Si falta tiempo:** saltar de 3 a 5 usando la reserva aceptada del `seed` (Carla y Beto). El recorrido automatizado (`npx jest src/__e2e__`) cubre los pasos 2 a 7.
