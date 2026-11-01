# Plan 015 — Recomendaciones con ML (móvil)

- **Spec:** `spec.md` · **Dueño:** MO-B

## 1. Archivos
```
src/features/recommendations/{types.ts, keys.ts, api.ts, hooks.ts, components/{RecommendedRow,RecommendedCard}.tsx, index.ts}
src/i18n/recommendations.ts · src/i18n/index.ts (una línea)
Usos por slot: ExploreScreen.renderTopSections (006) · ItemDetailScreen.renderEffects (005) · Perfil renderExtraRows (003)
docs/play/cumplimiento.md · landing: privacidad
```

## 2. Decisiones
| # | Decisión | Art. |
|---|---|---|
| P-01 | `useQuery` con `staleTime` de 5 min; errores no se muestran | — |
| P-02 | El evento `view` se envía una vez por apertura con `useEffect` y se ignora si falla | — |
| P-03 | Ninguna pantalla ajena se edita: todo entra por *slots* | XIII |
| P-04 | Reutiliza `RemoteImage` (004) y el formateo de dinero de 005 | XIII |

## 3. Pruebas
Hook y componentes con API simulada; evento único; borrado con confirmación; apagado y error.

## 4. Verificación de constitución
| Art. | Cumple |
|---|---|
| II | Sin dependencias nuevas |
| VI | Declarado en privacidad; borrado disponible |
| XIII | Carpeta propia, i18n propio, *slots* |
