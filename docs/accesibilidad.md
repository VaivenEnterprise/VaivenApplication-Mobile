# Accesibilidad básica (spec 012, T004)

Objetivo: **WCAG 2.1 AA** en lo razonable para una app móvil (spec 012 §7.4). Este documento anota lo que el código ya cumple, lo que se comprobó por lectura y lo que **falta de verificar con un lector de pantalla** (TalkBack / VoiceOver), que no se pudo ejecutar.

## Lo que el código garantiza (por diseño y por pruebas)

| Criterio | Cómo se cumple | Dónde |
|---|---|---|
| Etiquetas y roles | Los componentes base (`Button`, `Banner`, campos) llevan `accessibilityRole` y `accessibilityLabel`; los textos salen de `src/i18n` (es-MX) | `src/components/ui/*` |
| Área de toque ≥ 44 pt | `sizes.touch.minSize` en `Button` y controles | `src/theme/tokens.ts` |
| Estado no solo por color | Los estados llevan texto («Sin conexión», «Pendiente», etc.) además del color; el indicador de carga tiene etiqueta | banner, tarjetas de estado |
| Contraste | Colores solo de `tokens.ts`; texto de la marca sobre fondos de la paleta | `src/theme/tokens.ts` |
| Mensajes | Errores en texto visible; el `Banner` urgente usa rol `alert` y región viva asertiva | `src/components/ui/Banner.tsx` |

## Auditoría de código (rol `dev-expo`, ejecutada 2026-11-15)

- **Controles táctiles:** todos los archivos con `Pressable`/`TouchableOpacity` fuera de pruebas declaran `accessibilityRole` y `accessibilityLabel`. Única excepción deliberada: la burbuja de mensaje del chat (`MessageBubble`), que es un mensaje (no un botón) con la acción de accesibilidad «Reportar»; su botón de reintentar sí lleva rol y etiqueta.
- **Imágenes:** las miniaturas dentro de tarjetas (`BookingCard`, `ItemCard`, `HomeItemTile`, `ChatHeader`) son decorativas porque la tarjeta que las contiene ya tiene su etiqueta, y llevan `accessibilityIgnoresInvertColors`. `RemoteImage` solo es accesible si se le da etiqueta.
- **Toque ≥ 44 pt:** `Button` usa `sizes.touch.minSize`; la búsqueda de dimensiones literales menores a 44 en componentes no encontró ninguna (el resto sale de `tokens.ts`).
- **Color:** no hay colores literales fuera de `src/theme` (búsqueda de `#RRGGBB` y `rgb()` sin resultados).
- **Hallazgos a corregir:** ninguno bloqueante.

## Pendiente de una persona (no ejecutado)

- Recorrer con TalkBack (Android) y VoiceOver (iOS) el flujo principal: inicio de sesión, solicitar, aceptar, QR, calificar.
- Medir el contraste real de cada par de colores de `tokens.ts` con una herramienta y anotarlo aquí.
- Probar con tamaño de letra del sistema al máximo: que no se corte ni se solape texto.

| Resultado | Pantalla | Detalle | Corrección |
|---|---|---|---|
| _pendiente_ | | | |

Los hallazgos de esta revisión se corrigen en la feature afectada (cada una por su dueño) y se anotan en la tabla.
