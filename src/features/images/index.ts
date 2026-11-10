// API pública del módulo de imágenes (spec 004). Las demás features (005 objetos, 009 evidencia)
// importan solo desde aquí; nada fuera de este archivo debería tocar los internos.

export { PhotoPicker, DEFAULT_MAX_PHOTOS } from '@/features/images/components/PhotoPicker';
export { RemoteImage } from '@/features/images/components/RemoteImage';
export type { RemoteImageVariant } from '@/features/images/components/RemoteImage';
export { useImageUpload } from '@/features/images/useImageUpload';
export type { UploadItem } from '@/features/images/useImageUpload';
export type {
  ImageRef,
  LocalImage,
  Purpose,
  RemoteImageData,
  UploadErrorCode,
  UploadStatus,
} from '@/features/images/types';
