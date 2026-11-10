# Plan 004 — Imágenes (móvil)

- **Spec:** `spec.md` · **Dueño:** MO-B · **Contrato:** `backend/api/paths/uploads.yaml`

## 1. Estructura
```
src/features/images/
  api.ts (firma) · cloudinary.ts (subida con FormData) · resize.ts · types.ts · keys.ts
  useImageUpload.ts · usePickImages.ts
  components/{PhotoPicker.tsx, RemoteImage.tsx, UploadProgress.tsx}
src/i18n/images.ts (+ reexport)
```

## 2. Contrato consumido
`POST /api/v1/uploads/signature` `{purpose:"item_photo"|"evidence"}` → `{ uploadUrl, apiKey, timestamp, signature, publicId, type:"upload"|"authenticated", allowedFormats }`.
La subida es `POST uploadUrl` multipart con `file`, `api_key`, `timestamp`, `signature`, `public_id`, `type`, `allowed_formats` → respuesta de Cloudinary `{ public_id, width, height, format, bytes }`. La app solo conserva `{ publicId }` y lo envía a la API; las URL de lectura (`url`, `thumbUrl`) las calcula el backend.

## 3. Decisiones
| # | Decisión | Art. |
|---|---|---|
| P-01 | La subida usa `fetch` + `FormData` a Cloudinary, sin SDK | II.4 |
| P-02 | Una firma por imagen (más simple y revocable) | VI |
| P-03 | Redimensionado con `expo-image-manipulator` antes de pedir la firma, para fallar temprano | — |
| P-04 | Estado de subida por imagen: `idle/uploading/done/error` con progreso | X |
| P-05 | `RemoteImage` recibe `thumbUrl` o `url` ya calculadas por la API (la app no construye URL ni conoce el *cloud name*) | VI |
| P-06 | Evidencia: `RemoteImage` con `cachePolicy="none"` y URL firmada | VI |

## 4. Pruebas
Redimensionado (dimensiones esperadas, con doble), `useImageUpload` (firma → subida → referencia; fallo y reintento), `PhotoPicker` (límite, quitar, reordenar), permisos negados, `RemoteImage` (URL construida).

## 5. Verificación de constitución
| Art. | Cumple |
|---|---|
| II.4 | Usa solo `expo-image-picker`, `expo-image-manipulator`, `expo-image` aprobadas |
| VI | Sin secretos; evidencia sin caché persistente |
| X | Componentes reutilizables con tokens |
| XIII | i18n y claves por feature |


## Notas de implementación (2026-11-10)

- `ImageRef` es solo `{ publicId }` (tareas T001 y plan §2); el RF-03 de la spec menciona también `width/height/format/bytes`, pero el backend los verifica por su cuenta y la app no los necesita.
- La firma trae un campo `overwrite` (`'false'`) que va firmado y debe reenviarse como `overwrite` en la subida (contrato `uploads.yaml`); el plan no lo mencionaba.
- La subida usa `XMLHttpRequest` con `FormData` (sin SDK) en lugar de `fetch`, porque `fetch` no informa el avance (RF-03, T004). Ver memoria D-143.
- `PhotoPicker` recibe el resultado de `useImageUpload` (`uploader`) en lugar de crearlo por dentro, para que el formulario lea `refs` e `isUploading`.
- Máximo por defecto: 5 fotos (contrato: máximo 5 por recurso); la pregunta abierta de la spec (6) queda cerrada así.
- Los textos se reexportan en `src/i18n/es-MX.ts` (no en `index.ts`), igual que en la spec 003 (D-137).
