# Tareas 014 — Sugerencias con IA (móvil)

- **Dueño:** MO-A (T006 de MO-B) · **Estado:** en curso (T001–T005 hechas el 2026-11-20; T006 trasladada a la landing; T007 parcial; T008 hecha) · `[P]` = paralelizable
- Se ejecuta **después** del congelamiento de la 1.0 (22 nov).

- [x] **T001** [P] Tipos, claves y textos
  - Archivos: `src/features/ai-suggestions/{types.ts, keys.ts}`, `src/i18n/aiSuggestions.ts`, `src/i18n/index.ts` (una línea)
  - Agente: `dev-expo` · Depende de: 005-T001
  - Aceptación: tipos `ListingSuggestion { title, category, description? }`; textos de botón, aviso, errores y límite
  - Refs: RF-01, RF-04
  - Hecho (2026-11-20, Claude como `dev-expo`): `types.ts` (`ListingSuggestion` con `category` y `description` **opcionales** porque el contrato las omite si no son válidas; `aiFeaturesSchema` para `/meta`), `keys.ts`, `src/i18n/aiSuggestions.ts` y la línea en `es-MX.ts` (el plan decía `i18n/index.ts`; el archivo real es `es-MX.ts`, más su prueba de secciones). Ícono `sparkles` agregado a `AppIcon`.

- [x] **T002** API y hook `useListingSuggestion`
  - Archivos: `src/features/ai-suggestions/{api.ts, useListingSuggestion.ts, useListingSuggestion.test.ts}`
  - Agente: `dev-expo` · Depende de: T001, 014-T001 (backend, contrato)
  - Aceptación: llama al endpoint con el `publicId`; estados cargando/éxito/error/límite; cancelable; sin reintentos automáticos; lee `features.aiSuggestions` de `/meta`
  - Refs: RF-02, RF-04 · P-01
  - Hecho (2026-11-20, Claude como `dev-expo` y `qa-mobile`): `api.ts` (`GET /meta`, `POST /ai/listing-suggestions` solo con `imagePublicId`), `useAiSuggestionsEnabled` y `useListingSuggestion` (`idle`/`loading`/`success`/`error`/`limit`; 429 = límite; sin reintentos; cancela y aborta al desmontar). 22 pruebas; hook al 100 %.

- [x] **T003** Componente `SuggestionBanner`
  - Archivos: `src/features/ai-suggestions/components/{SuggestionBanner.tsx, SuggestionBanner.test.tsx}`, `src/features/ai-suggestions/index.ts`
  - Agente: `dev-expo` · Depende de: T002, 002-T015
  - Aceptación: botón «Sugerir con IA» con aviso; tarjeta con **Usar / Editar / Descartar**; accesible; CA-01, CA-02 · Diseño: spec §7.2
  - Refs: RF-01, RF-03, RNF-01 · P-03
  - Hecho (2026-11-20, Claude como `dev-expo`): `SuggestionBanner` (botón + aviso, carga con cancelar, resultado con Usar/Editar/Descartar, error con Reintentar, límite). 12 pruebas. **Desviaciones de §7:** ver D-209 en `memoria.md` (Editar no puede dejar el foco en el título por el *slot*; `Button` sin tamaño pequeño).

- [x] **T004** Integración en el formulario por *slot*
  - Archivos: `src/features/ai-suggestions/index.ts` (exporta `renderFormExtras`), una línea de uso en el formulario de 005
  - Agente: `dev-expo` · Depende de: T003, 005-T007
  - Aceptación: aparece solo con la IA activa y al menos una foto `item_photo`; usar rellena título y categoría validada contra las categorías (P-02); CA-03
  - Refs: RF-02, RF-05 · P-02, P-04
  - Hecho (2026-11-20, Claude como `dev-expo`): `renderFormExtras` en `index.ts`, contenedor `components/ListingSuggestionExtras.tsx` (archivo no listado: `index.ts` no puede llevar hooks ni JSX; ver D-210) y una línea en `src/app/(tabs)/mis-objetos/nuevo.tsx`. La portada (`photos[0]`) es la foto que se envía; la categoría solo se aplica si existe en `GET /categories`. `ItemFormScreen` sin cambios.

- [x] **T005** Prueba del flujo
  - Archivos: `src/features/ai-suggestions/flow.test.tsx`
  - Agente: `qa-mobile` · Depende de: T004
  - Aceptación: CA-01 a CA-04 con la API simulada; el formulario sigue funcionando con la IA caída
  - Refs: RNF-01
  - Hecho (2026-11-20, Claude como `qa-mobile`): `flow.test.tsx` con el formulario real de 005 y la API simulada: 17 pruebas (CA-01 a CA-04, no pide nada solo, IA apagada/sin `features`/`/meta` caído, sin fotos, categoría inválida, cancelación sin resultado tardío, publicar con la IA caída).

- ~~**T006** Cumplimiento: privacidad y Seguridad de datos (**MO-B**)~~ **Trasladada (2026-11-20, decisión de la persona responsable):** se ejecuta y se cierra en `vaiven-landing-page` con sus propias specs, no en esta. Aquí no cuenta como pendiente. (Se conserva la numeración para no renumerar T007 y T008.) El texto de privacidad y las filas de `docs/play/cumplimiento.md` que se adelantaron el 2026-11-20 quedan como referencia para esa spec y para la persona que llena «Seguridad de los datos» en Play Console antes de subir la v1.1.
- [ ] **T007** Versión 1.1 y revisión
  - Archivos: `app.config.ts` (`version: 1.1.0`), `memoria.md` (solo anexar)
  - Agente: `revisor-constitucion` · Depende de: T005 (y de la privacidad en la landing, que ya no es tarea de esta spec)
  - Aceptación: AAB 1.1 subido a la prueba cerrada (~2 dic) y a producción cuando la 1.0 esté aprobada; **CONFORME**
  - Refs: DoD
  - **Parcial (2026-11-20, Claude como `revisor-constitucion`):** `app.config.ts` con `version: '1.1.0'` y revisión estática de conformidad en `memoria.md` (**CONFORME con observaciones**). **Actualización 2026-11-20:** la persona aprobó el `eas build`; desde la sesión no se pudo ejecutar (sin `eas-cli`, sin acceso a expo.dev ni sesión de Expo) y `eas.json` ya apunta a **producción** en `preview` y `production` (decisión de la persona). Los comandos están en `memoria.md`. **Falta (humano):** `eas build` del AAB 1.1, subirlo a la prueba cerrada (~2 dic) y a producción cuando la 1.0 esté aprobada; depende además de T006. **Sin marcar.**

- [x] **T008** Verificación en Expo Go contra staging
  - Archivos: `memoria.md` (solo anexar), `docs/evidencia/014/` (capturas)
  - Agente: `probador-expo` · Depende de: T007 (y todas las anteriores `[x]`) y backend 014-T009 **desplegada**
  - Aceptación: `npm run typecheck && npm run lint && npm test` en verde; con `EXPO_PUBLIC_API_URL` de staging y `EXPO_UNSTABLE_MCP_SERVER=1`, la app abre en Expo Go y se recorren los criterios de aceptación (CA-xx) de esta spec, con capturas tomadas por el MCP `expo`; lo que Expo Go no permita probar (p. ej. push remoto en Android) se anota en `memoria.md` como no verificable. **La spec siguiente no empieza hasta que esta tarea pase.** · **MCP de Expo opcional (decisión 9 nov):** se verifica a mano o con Claude en Expo Go contra el **backend local**; el staging queda para cuando exista
  - Refs: Art. XIV.4
  - **Hecho (2026-11-20, Claude como `probador-expo`, cierre por indicación de la persona):** la persona probó la app en Expo Go contra staging (IA encendida) y confirma que funciona. Evidencia: `docs/evidencia/014/01-ca01-sugerencia-con-ia.png` (CA-01: foto subida, tarjeta «Sugerencia» con título, categoría y las acciones Usar, Editar y Descartar). No hay capturas ni registro por criterio de CA-02 a CA-04; cierre basado en su palabra para ellos. T007 (AAB 1.1) sigue abierta.

| Total | 7 tareas (T006 trasladada a la landing) |
|---|---|
