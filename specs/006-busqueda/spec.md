# Spec 006 — Búsqueda y exploración (móvil)

- **Dueño:** MO-B · **Prioridad:** P0 · **Ventana:** 8–10 nov · **Depende de:** 003 (móvil), componente `ItemCard` de 005 y contrato 006 (backend)
- **Constitución:** v1.2.0 · **Estado:** Borrador

## 1. Objetivo y por qué
Que una persona **encuentre** lo que necesita cerca de ella: por texto, categoría, zona, fechas disponibles y distancia. Es la puerta de entrada de la app (pestaña Explorar).

## 2. Historias
| # | Prio. | Historia |
|---|---|---|
| H-01 | P0 | Como solicitante, quiero ver objetos recientes al abrir la app, para descubrir opciones. |
| H-02 | P0 | Como solicitante, quiero buscar por palabras y filtrar por categoría, para encontrar algo concreto. |
| H-03 | P1 | Como solicitante, quiero indicar fechas, para ver solo lo disponible. |
| H-04 | P1 | Como solicitante, quiero ver lo más cercano a mí, para reducir traslados. |

## 3. Requisitos
| ID | Requisito |
|---|---|
| RF-01 | Pestaña **Explorar**: barra de búsqueda, chips de categoría, botón de filtros y lista infinita de `ItemCard` (`GET /items`, `useInfiniteQuery`, `nextCursor`). |
| RF-02 | Búsqueda por texto con *debounce* (400 ms); el texto vacío vuelve a «recientes». |
| RF-03 | **Filtros** en una hoja inferior: categoría, modalidad (préstamo/renta), municipio, fechas (`from`/`to` con selector de fecha, `YYYY-MM-DD`), distancia (1/3/5/10 km, requiere ubicación). Contador de filtros activos y «Limpiar». |
| RF-04 | Ubicación con `expo-location` (permiso al usarse); si se niega, el filtro de distancia se oculta y el resto funciona. La distancia se muestra como «a ~2 km» (nunca coordenadas). |
| RF-05 | Los filtros y la consulta viven en la URL de la ruta (`useLocalSearchParams`) para conservar estado al volver del detalle. |
| RF-06 | Estados: carga inicial (esqueleto), vacío con sugerencia de limpiar filtros, error con reintento, «cargando más» al final. |
| RF-07 | Tocar una tarjeta abre `objeto/[id]` (005). |
| RF-08 | Mientras escribo, se cancela la petición anterior (sin respuestas fuera de orden). |
| RNF-01 | Desplazamiento fluido en 100 resultados (`FlatList` con `keyExtractor`, tarjetas ligeras). |
| RNF-02 | Cobertura ≥ 80 % en el *hook* de búsqueda y en el estado de filtros. |

## 4. Criterios de aceptación
| ID | Dado / Cuando / Entonces |
|---|---|
| CA-01 | Dada la pestaña Explorar sin filtros, entonces veo objetos recientes. |
| CA-02 | Dado «taladro», entonces la lista cambia tras el *debounce* y una sola petición sale. |
| CA-03 | Dado un rango de fechas, entonces solo aparecen objetos disponibles. |
| CA-04 | Dado el permiso de ubicación negado, entonces no veo el filtro de distancia y puedo seguir buscando. |
| CA-05 | Dado que entro al detalle y regreso, entonces conservo texto, filtros y posición. |
| CA-06 | Dada una búsqueda sin resultados, entonces veo el vacío con «Limpiar filtros». |

## 5. Fuera de alcance
Mapa, búsquedas guardadas, historial, ordenar por precio, sugerencias al escribir.

## 6. Preguntas abiertas
- [NEEDS CLARIFICATION: ¿Se muestra la distancia aproximada en tarjetas? Provisional: sí, redondeada a 1 km.]
