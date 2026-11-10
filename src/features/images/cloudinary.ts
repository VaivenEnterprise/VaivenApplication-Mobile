import { z } from 'zod';
import type { ImageRef, UploadErrorCode } from '@/features/images/types';

// Subida directa a Cloudinary con los datos firmados por el backend (RF-03, RF-07, plan P-01).
// La app nunca tiene el API secret: solo reenvía `apiKey`, `timestamp`, `signature`, `publicId`,
// `type`, `allowedFormats` y `overwrite`, sin cambiarlos. Se usa `XMLHttpRequest` (sin SDK) porque
// `fetch` no informa el avance de la subida.

export type UploadSignature = {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
  type: 'upload' | 'authenticated';
  allowedFormats: string;
  overwrite: string;
};

/** Error tipado de la subida: `code` decide el mensaje y `retryable` si tiene sentido reintentar. */
export class ImageUploadError extends Error {
  readonly code: UploadErrorCode;
  readonly retryable: boolean;
  constructor(code: UploadErrorCode, retryable = true) {
    super(code);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'ImageUploadError';
    this.code = code;
    this.retryable = retryable;
  }
}

/** Marca de cancelación (no es un fallo: no se muestra error). */
export class UploadCancelledError extends Error {
  constructor() {
    super('cancelled');
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'UploadCancelledError';
  }
}

const cloudinaryResponse = z.object({ public_id: z.string().min(1) });
const cloudinaryError = z.object({ error: z.object({ message: z.string() }) });

type UploadOptions = {
  /** Avance de 0 a 1. */
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
};

function classifyFailure(status: number, body: unknown): ImageUploadError {
  const parsed = cloudinaryError.safeParse(body);
  const message = parsed.success ? parsed.data.error.message.toLowerCase() : '';
  if (status === 413 || message.includes('too large') || message.includes('file size')) {
    return new ImageUploadError('too_large', false);
  }
  if (message.includes('format')) return new ImageUploadError('invalid_format', false);
  // Firma vencida o rechazada: hay que pedir otra, así que se puede reintentar.
  return new ImageUploadError('upload', true);
}

function buildForm(signature: UploadSignature, uri: string): FormData {
  const form = new FormData();
  // En React Native un archivo se adjunta como objeto `{ uri, name, type }`.
  form.append('file', { uri, name: 'photo.jpg', type: 'image/jpeg' } as unknown as Blob);
  form.append('api_key', signature.apiKey);
  form.append('timestamp', String(signature.timestamp));
  form.append('signature', signature.signature);
  form.append('public_id', signature.publicId);
  form.append('type', signature.type);
  form.append('allowed_formats', signature.allowedFormats);
  form.append('overwrite', signature.overwrite);
  return form;
}

/** Sube un archivo local ya reducido y devuelve su referencia (`publicId`). */
export function uploadToCloudinary(
  signature: UploadSignature,
  file: { uri: string },
  { onProgress, signal }: UploadOptions = {},
): Promise<ImageRef> {
  return new Promise<ImageRef>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new UploadCancelledError());
      return;
    }
    const xhr = new XMLHttpRequest();
    const onAbort = () => xhr.abort();
    const cleanup = () => signal?.removeEventListener('abort', onAbort);
    signal?.addEventListener('abort', onAbort);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) onProgress?.(event.loaded / event.total);
    };
    xhr.onerror = () => {
      cleanup();
      reject(new ImageUploadError('upload'));
    };
    xhr.ontimeout = xhr.onerror;
    xhr.onabort = () => {
      cleanup();
      reject(new UploadCancelledError());
    };
    xhr.onload = () => {
      cleanup();
      let body: unknown = null;
      try {
        body = JSON.parse(xhr.responseText) as unknown;
      } catch {
        body = null;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        const parsed = cloudinaryResponse.safeParse(body);
        if (parsed.success) {
          onProgress?.(1);
          resolve({ publicId: parsed.data.public_id });
        } else {
          reject(new ImageUploadError('unexpected'));
        }
        return;
      }
      reject(classifyFailure(xhr.status, body));
    };

    xhr.open('POST', signature.uploadUrl);
    xhr.send(buildForm(signature, file.uri));
  });
}
