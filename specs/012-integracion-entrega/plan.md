# Plan 012 — Integración, pulido y entrega (móvil)

- **Spec:** `spec.md`

## 1. Archivos
```
src/features/connectivity/{useOnline.ts, OfflineBanner.tsx, tests}     # banner global
src/app/_layout.tsx (una línea: <OfflineBanner />)
assets/{icon.png, adaptive-icon.png, splash.png}  ·  app.config.ts (iconos y splash)
src/theme/tokens.ts (colores de marca, si se definen)
src/__e2e__/journey.integration.test.tsx                               # Jest, red simulada
docs/{validacion.md, demo.md, accesibilidad.md, seguridad.md}
README.md (actualizar) · docs/entorno-local.md (actualizar)
```

## 2. Decisiones
| # | Decisión | Art. |
|---|---|---|
| P-01 | Conectividad sin `@react-native-community/netinfo` (no aprobada): `useOnline` combina fallos de red del cliente de API, `AppState` y un `GET /healthz` con *backoff* | II.4 |
| P-02 | `OfflineBanner` se muestra encima de las pestañas; no bloquea la interacción | X |
| P-03 | Lista de comprobación de estados por pantalla en `docs/validacion.md` (carga / vacío / error / reintento) | X |
| P-04 | Accesibilidad: pasada con `accessibilityLabel`, `accessibilityRole`, tamaño mínimo de toque en componentes base, no solo color para estados | X |
| P-05 | La prueba E2E de Jest monta la app con dobles de `fetch` por ruta del contrato y recorre solicitud → aceptación → entrega (con `qr.ts` real) → devolución → calificación | VII |
| P-06 | Verificación final en Expo Go contra el staging final, en 2 teléfonos; evidencia en `docs/evidencia/012/` | XIV |
| P-07 | Revisión de seguridad como lista de comprobación fechada en `docs/seguridad.md` | VI |

## 3. Orden de trabajo (4 días)
| Día | Foco |
|---|---|
| 12 nov | Banner de conexión, pasada de estados vacío/error, E2E de Jest |
| 13 nov | Accesibilidad, íconos y splash, primera verificación en Expo Go en 2 teléfonos |
| 14 nov | Recorrido manual completo y correcciones; revisión de seguridad |
| 15 nov | Documentación, verificación final, congelar código |

## 4. Pruebas
La E2E de Jest; pruebas unitarias del banner y del hook de conectividad; verificación manual documentada.

## 5. Verificación de constitución
| Art. | Cumple |
|---|---|
| II.4 | Sin dependencias nuevas |
| VI | Revisión de seguridad documentada |
| VII | E2E de Jest y cobertura global |
| X | Estados y accesibilidad revisados |
| XIII | Cambios en archivos ajenos solo por defecto detectado y con su dueño |
