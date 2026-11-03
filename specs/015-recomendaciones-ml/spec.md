# Spec 015 — Recomendaciones con ML (móvil)

- **Dueño:** MO-B · **Prioridad:** P1 · **Ventana:** 23 nov–1 dic · **Depende de:** 005, 006 (móvil), contrato 015 (backend)
- **Constitución:** v1.2.0 · **Estado:** Borrador

## 1. Objetivo y por qué
Mostrar «Recomendado para ti» en Explorar, registrar las vistas que alimentan el modelo y dejar que la persona borre su historial. Es la cara móvil del ML requerido para la entrega oficial (1–4 dic).

## 2. Historias
| # | Prio. | Historia |
|---|---|---|
| H-01 | P1 | Como persona que busca, quiero ver una fila de objetos recomendados al abrir Explorar. |
| H-02 | P1 | Como persona usuaria, quiero ver por qué me recomiendan cada objeto. |
| H-03 | P1 | Como persona usuaria, quiero borrar mi historial de recomendaciones. |

## 3. Requisitos
| ID | Requisito |
|---|---|
| RF-01 | Fila horizontal «Recomendado para ti» en Explorar, mediante el *slot* `renderTopSections` (spec 006 T005), con tarjetas que muestran foto, título, tarifa y el motivo en una línea (p. ej. «Porque viste: Taladro Bosch»). |
| RF-02 | Solo aparece si `GET /api/v1/meta` trae `features.recommendations = true` y la respuesta tiene al menos un objeto. |
| RF-03 | Al abrir el detalle de un objeto ajeno se envía un evento `view` (una vez por apertura, en segundo plano, sin bloquear ni mostrar errores) mediante el *slot* `renderEffects` del detalle (spec 005 T008). |
| RF-04 | En Perfil, fila «Borrar mi historial de recomendaciones» con confirmación (*slot* `renderExtraRows` de 003). |
| RF-05 | Estados de carga con *skeleton*, vacío (la fila no se muestra) y error silencioso: Explorar nunca se bloquea por las recomendaciones. |
| RF-06 | Cumplimiento: el aviso de privacidad y «Seguridad de datos» de Play declaran que se guarda el historial de objetos vistos para recomendar, 90 días, con opción de borrado. |
| RNF-01 | Accesible; sin dependencias nuevas; consulta con caché breve (5 min). |

## 4. Criterios de aceptación
| ID | Dado / Cuando / Entonces |
|---|---|
| CA-01 | Dada una cuenta con historial, Explorar muestra la fila con motivos. |
| CA-02 | Dado un detalle abierto, se envía un solo evento y la pantalla no cambia. |
| CA-03 | Dado «Borrar historial», tras confirmar, la fila vuelve al arranque en frío. |
| CA-04 | Dada la función apagada o un error, Explorar funciona igual y no muestra la fila. |
| CA-05 | Dada la privacidad publicada, coincide con «Seguridad de datos». |

## 5. Fuera de alcance
Pantalla propia de recomendaciones, notificaciones, ajustes de preferencias avanzados.
