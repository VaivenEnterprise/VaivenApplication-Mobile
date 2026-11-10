# Ruta crítica: login e Inicio funcionales con API

**Meta (9 nov 2026):** una persona se registra o inicia sesión, llega al Inicio y ve su nombre, los proyectos populares y los objetos recientes traídos de la API; cierra sesión; al reabrir la app sigue dentro. Todo **en local**, con Expo Go y el backend local.

## Orden de ejecución (una tarea a la vez)

### A. Base — spec 002
| # | Tarea | Para qué |
|---|---|---|
| 1 | T001 proyecto Expo → T002 TypeScript estricto → T003 lint y formato · T004 pruebas `[P]` | Esqueleto y calidad |
| 2 | T005 configuración validada (`EXPO_PUBLIC_API_URL`) | Apuntar al backend local |
| 3 | T006 tokens + dependencias visuales (fuentes, degradados, SVG, íconos) | Diseño de Stitch |
| 4 | T007 textos · T008 formato MXN y fechas · T009 almacenamiento seguro | Textos, precios del Inicio, tokens de sesión |
| 5 | T010 errores de API → T011 cliente de API → T012 caché y proveedores | Consumo de la API |
| 6 | T014 `Screen`, `AppText`, `AppIcon`, `GradientBackground`, `BrandMark` → T015 `Button`, `Card`, `Chip`, `IconBadge`, `Divider`, estados → **T030 parte 1** (`Skeleton`, `Avatar`, `Banner`) | Componentes que usan login e Inicio |
| 7 | T016 manejador de errores → T017 rutas raíz y carga de fuentes → T025 `app.config.ts` → T026 `.env.example` | Arranque de la app |

Notas: T027 repite parte de T005 (revisar al ejecutar y marcar como cubierta). T024 instala solo lo que la ruta necesita (`expo-secure-store`, `expo-font`, `expo-linear-gradient`, `react-native-svg`). Cámara, ubicación, imágenes y notificaciones esperan a su spec.

### B. Cuenta e Inicio — spec 003
| # | Tarea | Para qué |
|---|---|---|
| 8 | T001 formularios → T002 campos y `SlotPlaceholder` → T003 textos y esquemas | Login y registro |
| 9 | T004 API de autenticación → T005 renovación de sesión → T006 `SessionProvider` | Sesión real |
| 10 | T007 pantallas de login y registro | **Hito 1: se puede entrar** |
| 11 | T008 layout raíz, *auth gate* y pestañas (incluye marcadores `proyecto/[id]` y `objeto/[id]`) | Navegación |
| 12 | T009 Perfil mínimo (ver y **cerrar sesión**) | Probar el ciclo completo |
| 13 | **006-T011** catálogo de proyectos y `PopularProjects` → **T014 Inicio funcional** | **Hito 2: Inicio con API** |
| 14 | T011 prueba de integración del flujo de sesión | Cierre |

## Lo que necesita el backend (local)
- Autenticación: `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, y `GET /me`.
- Para los objetos recientes del Inicio: `GET /items?limit=6` (contrato de búsqueda, backend spec 006). Si aún no existe, el Inicio muestra el estado de error o vacío solo en esa sección y **el login no se bloquea**.

## URL del backend por plataforma (solo desarrollo)
| Dónde corre la app | `EXPO_PUBLIC_API_URL` |
|---|---|
| Emulador Android | `http://10.0.2.2:8080` |
| Simulador iOS | `http://localhost:8080` |
| Teléfono físico con Expo Go | `http://<IP local del equipo>:8080` (mismo Wi-Fi) |

## Listo cuando
1. Registro → entra directo al Inicio.
2. Cerrar sesión desde Perfil → vuelve a login; iniciar sesión → Inicio.
3. Cerrar y reabrir la app con sesión → sigue en Inicio sin pedir datos.
4. Inicio muestra el nombre real, los proyectos y los objetos de la API (o vacío/error correctos).
5. Con el token vencido, una sola renovación aunque haya varias peticiones.
6. `npm run typecheck && npm run lint && npm test` en verde.

## Puede esperar
Diagnóstico ampliado (002-T018 y T028), perfil público (003-T010), verificaciones de las specs (a mano o con Claude), publicación (013) y todo lo de 004 en adelante.
