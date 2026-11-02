# Plan 013 — Publicación en Google Play (móvil)

- **Spec:** `spec.md` · **Dueño:** MO-B + administrador

## 1. Archivos
```
eas.json (perfil production) · app.config.ts (version, versionCode)
assets/store/{icon-512.png, feature-1024x500.png, screenshots/*.png}
docs/play/{ficha.md, cumplimiento.md, testers.md, seguimiento.md, solicitud-produccion.md, lanzamiento.md}
```
Las carpetas `docs/play/` guardan **los textos para copiar a Play Console** y el registro de lo hecho; nada sensible (sin contraseñas ni claves).

## 2. Calendario
| Fecha | Qué |
|---|---|
| 2–3 nov | Confirmar la verificación de identidad y teléfono de la cuenta de Play (la cuenta ya está comprada); lista de testers (15–20) y mensaje de invitación |
| 2–8 nov | Textos y recursos de la ficha; landing L001 publicada (5 nov) |
| 6–9 nov | Primer AAB firmado (001–003) → prueba cerrada; invitar testers |
| **9 nov** | **Día 1 de 14** de la prueba cerrada |
| 10–22 nov | Actualizaciones por hito (H1 7 nov · H2 10 nov · H3 13 nov · H4 17 nov · H5 22 nov); día 14 = 22 nov |
| **23 nov** | AAB final (1.0, sin IA) y solicitud de producción |
| 24 nov–7 dic | Respuesta de Google; correcciones si pide cambios |
| 30 nov–7 dic (estimada) | Producción pública de la 1.0 |
| después | La IA (spec 014) sale como actualización v1.1 |

## 3. Decisiones
| # | Decisión | Art. |
|---|---|---|
| P-01 | Un solo `package` (`mx.vaiven.app`) para todas las pistas; perfiles `preview` (APK) y `production` (AAB); no hay perfil `development` (la app se prueba en Expo Go) | II |
| P-02 | El primer AAB (fecha en el calendario vigente del ROADMAP) es el esqueleto con inicio de sesión (001–003); Play solo necesita una versión instalable para abrir la prueba | — |
| P-03 | `versionCode` autoincremental en EAS; `version` semántica (`0.1.0` para la prueba, `1.0.0` para producción) | — |
| P-04 | La app de prueba apunta al **backend de producción** (backend 013) para que los testers usen el entorno real y los datos queden donde se publicará | IX |
| P-05 | Cuenta de revisión: creada a mano en producción, con datos ficticios y contraseña guardada solo en Play Console | VI |
| P-06 | Seguridad de datos se redacta a partir de las specs (lista de datos en la landing L001-T005) y se mantiene en `docs/play/cumplimiento.md` | VI |
| P-07 | Reportes de contenido y filtro de texto (spec 011) son requisitos de la política de contenido de usuarios; se citan en la ficha y en el formulario | — |
| P-08 | Despliegue en producción con **porcentaje progresivo** (p. ej. 20 % → 100 %) si Play lo permite, para poder pausar ante fallos | IX |

## 4. Pruebas
Lista de verificación previa a cada subida: `npm run check`, instalación del AAB en un teléfono real (vía enlace interno), inicio de sesión contra producción, enlaces de privacidad y eliminación de cuenta, permisos al usarse.

## 5. Verificación de constitución
| Art. | Cumple |
|---|---|
| II | Sin dependencias nuevas |
| VI | Sin secretos; datos declarados = datos recopilados |
| IX | Entorno de producción verificado con `/readyz` antes de publicar |
| XIII | Solo `eas.json`, `app.config.ts` y `docs/play/` (archivos de MO-B) |
