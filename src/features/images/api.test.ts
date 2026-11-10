import { createUploadSignature, uploadImage } from '@/features/images/api';
import * as cloudinary from '@/features/images/cloudinary';
import { UploadCancelledError } from '@/features/images/cloudinary';
import { failure, installFakeApi, ok } from '@/test/fakeApi';

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));

const signatureBody = {
  uploadUrl: 'https://api.cloudinary.example/v1_1/vaiven/image/upload',
  apiKey: '123456789012345',
  timestamp: 1762480800,
  signature: 'abc123',
  publicId: 'vaiven/staging/item_photo/u1/f00',
  type: 'upload',
  allowedFormats: 'jpg,jpeg,png,webp',
  overwrite: 'false',
};

afterEach(() => jest.restoreAllMocks());

describe('createUploadSignature', () => {
  it('pide la firma con la finalidad y valida la respuesta', async () => {
    const api = installFakeApi({ 'POST /uploads/signature': () => ok(signatureBody) });
    await expect(createUploadSignature('item_photo')).resolves.toEqual(signatureBody);
    expect(api.calls[0]?.body).toEqual({ purpose: 'item_photo' });
  });

  it('evidencia pide una firma authenticated', async () => {
    const api = installFakeApi({
      'POST /uploads/signature': () => ok({ ...signatureBody, type: 'authenticated' }),
    });
    const result = await createUploadSignature('evidence');
    expect(result.type).toBe('authenticated');
    expect(api.calls[0]?.body).toEqual({ purpose: 'evidence' });
  });

  it('rechaza una respuesta que no cumple el contrato', async () => {
    installFakeApi({ 'POST /uploads/signature': () => ok({ uploadUrl: 'no es url' }) });
    await expect(createUploadSignature('item_photo')).rejects.toMatchObject({
      code: 'invalid_response',
    });
  });
});

describe('uploadImage', () => {
  it('firma, sube y devuelve solo el publicId; la firma nunca contiene un secreto', async () => {
    installFakeApi({ 'POST /uploads/signature': () => ok(signatureBody) });
    const upload = jest
      .spyOn(cloudinary, 'uploadToCloudinary')
      .mockResolvedValue({ publicId: signatureBody.publicId });
    const onProgress = jest.fn();
    const result = await uploadImage('item_photo', { uri: 'file:///a.jpg' }, { onProgress });
    expect(result).toEqual({ publicId: signatureBody.publicId });
    expect(upload).toHaveBeenCalledWith(
      signatureBody,
      { uri: 'file:///a.jpg' },
      expect.objectContaining({ onProgress }),
    );
    expect(JSON.stringify(upload.mock.calls[0]?.[0])).not.toMatch(/secret/i);
  });

  it('429 en la firma → error rate_limited sin reintento', async () => {
    installFakeApi({ 'POST /uploads/signature': () => failure(429, 'rate_limited') });
    await expect(uploadImage('item_photo', { uri: 'x' })).rejects.toMatchObject({
      code: 'rate_limited',
      retryable: false,
    });
  });

  it('500 en la firma → error signature reintentable', async () => {
    installFakeApi({ 'POST /uploads/signature': () => failure(500, 'internal_error') });
    await expect(uploadImage('item_photo', { uri: 'x' })).rejects.toMatchObject({
      code: 'signature',
      retryable: true,
    });
  });

  it('si se cancela mientras llega la firma, no sube', async () => {
    const controller = new AbortController();
    installFakeApi({
      'POST /uploads/signature': () => {
        controller.abort();
        return ok(signatureBody);
      },
    });
    const upload = jest.spyOn(cloudinary, 'uploadToCloudinary');
    await expect(
      uploadImage('item_photo', { uri: 'x' }, { signal: controller.signal }),
    ).rejects.toBeInstanceOf(UploadCancelledError);
    expect(upload).not.toHaveBeenCalled();
  });
});
