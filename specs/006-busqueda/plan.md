# Plan 006 — Búsqueda y exploración (móvil)

- **Spec:** `spec.md` · **Dueño:** MO-B · **Contrato:** `backend/api/paths/search.yaml` (`GET /items`)

## 1. Estructura
```
src/features/search/
  api.ts · types.ts · keys.ts · filters.ts (estado ↔ parámetros de URL ↔ query string)
  hooks.ts (useSearchItems, useDebouncedValue, useLocation)
  components/{SearchBar, CategoryChips, FilterSheet, DateRangeField, DistanceField, ResultsList}.tsx
  screens/ExploreScreen.tsx
src/app/(tabs)/explorar/index.tsx (reemplaza el marcador)
src/features/projects/{catalog.ts, match.ts, index.ts, components/{ProjectCard,PopularProjects}.tsx}   # catálogo empaquetado; lo reutilizan 003 (Inicio) y 007
src/i18n/{search.ts, projects.ts} (+ reexport)
```
Reutiliza `ItemCard` y `useCategories` de `features/items` mediante su `index.ts` (no se copian).

## 2. Contrato consumido
`GET /api/v1/items?q&category&modality&municipality&from&to&lat&lng&radiusKm&limit&cursor` → `{ items:[ItemCard], nextCursor }`, con `ItemCard = { id, title, category, modality, pricePerDayCents, zone, approxLocation|null, distanceKm|null, thumbUrl|null, photoCount, owner:{id,displayName,ratingAverage,ratingCount}, createdAt }`.

## 3. Decisiones
| # | Decisión | Art. |
|---|---|---|
| P-01 | El estado de filtros es la fuente de verdad en los *search params* de la ruta; `filters.ts` convierte en ambos sentidos y se prueba | X |
| P-02 | `queryKey` incluye todos los filtros; TanStack Query cancela la anterior con `signal` | IV |
| P-03 | *Debounce* solo para texto; los demás filtros disparan de inmediato | — |
| P-04 | Fechas en `YYYY-MM-DD`; el selector bloquea fechas pasadas y exige `from ≤ to` | V |
| P-05 | Si hay `lat/lng`, el servidor usa el modo geo; la app no calcula distancias | III |
| P-06 | Coordenadas del dispositivo solo viajan en la consulta, no se guardan | VI |
| P-07 | **Catálogo de proyectos empaquetado** en la app (provisional, spec §6): `catalog.ts` con `{ id, titleKey, keywords[], minutes, difficulty, tools[{ id, nameKey, query }], steps[{ id, titleKey, bodyKey, tipKey? }] }` y los textos en `i18n/projects.ts` | V, XIII |
| P-08 | `matchProjects(text)` es una función pura: normaliza (minúsculas, sin acentos, sin signos), separa en palabras y puntúa por coincidencia con `keywords` y título; devuelve hasta 2 proyectos con al menos una coincidencia. No usa red ni IA | III |
| P-09 | Las pantallas siguen la spec §7; `ItemCard` `grid` es el de 005 | VII |

## 4. Pruebas
`filters.ts` (ida y vuelta), `useSearchItems` (debounce, cancelación, paginación, errores), `FilterSheet` (aplicar/limpiar), `ExploreScreen` (estados: carga, vacío, error, más resultados), permiso de ubicación negado.

## 5. Verificación de constitución
| Art. | Cumple |
|---|---|
| IV | Cliente central, claves por feature |
| V | Fechas de calendario en `YYYY-MM-DD` |
| VI | Ubicación mínima y sin persistencia |
| X | Tokens, estados vacío/error/carga |
| XIII | Archivos propios de la feature |
