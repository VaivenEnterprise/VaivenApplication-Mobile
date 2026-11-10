# Plan 005 — Objetos (móvil)

- **Spec:** `spec.md` · **Dueño:** MO-A · **Contrato:** `backend/api/paths/items.yaml`

## 1. Estructura
```
src/features/items/
  api.ts · types.ts · schemas.ts · keys.ts · hooks.ts (useMyItems, useItem, useCategories, useCreateItem, …)
  components/{ItemCard.tsx, ItemStatusBadge.tsx, MoneyInput.tsx, ConditionPicker.tsx, ModalityPicker.tsx, PhotoGallery.tsx, OwnerCard.tsx}
  screens/{MyItemsScreen, ItemFormScreen, ItemDetailScreen}.tsx
src/app/(tabs)/mis-objetos/{index,nuevo,[id]/editar}.tsx  ·  src/app/objeto/[id].tsx (reemplaza el marcador)
src/i18n/items.ts (+ reexport)
src/lib/policy.ts (constantes de POL-xx que la app necesita: límites de fotos, precio mínimo…)
```
`ItemCard` y `PhotoGallery` los reutiliza 006 (`ItemCard` se exporta desde `src/features/items/index.ts`).

`ItemCard` tiene dos variantes: `grid` (Explorar y Proyectos) y `row` (Mis objetos).

## 2. Contrato consumido
`POST/GET/PATCH/DELETE /items`, `POST /items/{id}/pause|resume`, `GET /me/items`, `GET /items/price-suggestion`, `GET /categories`. Tipos `Item`, `ItemInput`, `ItemStatus` (`active|paused|blocked|removed`).

## 3. Decisiones
| # | Decisión | Art. |
|---|---|---|
| P-01 | `MoneyInput` trabaja en pesos para la persona y expone **centavos** al formulario (`toCents`/`fromCents` de 002-T008) | V |
| P-02 | Esquema de formulario con las mismas reglas que el backend (mensajes en `i18n/items.ts`); el servidor sigue siendo la autoridad | VI |
| P-03 | Mutaciones invalidan `itemsKeys.mine()` y `itemsKeys.detail(id)`; sin duplicar estado | IV |
| P-04 | Las fotos se suben **al elegirlas** (004) y el formulario guarda solo `publicId`; si se cancela, no se limpian en Cloudinary (fuera de alcance) | — |
| P-05 | `ItemDetailScreen` expone *slots* (`renderActions`, `renderOwnerExtras`) rellenados por 007 y 010 | XIII |
| P-06 | Ubicación: `expo-location` con precisión baja; se envía tal cual, el servidor redondea | VI |
| P-07 | Las pantallas siguen la spec §7. «Identidad verificada», valor declarado a terceros y ubicación exacta **no** se muestran | VI, VII |

## 4. Pruebas
Esquemas y conversión de dinero, `MoneyInput`, formulario (RNTL: validaciones, préstamo vs renta, sugerencia, error de moderación), lista (vacía, paginación, error), detalle (dueño vs tercero).

## 5. Verificación de constitución
| Art. | Cumple |
|---|---|
| IV | Cliente central; claves por feature |
| V | Dinero en centavos |
| X | Componentes con tokens, estados de carga/error/vacío |
| XIII | i18n y claves por feature; *slots* para evitar editar archivos ajenos |
