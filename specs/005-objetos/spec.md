# Spec 005 — Objetos (móvil)

- **Dueño:** MO-A · **Prioridad:** P0 · **Ventana:** 3–5 nov · **Depende de:** 003, 004 (móvil) y contrato 005 (backend)
- **Constitución:** v1.2.0 · **Estado:** Borrador

## 1. Objetivo y por qué
Que una persona pueda **publicar y administrar** los objetos que presta o renta, y que cualquiera pueda ver el **detalle** de un objeto. Sin objetos publicados no hay nada que buscar ni reservar.

## 2. Historias
| # | Prio. | Historia |
|---|---|---|
| H-01 | P0 | Como propietario, quiero publicar un objeto con fotos, descripción, estado, valor y precio, para ofrecerlo. |
| H-02 | P0 | Como propietario, quiero ver mis objetos y su estado, para administrarlos. |
| H-03 | P0 | Como persona usuaria, quiero ver el detalle de un objeto con fotos, precio, reglas y quién lo ofrece, para decidir. |
| H-04 | P1 | Como propietario, quiero editar, pausar, reanudar o eliminar un objeto. |
| H-05 | P1 | Como propietario, quiero una sugerencia de precio según el valor del objeto. |

## 3. Requisitos
| ID | Requisito |
|---|---|
| RF-01 | Pestaña **Mis objetos**: lista paginada (`GET /me/items`, `useInfiniteQuery`) con foto, título, precio, estado y filtro por estado; `EmptyState` con acción «Publicar mi primer objeto». |
| RF-02 | Formulario de **publicar/editar** (react-hook-form): título (3–80), descripción (≤ 1000), categoría (`GET /categories`), estado físico, modalidad (préstamo/renta), valor declarado, precio por día, reglas de uso (≤ 500), municipio y colonia, ubicación aproximada opcional y 1–5 fotos (`PhotoPicker`, `purpose: item_photo`). |
| RF-03 | Dinero capturado con `MoneyInput` en pesos y enviado en centavos enteros; préstamo fija precio $0 (campo deshabilitado). |
| RF-04 | **Sugerencia de precio**: al capturar el valor declarado, botón «Usar sugerido» consulta `GET /items/price-suggestion` y rellena el precio con `priceSource: suggested`; si la persona lo edita, pasa a `manual`. |
| RF-05 | Ubicación aproximada: botón «Usar mi ubicación» con `expo-location` (permiso al usarse); se envía `lat,lng` y la UI aclara que se mostrará una zona aproximada. Es opcional. |
| RF-06 | **Detalle del objeto** `objeto/[id]`: galería de fotos, título, categoría, estado físico, precio por día, descripción, reglas, zona, tarjeta del propietario (con acceso a su perfil) y botón «Solicitar» (lo conecta 007). Si soy el dueño, muestro valor declarado y acciones de administración. |
| RF-07 | Acciones de dueño: editar, pausar/reanudar, eliminar con confirmación; los errores 403/409 muestran mensaje claro. |
| RF-08 | El botón «Solicitar» y los datos del dueño se montan mediante *slots* para que 007 y 010 no editen este archivo. |
| RF-09 | La moderación (`400 content_not_allowed` con categoría y motivo) se muestra junto al campo o en un aviso. |
| RNF-01 | El formulario conserva lo escrito si la subida de fotos falla; sin pérdida al volver atrás (borrador en memoria de la sesión). |
| RNF-02 | Cobertura ≥ 80 % en esquemas, `MoneyInput` y formulario. |

## 4. Criterios de aceptación
| ID | Dado / Cuando / Entonces |
|---|---|
| CA-01 | Dado un formulario válido con 2 fotos, cuando publico, entonces el objeto aparece en Mis objetos como activo. |
| CA-02 | Dado «préstamo», entonces el precio es $0 y no editable. |
| CA-03 | Dado un valor declarado, cuando uso el sugerido, entonces el precio se rellena y se envía como `suggested`. |
| CA-04 | Dado un título prohibido, entonces veo el motivo en español y puedo corregirlo. |
| CA-05 | Dado que soy el dueño, entonces veo el valor declarado; si no, no aparece. |
| CA-06 | Dado un objeto pausado, cuando lo reanudo, entonces su estado cambia a activo. |

## 5. Fuera de alcance
Mapa interactivo, edición de fotos avanzada, objetos destacados, duplicar objeto.

## 6. Preguntas abiertas
- Categorías confirmadas (POL-14): se piden a `GET /categories`; no se escriben en la app.
- El valor declarado no se muestra a terceros (confirmado el 28 de oct).
