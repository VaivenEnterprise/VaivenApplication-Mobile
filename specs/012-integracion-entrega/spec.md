# Spec 012 — Integración, pulido y entrega (móvil)

- **Dueño:** todo el equipo (MO-A lidera integración y pruebas con 2 teléfonos; MO-B lidera documentación) · **Prioridad:** P0 · **Ventana:** 19–22 nov · **Depende de:** 001–011 (móvil) y 012 (backend)
- **Constitución:** v1.2.0 · **Estado:** Borrador

## 1. Objetivo y por qué
Dejar una **app instalable y presentable**: verificación en Expo Go, estados vacíos y de error cuidados, accesibilidad básica, recorrido completo probado con dos teléfonos reales contra staging y documentación para la presentación. No agrega funcionalidad.

## 2. Requisitos
| ID | Requisito |
|---|---|
| RF-01 | La app corre en **Expo Go** apuntando al staging final en al menos 2 teléfonos Android reales; sin compilación (Art. XIV). |
| RF-02 | **Banner de conexión**: aviso global «Sin conexión» cuando no hay red y reintento automático al volver (sin librería nueva: `fetch` a `/healthz` y `AppState`); las pantallas con datos en caché muestran lo último disponible. |
| RF-03 | **Pulido de estados**: toda pantalla con datos tiene estado de carga, vacío, error y reintento; revisión pantalla por pantalla con una lista de comprobación. |
| RF-04 | **Accesibilidad básica**: etiquetas en botones e íconos, objetivos táctiles ≥ 44 dp, contraste suficiente en tokens, texto escalable, orden de lectura lógico en formularios y QR. |
| RF-05 | **Identidad visual mínima**: ícono, pantalla de inicio (*splash*), nombre y colores de marca en tokens (según lo que defina el equipo). |
| RF-06 | **Recorrido manual con 2 teléfonos** (lista en `docs/validacion.md`): registro de A y B → A publica con fotos → B busca y solicita → A acepta → chat → entrega con QR → pago → devolución con QR → calificaciones → incidencia (opcional) → notificaciones. Se anotan fallos y su resolución. |
| RF-07 | **Revisión de seguridad**: sin secretos en el repositorio ni en el código de la app, tokens solo en `SecureStore`, sin PII en logs, evidencia sin caché persistente, permisos mínimos declarados. |
| RF-08 | **Rendimiento básico**: listas con paginación y `keyExtractor`, imágenes con miniaturas, arranque en < 3 s en un teléfono de gama media (medición anotada). |
| RF-09 | **Documentación**: `README` final de la app, `docs/entorno-local.md` actualizado, `docs/validacion.md` (lista de comprobación y plan de validación con personas usuarias), `docs/demo.md` (guion con cuentas de `seed`). |
| RF-10 | Pruebas: `npm run check` (tipos + lint + pruebas) pasa; cobertura global ≥ 70 %; una **prueba de integración de punta a punta** en Jest con dobles de red para el flujo principal. |
| RNF-01 | La revisión final de `revisor-constitucion` sobre todo el repositorio es **CONFORME**. |

## 3. Criterios de aceptación
| ID | Dado / Cuando / Entonces |
|---|---|
| CA-01 | Dada la app abierta en Expo Go en dos teléfonos, cuando sigo la lista de `docs/validacion.md`, entonces el recorrido completo termina sin bloqueos. |
| CA-02 | Dado el modo avión, entonces veo el banner y, al reactivar la red, se recupera sin reiniciar. |
| CA-03 | Dada cualquier pantalla de datos sin resultados, entonces veo un estado vacío con acción. |
| CA-04 | Dado el lector de pantalla, entonces los controles del recorrido principal tienen etiqueta. |
| CA-05 | Dado el repositorio, entonces no contiene secretos. |

## 4. Fuera de alcance
Publicación en tiendas, iOS firmado, modo oscuro completo, soporte de tabletas, analítica.

## 5. Preguntas abiertas
- [NEEDS CLARIFICATION: paleta y logotipo definitivos (identificador visual); provisional: tokens neutros de 002.]
- [NEEDS CLARIFICATION: ¿personas externas probarán la app en Expo Go antes del 22 nov? Define el alcance de `validacion.md`.]
