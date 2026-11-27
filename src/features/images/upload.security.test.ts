import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import {
  ImageUploadError,
  isAllowedUploadUrl,
  uploadToCloudinary,
  type UploadSignature,
} from '@/features/images/cloudinary';
import { JPEG_QUALITY, MAX_SIDE, resizeImage, targetSize } from '@/features/images/resize';

// Spec 016 · S-11 (OWASP M4 validación insuficiente de entradas): solo se suben fotos reducidas,
// como JPEG, con firma del servidor y formatos permitidos; los rechazos se muestran sin reintentos.

jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  ImageManipulator: { manipulate: jest.fn() },
}));

const signature: UploadSignature = {
  uploadUrl: 'https://api.cloudinary.com/v1_1/vaiven/image/upload',
  apiKey: '123456789012345',
  timestamp: 1762480800,
  signature: 'abc123',
  publicId: 'vaiven/staging/item_photo/u1/f00',
  type: 'upload',
  allowedFormats: 'jpg,jpeg,png,webp',
  overwrite: 'false',
};

class FakeXHR {
  static last: FakeXHR;
  status = 0;
  responseText = '';
  sent: FakeFormData | null = null;
  upload: { onprogress: ((event: unknown) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  onabort: (() => void) | null = null;
  constructor() {
    FakeXHR.last = this;
  }
  open() {}
  send(body: FakeFormData) {
    this.sent = body;
  }
  abort() {}
  respond(status: number, body: unknown) {
    this.status = status;
    this.responseText = JSON.stringify(body);
    this.onload?.();
  }
}
class FakeFormData {
  readonly parts: [string, unknown][] = [];
  append(name: string, value: unknown) {
    this.parts.push([name, value]);
  }
}

const originalXhr = globalThis.XMLHttpRequest;
const originalForm = globalThis.FormData;
beforeEach(() => {
  globalThis.XMLHttpRequest = FakeXHR as unknown as typeof XMLHttpRequest;
  globalThis.FormData = FakeFormData as unknown as typeof FormData;
});
afterEach(() => {
  globalThis.XMLHttpRequest = originalXhr;
  globalThis.FormData = originalForm;
});

describe('S-11 · M4 · reducción antes de subir', () => {
  it.each([
    [4000, 3000],
    [3000, 4000],
    [6000, 6000],
    [5000, 1000],
    [1700, 100],
  ])('S-11a una foto de %i×%i sale con lado mayor ≤ 1600 px', (w, h) => {
    const out = targetSize(w, h);
    expect(Math.max(out.width, out.height)).toBeLessThanOrEqual(MAX_SIDE);
  });

  it('S-11b resizeImage siempre recomprime a JPEG con calidad 0.8', async () => {
    const saveAsync = jest
      .fn()
      .mockResolvedValue({ uri: 'file://r.jpg', width: 1600, height: 1200 });
    const context = { resize: jest.fn(), renderAsync: jest.fn().mockResolvedValue({ saveAsync }) };
    context.resize.mockReturnValue(context);
    jest.mocked(ImageManipulator.manipulate).mockReturnValue(context as never);
    await resizeImage({ uri: 'file://x.png', width: 4000, height: 3000 });
    expect(saveAsync).toHaveBeenCalledWith({ format: SaveFormat.JPEG, compress: JPEG_QUALITY });
    expect(JPEG_QUALITY).toBeLessThanOrEqual(0.8);
  });
});

describe('S-11 · M4 · subida firmada y rechazos del servicio de imágenes', () => {
  it('S-11c la subida envía firma, formatos permitidos y no sobrescribe, siempre como image/jpeg', async () => {
    const promise = uploadToCloudinary(signature, { uri: 'file://r.jpg' });
    const form = FakeXHR.last.sent as FakeFormData;
    const campos = Object.fromEntries(form.parts.filter(([n]) => n !== 'file'));
    expect(campos).toMatchObject({
      signature: 'abc123',
      allowed_formats: 'jpg,jpeg,png,webp',
      overwrite: 'false',
      type: 'upload',
    });
    expect(form.parts.find(([n]) => n === 'file')?.[1]).toMatchObject({ type: 'image/jpeg' });
    FakeXHR.last.respond(200, { public_id: signature.publicId });
    await expect(promise).resolves.toEqual({ publicId: signature.publicId });
  });

  it('S-11d un archivo demasiado grande (413) se rechaza sin permitir reintento', async () => {
    const promise = uploadToCloudinary(signature, { uri: 'file://r.jpg' });
    FakeXHR.last.respond(413, { error: { message: 'File size too large' } });
    await expect(promise).rejects.toMatchObject({ code: 'too_large', retryable: false });
  });

  it('S-11e un formato no permitido se rechaza sin permitir reintento', async () => {
    const promise = uploadToCloudinary(signature, { uri: 'file://r.gif' });
    FakeXHR.last.respond(400, { error: { message: 'Invalid image file format' } });
    const error = await promise.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ImageUploadError);
    expect(error).toMatchObject({ code: 'invalid_format', retryable: false });
  });

  it('S-11f una respuesta exitosa sin public_id no se acepta como subida', async () => {
    const promise = uploadToCloudinary(signature, { uri: 'file://r.jpg' });
    FakeXHR.last.respond(200, { otro: 1 });
    await expect(promise).rejects.toMatchObject({ code: 'unexpected' });
  });
});

// Spec 021 · T013 (RF-12, B-4): la foto solo sale hacia la API de subida de Cloudinary por https.
describe('S-11 · M4 · destino de la subida (021-T013)', () => {
  let creadas = 0;
  beforeEach(() => {
    creadas = 0;
    class CountingXHR extends FakeXHR {
      constructor() {
        super();
        creadas += 1;
      }
    }
    globalThis.XMLHttpRequest = CountingXHR as unknown as typeof XMLHttpRequest;
  });

  it.each([
    'https://api.cloudinary.com/v1_1/vaiven/image/upload',
    'https://api-eu.cloudinary.com/v1_1/vaiven/image/upload',
  ])('S-11g acepta la API de subida de Cloudinary: %s', (url) => {
    expect(isAllowedUploadUrl(url)).toBe(true);
  });

  it.each([
    ['http (sin TLS)', 'http://api.cloudinary.com/v1_1/vaiven/image/upload'],
    ['otro dominio', 'https://evil.example/v1_1/vaiven/image/upload'],
    ['dominio parecido', 'https://api.cloudinary.com.evil.example/v1_1/vaiven/image/upload'],
    ['sufijo sin punto', 'https://apicloudinary.com/v1_1/vaiven/image/upload'],
    ['subdominio no de subida', 'https://res.cloudinary.com/v1_1/vaiven/image/upload'],
    ['credenciales en la URL', 'https://api.cloudinary.com@evil.example/v1_1/vaiven/image/upload'],
    ['puerto propio', 'https://api.cloudinary.com:8443/v1_1/vaiven/image/upload'],
    ['esquema raro', 'javascript:alert(1)'],
    ['esquema de archivo', 'file:///data/upload'],
    ['ruta fuera de la API', 'https://api.cloudinary.com/otra/ruta'],
    [
      'consulta añadida',
      'https://api.cloudinary.com/v1_1/vaiven/image/upload?next=https://evil.example',
    ],
    ['vacía', ''],
  ])('S-11h rechaza %s y no sube nada', async (_caso, uploadUrl) => {
    expect(isAllowedUploadUrl(uploadUrl)).toBe(false);
    const onProgress = jest.fn();
    const error = await uploadToCloudinary(
      { ...signature, uploadUrl },
      { uri: 'file://r.jpg' },
      { onProgress },
    ).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ImageUploadError);
    expect(error).toMatchObject({ code: 'signature', retryable: false });
    expect(creadas).toBe(0);
    expect(onProgress).not.toHaveBeenCalled();
  });
});
