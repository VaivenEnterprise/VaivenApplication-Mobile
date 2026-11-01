# Plan 014 — Sugerencias con IA (móvil)

- **Spec:** `spec.md` · **Dueño:** MO-A

## 1. Archivos
```
src/features/ai-suggestions/{types.ts, keys.ts, api.ts, useListingSuggestion.ts, components/SuggestionBanner.tsx, index.ts}
src/i18n/aiSuggestions.ts · src/i18n/index.ts (una línea)
Uso: ItemFormScreen → renderFormExtras (spec 005)
docs/play/cumplimiento.md · landing: privacidad (tarea de MO-B)
```

## 2. Decisiones
| # | Decisión | Art. |
|---|---|---|
| P-01 | Hook con TanStack Query (`useMutation`); sin reintentos automáticos (cuestan cuota) | — |
| P-02 | La categoría se valida contra `GET /categories` (spec 005); si no existe, no se aplica | — |
| P-03 | Botón explícito, nunca automático; aviso de privacidad en la propia tarjeta | VI |
| P-04 | Sin cambios en `ItemFormScreen`: se usa el *slot* | XIII |

## 3. Pruebas
Hook y componente con la API simulada; estados de carga, error, límite y apagado; accesibilidad básica.

## 4. Verificación de constitución
| Art. | Cumple |
|---|---|
| II | Sin dependencias nuevas |
| VI | La foto solo se envía por acción explícita |
| XIII | Carpeta propia, i18n propio, *slot* |
