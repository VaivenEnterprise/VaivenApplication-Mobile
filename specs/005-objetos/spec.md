# Spec 005 — Objetos (móvil)

- **Dueño:** MO-A · **Prioridad:** P0 · **Ventana:** 8–10 nov · **Depende de:** 003, 004 (móvil) y contrato 005 (backend)
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
| RF-10 | Las pantallas Mis objetos, Publicar/Editar y Detalle siguen el diseño de §7 (poco texto, hojas inferiores, una acción principal por pantalla). |
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

## 7. Diseño de pantallas

Lenguaje y reglas generales: spec 002 §9. Valores solo desde *tokens*; textos desde `src/i18n/items.ts`.

### 7.1 Mis objetos (`(tabs)/mis-objetos`)
- **Encabezado:** «Mis objetos» (`title`) y botón circular «+» en `primary` (etiqueta «Publicar objeto»).
- **Filtro:** `SegmentedControl` «Todos · Activos · Pausados».
- **Lista:** `ItemCard` variante `row`: miniatura `thumbLg`, título (1 línea), precio («$90 /día» o «Gratis») y píldora de estado (Activo `secondarySoft` · Pausado `warning` · Bloqueado `danger` · Retirado `muted`). Tocar abre el detalle. Sin menús dentro de la fila.
- **Estados:** `Skeleton` de tres filas · vacío con ícono de caja, «Aún no publicas nada» y botón «Publicar mi primer objeto» · error con reintento · cargando más.

### 7.2 Publicar / Editar (`mis-objetos/nuevo` y `[id]/editar`)
Pantalla desplazable con «Volver» y título «Publicar objeto» (o «Editar objeto»). Barra inferior fija con un solo botón: «Publicar» (o «Guardar»). Secciones, cada una en una `Card` con solo ícono y etiqueta corta:
1. **Fotos:** fila horizontal de 5 casillas de 88 pt; la primera con «+» y contador «0/5», y la primera foto con la etiqueta «Portada». Subiendo: anillo de avance sobre la casilla. Falló: ícono de reintentar. Debajo, el *slot* `renderFormExtras` (botón de IA, 014).
2. **Título:** campo.
3. **Categoría:** chips desplazables (de `GET /categories`).
4. **Modalidad:** dos opciones grandes (`ModalityPicker`): «Préstamo» (ícono de mano, «Gratis») y «Renta» (ícono de moneda).
5. **Estado:** chips (`ConditionPicker`) con el estado físico.
6. **Precio** (solo renta): «Valor del objeto» con candado y «Privado» (`caption`), y «Precio por día»; al capturar el valor aparece el chip «Usar sugerido» (`secondarySoft`). En préstamo la sección no existe y el precio es $0.
7. **Zona:** «Municipio» y «Colonia», chip «Usar mi ubicación» con pin y una línea «Se muestra una zona aproximada».
8. **Más detalles** (cerrada por defecto): «Descripción» y «Reglas de uso».
Errores bajo cada campo; rechazo de moderación (`content_not_allowed`) con `ModerationNotice` (011) sobre el campo afectado. Si falla una subida, lo escrito se conserva.

### 7.3 Detalle del objeto (`objeto/[id]`)
- **Encabezado** sobre la galería: «Volver» y «⋯» (*slot* `renderOwnerExtras`: «Reportar», 011).
- **Galería:** tarjeta `xl` 4:3 con fotos deslizables y puntos de página; sin foto, fondo `slotWarm` con ícono.
- **Título** (`title`) y fila de chips: categoría, estado físico y modalidad.
- **Precio:** «$90» (`title`) con «/ día» (`caption`); si es préstamo, `Chip` `success` «Gratis».
- **`OwnerCard`:** `Avatar`, nombre, `RatingStars` y «4.9 (18)», con chevron hacia `usuario/[id]`.
- **Zona:** `Chip` con pin: «{colonia} · ~300 m». Nunca calle ni coordenadas.
- **Descripción** y **Reglas:** bloques de texto; las reglas se pliegan a 3 líneas con «Ver más».
- **Barra inferior fija:** *slot* `renderActions` → «Solicitar» (007). Si soy el dueño: fila «Valor» con candado y barra con «Editar» (`outline`) y «Pausar» o «Reanudar»; «Eliminar» está en «⋯» y abre una `BottomSheet` (ícono de papelera en `danger`, «¿Eliminar este objeto?», `danger` «Eliminar», `link` «Cancelar»).
- **Estados:** `Skeleton` de galería y líneas · error con reintento · objeto pausado: `Banner` `warning` «Pausado» (solo lo ve el dueño).
- **No se muestra** (el diseño de Stitch lo traía): «Identidad verificada»; Vaivén no garantiza identidad física (documento de idea).

## 6. Preguntas abiertas
- Categorías confirmadas (POL-14): se piden a `GET /categories`; no se escriben en la app.
- El valor declarado no se muestra a terceros (confirmado el 28 de oct).
