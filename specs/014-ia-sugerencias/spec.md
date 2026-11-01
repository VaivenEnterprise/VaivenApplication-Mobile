# Spec 014 — Sugerencias con IA al publicar (móvil)

- **Dueño:** MO-A (con MO-B en cumplimiento) · **Prioridad:** P1 · **Ventana:** 16–24 nov · **Depende de:** 004, 005 (móvil), contrato 014 (backend)
- **Constitución:** v1.2.0 · **Estado:** Borrador

## 1. Objetivo y por qué
Mostrar, en el formulario de publicar, una sugerencia de **título y categoría** calculada a partir de la primera foto, que la persona puede aceptar, editar o descartar. Es la función de IA del documento de idea, parte de la v1.1 y requisito de la entrega oficial del 1–4 dic.

## 2. Historias
| # | Prio. | Historia |
|---|---|---|
| H-01 | P1 | Como persona que publica, quiero tocar «Sugerir con IA» tras subir una foto, para ahorrar escritura. |
| H-02 | P1 | Como persona que publica, quiero ver claro que es una sugerencia y poder editarla o descartarla. |
| H-03 | P1 | Como persona usuaria, quiero que la app funcione igual si la IA no está disponible. |

## 3. Requisitos
| ID | Requisito |
|---|---|
| RF-01 | La sugerencia **nunca** se aplica sola: botón explícito «Sugerir con IA» (no automático), con aviso breve de que la foto se enviará a un servicio de IA. |
| RF-02 | Solo aparece si `GET /api/v1/meta` trae `features.aiSuggestions = true` y hay al menos una foto subida del tipo `item_photo`. |
| RF-03 | Muestra título y categoría sugeridos con las acciones **Usar**, **Editar** y **Descartar**; usar rellena los campos del formulario sin enviar nada. |
| RF-04 | Estados de carga (con cancelación), error y límite diario con mensajes en español; el formulario sigue plenamente utilizable. |
| RF-05 | Se integra mediante el *slot* `renderFormExtras` del formulario (spec 005 T007); no se edita `ItemFormScreen`. |
| RF-06 | **Cumplimiento:** el aviso de privacidad de la landing y «Seguridad de datos» de Play Console se actualizan para declarar que la foto se envía a un proveedor de IA a petición de la persona (tarea de MO-B). |
| RNF-01 | Accesible (etiquetas, foco); sin dependencias nuevas. |

## 4. Criterios de aceptación
| ID | Dado / Cuando / Entonces |
|---|---|
| CA-01 | Dada una foto subida y la IA activa, al tocar el botón se muestra una sugerencia con título y categoría. |
| CA-02 | Dada una sugerencia, «Usar» rellena título y categoría y la persona puede cambiarlos antes de publicar. |
| CA-03 | Dada la IA apagada o caída, no aparece el botón o se muestra un error recuperable y se puede publicar igual. |
| CA-04 | Dado el límite diario, se muestra el mensaje correspondiente. |
| CA-05 | Dada la privacidad publicada, menciona el uso de IA y coincide con «Seguridad de datos» (RF-06). |

## 5. Fuera de alcance
Descripciones largas generadas, IA fuera del formulario de publicar, sugerencias sin acción de la persona.

## 6. Preguntas abiertas
- [NEEDS CLARIFICATION: textos finales del aviso de «se enviará a un servicio de IA» (provisional: breve y en español claro).]
