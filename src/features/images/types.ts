// Tipos públicos del módulo de imágenes (spec 004, plan §2). La app solo conserva el
// `publicId`: las URL de lectura las calcula el backend (P-05).

/** Finalidad de la foto: pública (`item_photo`) o privada (`evidence`). */
export type Purpose = 'item_photo' | 'evidence';

/** Referencia a una imagen ya subida; es lo que reciben las demás rutas de la API. */
export type ImageRef = { publicId: string };

/** Imagen tal como la devuelve la API (URL de lectura ya calculadas). */
export type RemoteImageData = { publicId: string; url: string; thumbUrl: string };

/** Foto elegida en el dispositivo, antes de reducirla y subirla. */
export type LocalImage = { uri: string; width: number; height: number };

/** `idle` aún no sube; `uploading` en curso; `done` con referencia; `error` se puede reintentar. */
export type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

export type UploadErrorCode =
  | 'signature'
  | 'upload'
  | 'rate_limited'
  | 'too_large'
  | 'invalid_format'
  | 'resize'
  | 'unexpected';
