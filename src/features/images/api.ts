import { z } from 'zod';
import { request } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import {
  ImageUploadError,
  UploadCancelledError,
  uploadToCloudinary,
  type UploadSignature,
} from '@/features/images/cloudinary';
import type { ImageRef, Purpose } from '@/features/images/types';

// `POST /uploads/signature` (`backend/api/paths/uploads.yaml`): una firma de un solo uso por
// imagen (P-02). El backend nunca envía el API secret.

const signatureSchema = z.object({
  uploadUrl: z.url(),
  apiKey: z.string().min(1),
  timestamp: z.number().int(),
  signature: z.string().min(1),
  publicId: z.string().min(1),
  type: z.enum(['upload', 'authenticated']),
  allowedFormats: z.string(),
  overwrite: z.string(),
});

export function createUploadSignature(purpose: Purpose): Promise<UploadSignature> {
  return request('/uploads/signature', signatureSchema, {
    method: 'POST',
    body: JSON.stringify({ purpose }),
  });
}

type UploadOptions = { onProgress?: (fraction: number) => void; signal?: AbortSignal };

/** Pide la firma y sube la foto ya reducida. Devuelve la referencia que reciben las demás rutas. */
export async function uploadImage(
  purpose: Purpose,
  file: { uri: string },
  options: UploadOptions = {},
): Promise<ImageRef> {
  let signature: UploadSignature;
  try {
    signature = await createUploadSignature(purpose);
  } catch (error) {
    throw signatureFailure(error);
  }
  if (options.signal?.aborted) throw new UploadCancelledError();
  return uploadToCloudinary(signature, file, options);
}

/** Traduce un fallo de la API de firma a un error de subida tipado. */
function signatureFailure(error: unknown): ImageUploadError {
  if (error instanceof ApiError && error.code === 'rate_limited') {
    return new ImageUploadError('rate_limited', false);
  }
  return new ImageUploadError('signature', true);
}
