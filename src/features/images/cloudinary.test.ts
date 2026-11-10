import {
  ImageUploadError,
  UploadCancelledError,
  uploadToCloudinary,
  type UploadSignature,
} from '@/features/images/cloudinary';

const signature: UploadSignature = {
  uploadUrl: 'https://api.cloudinary.example/v1_1/vaiven/image/upload',
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
  method = '';
  url = '';
  sent: FormData | null = null;
  aborted = false;
  upload: { onprogress: ((event: unknown) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  onabort: (() => void) | null = null;
  constructor() {
    FakeXHR.last = this;
  }
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  send(body: FormData) {
    this.sent = body;
  }
  abort() {
    this.aborted = true;
    this.onabort?.();
  }
  respond(status: number, body: unknown) {
    this.status = status;
    this.responseText = typeof body === 'string' ? body : JSON.stringify(body);
    this.onload?.();
  }
}

// `FormData` de Node no acepta archivos `{ uri, name, type }` (el de React Native sí): se
// reemplaza por uno que solo registra lo que se agrega.
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

const file = { uri: 'file:///photo.jpg' };

describe('uploadToCloudinary', () => {
  it('envía los campos firmados tal cual, sin secreto, y devuelve el publicId', async () => {
    const promise = uploadToCloudinary(signature, file);
    const xhr = FakeXHR.last;
    expect(xhr.method).toBe('POST');
    expect(xhr.url).toBe(signature.uploadUrl);
    const parts = (xhr.sent as unknown as FakeFormData).parts;
    const fields = Object.fromEntries(parts);
    expect(fields).toMatchObject({
      api_key: '123456789012345',
      timestamp: '1762480800',
      signature: 'abc123',
      public_id: signature.publicId,
      type: 'upload',
      allowed_formats: 'jpg,jpeg,png,webp',
      overwrite: 'false',
      file: { uri: file.uri, type: 'image/jpeg' },
    });
    expect(Object.keys(fields).join()).not.toMatch(/secret/i);
    xhr.respond(200, { public_id: signature.publicId, width: 1600, height: 1200 });
    await expect(promise).resolves.toEqual({ publicId: signature.publicId });
  });

  it('informa el avance de 0 a 1', async () => {
    const onProgress = jest.fn();
    const promise = uploadToCloudinary(signature, file, { onProgress });
    FakeXHR.last.upload.onprogress?.({ lengthComputable: true, loaded: 25, total: 100 });
    FakeXHR.last.upload.onprogress?.({ lengthComputable: false, loaded: 1, total: 0 });
    FakeXHR.last.respond(200, { public_id: 'x' });
    await promise;
    expect(onProgress.mock.calls.map(([value]) => value)).toEqual([0.25, 1]);
  });

  it.each([
    [413, { error: { message: 'x' } }, 'too_large', false],
    [400, { error: { message: 'File size too large. Got 7340032' } }, 'too_large', false],
    [400, { error: { message: 'Invalid image file format' } }, 'invalid_format', false],
    [401, { error: { message: 'Invalid Signature' } }, 'upload', true],
    [500, 'no es json', 'upload', true],
  ])('estado %i → %s', async (status, body, code, retryable) => {
    const promise = uploadToCloudinary(signature, file);
    FakeXHR.last.respond(status, body);
    await expect(promise).rejects.toMatchObject({ code, retryable });
    await expect(promise).rejects.toBeInstanceOf(ImageUploadError);
  });

  it('una respuesta 200 sin public_id es un error inesperado', async () => {
    const promise = uploadToCloudinary(signature, file);
    FakeXHR.last.respond(200, { otra: 'cosa' });
    await expect(promise).rejects.toMatchObject({ code: 'unexpected' });
  });

  it('un fallo de red es un error de subida reintentable', async () => {
    const promise = uploadToCloudinary(signature, file);
    FakeXHR.last.onerror?.();
    await expect(promise).rejects.toMatchObject({ code: 'upload', retryable: true });
  });

  it('cancelar con la señal aborta la petición y rechaza con UploadCancelledError', async () => {
    const controller = new AbortController();
    const promise = uploadToCloudinary(signature, file, { signal: controller.signal });
    controller.abort();
    expect(FakeXHR.last.aborted).toBe(true);
    await expect(promise).rejects.toBeInstanceOf(UploadCancelledError);
  });

  it('con la señal ya cancelada ni siquiera abre la petición', async () => {
    const controller = new AbortController();
    controller.abort();
    const before = FakeXHR.last;
    await expect(
      uploadToCloudinary(signature, file, { signal: controller.signal }),
    ).rejects.toBeInstanceOf(UploadCancelledError);
    expect(FakeXHR.last).toBe(before);
  });
});
