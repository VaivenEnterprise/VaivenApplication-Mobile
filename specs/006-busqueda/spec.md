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
| RF-09 | **Búsqueda por problema:** al escribir, el texto se compara en el teléfono (sin red) con el **catálogo de proyectos** (`matchProjects`, ignora mayúsculas y acentos); si coincide, arriba de los resultados aparece una tarjeta de proyecto que abre `proyecto/[id]` (007). Ej.: «necesito colgar un cuadro» → proyecto «Colgar un cuadro». |
| RF-10 | **Inicio de Explorar** (sin texto ni filtros): recomendados (*slot* `renderTopSections`, 015), «Proyectos populares» y «Cerca de ti» (recientes). |
| RF-11 | Las pantallas siguen el diseño de §7. |
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
| CA-07 | Dado «necesito colgar un cuadro», entonces veo la tarjeta del proyecto «Colgar un cuadro» y, al tocarla, abro su pantalla. |
| CA-08 | Dado Explorar sin texto ni filtros, entonces veo «Proyectos populares» y «Cerca de ti». |

## 5. Fuera de alcance
Mapa de resultados (el mapa del vecindario vive en el proyecto, spec 007), búsquedas guardadas, historial, ordenar por precio, sugerencias al escribir.

## 6. Preguntas abiertas
- [NEEDS CLARIFICATION: ¿Se muestra la distancia aproximada en tarjetas? Provisional: sí, redondeada a 1 km.]
- [DECIDIDO 9 nov 2026] El catálogo de proyectos (títulos, herramientas y pasos) va **empaquetado en la app** (`features/projects`, textos en `i18n/projects.ts`), con 4 proyectos iniciales: colgar un cuadro, armar un mueble, podar el jardín y repisa flotante. No requiere contrato nuevo ni al backend. Cambiarlo a backend después solo sustituye el origen de `catalog.ts`; las pantallas no cambian.

## 7. Diseño de pantallas

Lenguaje y reglas generales: spec 002 §9. Textos desde `src/i18n/search.ts` y `projects.ts`.

### 7.1 Explorar (`(tabs)/explorar`)
- **Parte fija:** `SearchBar` con el texto «¿Qué necesitas?» y, a la derecha, botón de filtros (ícono de controles) con insignia del número de filtros activos. Debajo, chips de categoría desplazables; el primero es «Todo».
- **Sin texto ni filtros:**
  1. *Slot* `renderTopSections` → «Recomendado para ti» (015).
  2. «Proyectos populares»: fila horizontal de `ProjectCard`.
  3. «Cerca de ti»: cuadrícula de 2 columnas de `ItemCard` `grid` con desplazamiento infinito.
- **Con texto o filtros:** cuadrícula de resultados. Si el texto coincide con un proyecto (RF-09), `ProjectCard` ancha primero, con la etiqueta «Proyecto» y «3 herramientas ›».
- **`ItemCard` `grid`:** foto 4:3 con radio `lg`, título de una línea, precio («$90 /día» o `Chip` «Gratis») y una línea pequeña «~1 km · ★ 4.9». Sin descripción.
- **Estados:** `Skeleton` de cuadrícula · vacío con lupa, «Nada por aquí» y botón «Limpiar filtros» · error con reintento · cargando más con indicador pequeño.

### 7.2 Filtros (`BottomSheet`)
Categoría (chips) · Modalidad (`SegmentedControl` «Todo · Préstamo · Renta») · Distancia (chips 1 · 3 · 5 · 10 km; oculto sin permiso de ubicación) · Fechas (dos campos «Desde» y «Hasta») · Municipio. Pie fijo: `link` «Limpiar» y `Button` «Ver resultados».

### 7.3 Tarjetas de proyecto (`ProjectCard`)
Variantes `hero` (alto 160), `compact` (112) y `wide`. Fondo de degradado `slotWarm` o `slotGreen` con el ícono del proyecto (sin fotos remotas hasta contar con ilustraciones), título y un `Chip` con el número de herramientas. Tocar abre `proyecto/[id]`.
