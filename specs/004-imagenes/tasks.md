# Tareas 004 — Imágenes (móvil)

- **Dueño:** MO-B · **Estado:** T001–T009 hechas (2026-11-10); T010 diferida a la spec 005 por decisión de la persona · `[P]` = paralelizable

- [x] **T001** [P] Tipos y textos
  - Archivos: `src/features/images/{types.ts, keys.ts}`, `src/i18n/images.ts`, `src/i18n/index.ts` (una línea)
  - Agente: `dev-expo` · Depende de: 002-T007
  - Aceptación: `ImageRef { publicId }`, `RemoteImageData { publicId, url, thumbUrl }`, `Purpose = 'item_photo'|'evidence'`; textos de permisos y errores
  - Refs: P-05

- [x] **T002** [P] Redimensionado
  - Archivos: `src/features/images/resize.ts`, `src/features/images/resize.test.ts`
  - Agente: `dev-expo` · Depende de: 002-T024
  - Aceptación: lado mayor ≤ 1600 px, JPEG ≈ 0.8, mantiene proporción (CA-01); prueba con doble de `expo-image-manipulator`
  - Refs: RF-02

- [x] **T003** API de firma y subida a Cloudinary
  - Archivos: `src/features/images/{api.ts, cloudinary.ts, api.test.ts}`
  - Agente: `dev-expo` · Depende de: T001, 002-T011, 004-T001 (backend, contrato)
  - Aceptación: pide firma; sube con `FormData`; devuelve `ImageRef`; errores tipados; ningún secreto en la app (RF-07)
  - Refs: RF-03, RF-07

- [x] **T004** Hook `useImageUpload`
  - Archivos: `src/features/images/useImageUpload.ts`, `src/features/images/useImageUpload.test.ts`
  - Agente: `dev-expo` · Depende de: T002, T003
  - Aceptación: cola con estado por imagen y progreso; reintento sin repetir la selección (CA-02); cancelación al desmontar
  - Refs: RF-03, RF-04

- [x] **T005** Hook de selección con permisos
  - Archivos: `src/features/images/usePickImages.ts`, `src/features/images/usePickImages.test.ts`
  - Agente: `dev-expo` · Depende de: T001
  - Aceptación: cámara y galería; permisos negados → estado `denied` con acción a Ajustes (CA-03); límite configurable
  - Refs: RF-01, RF-06

- [x] **T006** Componente `PhotoPicker`
  - Archivos: `src/features/images/components/{PhotoPicker.tsx, UploadProgress.tsx}`, `PhotoPicker.test.tsx`
  - Agente: `dev-expo` · Depende de: T004, T005, 002-T015
  - Aceptación: vista previa, quitar, mover al inicio, progreso y error por foto, bloqueo al llegar al límite (CA-05); accesible · Diseño: spec §7.1
  - Refs: RF-01, RF-04

- [x] **T007** Componente `RemoteImage`
  - Archivos: `src/features/images/components/RemoteImage.tsx`, `RemoteImage.test.tsx`
  - Agente: `dev-expo` · Depende de: T001
  - Aceptación: `expo-image` con *placeholder* y error; usa `thumbUrl` o `url` según `variant` (CA-04); evidencia sin caché persistente · Diseño: spec §7.2
  - Refs: RF-05 · P-06

- [x] **T008** Exportar la API pública del módulo
  - Archivos: `src/features/images/index.ts`, `src/features/images/README.md`
  - Agente: `dev-expo` · Depende de: T006, T007
  - Aceptación: `index.ts` exporta `PhotoPicker`, `RemoteImage`, `useImageUpload`, tipos; README con un ejemplo de uso para 005 y 009
  - Refs: Art. XIII

- [x] **T009** Memoria y revisión
  - Archivos: `memoria.md` (solo anexar)
  - Agente: `revisor-constitucion` · Depende de: T008
  - Aceptación: **CONFORME**; se avisa a MO-A que `PhotoPicker`/`RemoteImage` están listos para 005
  - Estado (2026-11-10): revisión de conformidad hecha (veredicto en `memoria.md`, sección «Spec 004»). Cerrada por indicación de la persona; el aviso a MO-A queda a cargo de ella.
  - Refs: DoD

- [ ] **T010** Verificación en Expo Go contra staging
  - Archivos: `memoria.md` (solo anexar), `docs/evidencia/004/` (capturas)
  - Agente: `probador-expo` · Depende de: T009 (y todas las anteriores `[x]`) y backend 004-T011 **desplegada**
  - Aceptación: `npm run typecheck && npm run lint && npm test` en verde; con `EXPO_PUBLIC_API_URL` de staging y `EXPO_UNSTABLE_MCP_SERVER=1`, la app abre en Expo Go y se recorren los criterios de aceptación (CA-xx) de esta spec, con capturas tomadas por el MCP `expo`; lo que Expo Go no permita probar (p. ej. push remoto en Android) se anota en `memoria.md` como no verificable. **La spec siguiente no empieza hasta que esta tarea pase.** · **MCP de Expo opcional (decisión 9 nov):** se verifica a mano o con Claude en Expo Go contra el **backend local**; el staging queda para cuando exista
  - Estado (2026-11-10): **NO ejecutada.** Por decisión de la persona se difiere a la spec 005: se probará con el formulario real de publicar objeto (no se crea pantalla temporal). Checklist en `memoria.md`; evidencia en `docs/evidencia/004/`. Se marca `[x]` cuando se verifique en Expo Go.
  - Refs: Art. XIV.4

| Total | 10 tareas |
|---|---|
