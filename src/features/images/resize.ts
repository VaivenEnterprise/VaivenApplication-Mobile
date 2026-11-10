import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { LocalImage } from '@/features/images/types';

/** Lado mayor máximo (px) y calidad JPEG de toda foto que sube la app (RF-02). */
export const MAX_SIDE = 1600;
export const JPEG_QUALITY = 0.8;

/** Tamaño destino: mantiene la proporción y nunca agranda. */
export function targetSize(width: number, height: number): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= MAX_SIDE) return { width, height };
  const scale = MAX_SIDE / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/**
 * Reduce la foto a ≤ 1600 px de lado mayor y la guarda como JPEG ≈ 0.8. Siempre recomprime,
 * aunque ya sea chica, para unificar el formato y el peso.
 */
export async function resizeImage(image: LocalImage): Promise<LocalImage> {
  const { width, height } = targetSize(image.width, image.height);
  const context = ImageManipulator.manipulate(image.uri);
  // Se pasa solo el lado que cambia; la otra medida se calcula sola y conserva la proporción.
  if (width !== image.width || height !== image.height) {
    context.resize(width >= height ? { width } : { height });
  }
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY });
  return { uri: saved.uri, width: saved.width, height: saved.height };
}
