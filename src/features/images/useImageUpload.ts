import { useCallback, useEffect, useRef, useState } from 'react';
import { uploadImage } from '@/features/images/api';
import { ImageUploadError, UploadCancelledError } from '@/features/images/cloudinary';
import { resizeImage } from '@/features/images/resize';
import type {
  ImageRef,
  LocalImage,
  Purpose,
  UploadErrorCode,
  UploadStatus,
} from '@/features/images/types';

/** Cuántas fotos suben a la vez; el resto espera en cola (cuida datos y el límite de firmas). */
export const MAX_CONCURRENT_UPLOADS = 2;

export type UploadItem = {
  /** Identificador estable de la foto dentro del hook (sirve de `key`). */
  id: string;
  local: LocalImage;
  status: UploadStatus;
  /** Avance de 0 a 1 mientras sube. */
  progress: number;
  /** Referencia de la imagen subida; solo con `status: 'done'`. */
  ref: ImageRef | null;
  errorCode: UploadErrorCode | null;
  /** `false` cuando reintentar no ayuda (foto demasiado pesada, formato inválido, límite de firmas). */
  retryable: boolean;
};

function failureOf(error: unknown): { code: UploadErrorCode; retryable: boolean } {
  if (error instanceof ImageUploadError) return { code: error.code, retryable: error.retryable };
  return { code: 'unexpected', retryable: true };
}

/**
 * Cola de subida de fotos (RF-03, RF-04): cada foto se reduce (≤ 1600 px, JPEG 0.8) y se sube con
 * su propia firma. Cada una tiene estado y avance propios; una fallida se reintenta con `retry`
 * sin volver a elegirla (CA-02), y al desmontar se cancela lo que esté en curso.
 */
export function useImageUpload(purpose: Purpose) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const counter = useRef(0);
  const queue = useRef<string[]>([]);
  const active = useRef(0);
  const mounted = useRef(true);
  // `run` y `pump` se llaman entre sí: `pump` se guarda en una referencia para no hacerlas circulares.
  const pumpRef = useRef<() => void>(() => undefined);
  const controllers = useRef(new Map<string, AbortController>());
  const originals = useRef(new Map<string, LocalImage>());
  // La versión reducida se guarda para que un reintento no repita el trabajo.
  const resized = useRef(new Map<string, LocalImage>());

  const patch = useCallback((id: string, change: Partial<UploadItem>) => {
    if (!mounted.current) return;
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...change } : item)));
  }, []);

  const run = useCallback(
    async (id: string) => {
      const original = originals.current.get(id);
      if (original === undefined) return;
      const controller = new AbortController();
      controllers.current.set(id, controller);
      patch(id, { status: 'uploading', progress: 0, errorCode: null, retryable: true });
      try {
        let file = resized.current.get(id);
        if (file === undefined) {
          try {
            file = await resizeImage(original);
          } catch {
            throw new ImageUploadError('resize', false);
          }
          resized.current.set(id, file);
        }
        if (controller.signal.aborted) throw new UploadCancelledError();
        const ref = await uploadImage(purpose, file, {
          signal: controller.signal,
          onProgress: (progress) => patch(id, { progress }),
        });
        patch(id, { status: 'done', progress: 1, ref });
      } catch (error) {
        if (error instanceof UploadCancelledError) return;
        const failure = failureOf(error);
        patch(id, { status: 'error', errorCode: failure.code, retryable: failure.retryable });
      } finally {
        controllers.current.delete(id);
        active.current -= 1;
        pumpRef.current();
      }
    },
    [patch, purpose],
  );

  const pump = useCallback(() => {
    while (mounted.current && active.current < MAX_CONCURRENT_UPLOADS && queue.current.length > 0) {
      const next = queue.current.shift();
      if (next === undefined) break;
      active.current += 1;
      void run(next);
    }
  }, [run]);

  useEffect(() => {
    pumpRef.current = pump;
  }, [pump]);

  const enqueue = useCallback(
    (id: string) => {
      queue.current.push(id);
      pump();
    },
    [pump],
  );

  const add = useCallback(
    (images: LocalImage[]) => {
      const created: UploadItem[] = images.map((local) => {
        counter.current += 1;
        const id = `photo-${counter.current}`;
        originals.current.set(id, local);
        return {
          id,
          local,
          status: 'idle',
          progress: 0,
          ref: null,
          errorCode: null,
          retryable: true,
        };
      });
      setItems((current) => [...current, ...created]);
      for (const item of created) enqueue(item.id);
    },
    [enqueue],
  );

  const retry = useCallback(
    (id: string) => {
      if (controllers.current.has(id) || queue.current.includes(id)) return;
      patch(id, { status: 'idle', progress: 0, errorCode: null });
      enqueue(id);
    },
    [enqueue, patch],
  );

  const remove = useCallback((id: string) => {
    controllers.current.get(id)?.abort();
    queue.current = queue.current.filter((queued) => queued !== id);
    originals.current.delete(id);
    resized.current.delete(id);
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  /** Mueve la foto al inicio: la primera es la portada. */
  const moveToFront = useCallback((id: string) => {
    setItems((current) => {
      const found = current.find((item) => item.id === id);
      return found === undefined ? current : [found, ...current.filter((item) => item.id !== id)];
    });
  }, []);

  const reset = useCallback(() => {
    for (const controller of controllers.current.values()) controller.abort();
    queue.current = [];
    originals.current.clear();
    resized.current.clear();
    setItems([]);
  }, []);

  useEffect(() => {
    mounted.current = true;
    const pending = controllers.current;
    return () => {
      mounted.current = false;
      queue.current = [];
      for (const controller of pending.values()) controller.abort();
    };
  }, []);

  const refs = items.flatMap((item) => (item.ref === null ? [] : [item.ref]));
  return {
    items,
    /** Referencias ya subidas, en el orden de las fotos (la primera es la portada). */
    refs,
    isUploading: items.some((item) => item.status === 'idle' || item.status === 'uploading'),
    hasErrors: items.some((item) => item.status === 'error'),
    /** `true` cuando hay fotos y todas terminaron bien. */
    allDone: items.length > 0 && items.every((item) => item.status === 'done'),
    add,
    retry,
    remove,
    moveToFront,
    reset,
  };
}
