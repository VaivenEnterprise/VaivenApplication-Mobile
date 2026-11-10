import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as api from '@/features/images/api';
import { ImageUploadError, UploadCancelledError } from '@/features/images/cloudinary';
import * as resize from '@/features/images/resize';
import { MAX_CONCURRENT_UPLOADS, useImageUpload } from '@/features/images/useImageUpload';
import type { LocalImage } from '@/features/images/types';

jest.mock('@/features/images/api', () => ({ uploadImage: jest.fn() }));
jest.mock('@/features/images/resize', () => ({ resizeImage: jest.fn() }));

const uploadImage = jest.mocked(api.uploadImage);
const resizeImage = jest.mocked(resize.resizeImage);

const photo = (n: number): LocalImage => ({ uri: `file:///${n}.jpg`, width: 4000, height: 3000 });

type Deferred<T> = { promise: Promise<T>; resolve: (v: T) => void; reject: (e: unknown) => void };
function deferred<T>(): Deferred<T> {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  jest.resetAllMocks();
  resizeImage.mockImplementation(async (image) => ({
    uri: image.uri.replace('.jpg', '-r.jpg'),
    width: 1600,
    height: 1200,
  }));
  uploadImage.mockImplementation(async (_purpose, file) => ({ publicId: `id:${file.uri}` }));
});

describe('flujo feliz', () => {
  it('reduce, sube y deja la referencia de cada foto en orden', async () => {
    const { result } = await renderHook(() => useImageUpload('item_photo'));
    await act(async () => result.current.add([photo(1), photo(2)]));
    await waitFor(() => expect(result.current.allDone).toBe(true));
    expect(result.current.refs).toEqual([
      { publicId: 'id:file:///1-r.jpg' },
      { publicId: 'id:file:///2-r.jpg' },
    ]);
    expect(resizeImage).toHaveBeenCalledTimes(2);
    expect(uploadImage.mock.calls.every(([purpose]) => purpose === 'item_photo')).toBe(true);
    expect(result.current.isUploading).toBe(false);
    expect(result.current.hasErrors).toBe(false);
  });

  it('la evidencia pide la finalidad evidence', async () => {
    const { result } = await renderHook(() => useImageUpload('evidence'));
    await act(async () => result.current.add([photo(1)]));
    await waitFor(() => expect(result.current.allDone).toBe(true));
    expect(uploadImage.mock.calls[0]?.[0]).toBe('evidence');
  });

  it('sin fotos no hay nada que esperar', async () => {
    const { result } = await renderHook(() => useImageUpload('item_photo'));
    expect(result.current.allDone).toBe(false);
    expect(result.current.isUploading).toBe(false);
    expect(result.current.refs).toEqual([]);
  });
});

describe('progreso y cola', () => {
  it('muestra el avance de cada foto y respeta el máximo de subidas a la vez', async () => {
    const gates = Array.from({ length: 3 }, () => deferred<{ publicId: string }>());
    const progress: ((fraction: number) => void)[] = [];
    let call = 0;
    uploadImage.mockImplementation(async (_purpose, _file, options) => {
      const index = call++;
      progress[index] = options?.onProgress ?? (() => undefined);
      return gates[index]!.promise;
    });
    const { result } = await renderHook(() => useImageUpload('item_photo'));
    await act(async () => result.current.add([photo(1), photo(2), photo(3)]));
    await waitFor(() => expect(uploadImage).toHaveBeenCalledTimes(MAX_CONCURRENT_UPLOADS));
    expect(result.current.items.map((item) => item.status)).toEqual([
      'uploading',
      'uploading',
      'idle',
    ]);

    await act(async () => progress[0]!(0.4));
    expect(result.current.items[0]?.progress).toBe(0.4);

    await act(async () => gates[0]!.resolve({ publicId: 'a' }));
    await waitFor(() => expect(uploadImage).toHaveBeenCalledTimes(3));
    await act(async () => {
      gates[1]!.resolve({ publicId: 'b' });
      gates[2]!.resolve({ publicId: 'c' });
    });
    await waitFor(() => expect(result.current.allDone).toBe(true));
    expect(result.current.refs.map((ref) => ref.publicId)).toEqual(['a', 'b', 'c']);
  });
});

describe('fallos y reintento (CA-02)', () => {
  it('una subida fallida queda en error y se reintenta sin volver a reducir la foto', async () => {
    uploadImage.mockRejectedValueOnce(new ImageUploadError('upload', true));
    const { result } = await renderHook(() => useImageUpload('item_photo'));
    await act(async () => result.current.add([photo(1)]));
    await waitFor(() => expect(result.current.hasErrors).toBe(true));
    const failed = result.current.items[0]!;
    expect(failed.status).toBe('error');
    expect(failed.errorCode).toBe('upload');
    expect(failed.retryable).toBe(true);
    expect(failed.ref).toBeNull();

    await act(async () => result.current.retry(failed.id));
    await waitFor(() => expect(result.current.allDone).toBe(true));
    expect(resizeImage).toHaveBeenCalledTimes(1);
    expect(uploadImage).toHaveBeenCalledTimes(2);
    expect(uploadImage.mock.calls[1]?.[1]).toEqual(uploadImage.mock.calls[0]?.[1]);
    expect(result.current.items[0]?.errorCode).toBeNull();
  });

  it('una foto que falla no detiene a las demás', async () => {
    uploadImage.mockImplementation(async (_purpose, file) => {
      if (file.uri.includes('1-r')) throw new ImageUploadError('upload');
      return { publicId: file.uri };
    });
    const { result } = await renderHook(() => useImageUpload('item_photo'));
    await act(async () => result.current.add([photo(1), photo(2)]));
    await waitFor(() => expect(result.current.isUploading).toBe(false));
    expect(result.current.items.map((item) => item.status)).toEqual(['error', 'done']);
    expect(result.current.allDone).toBe(false);
    expect(result.current.refs).toHaveLength(1);
  });

  it('los errores no reintentables lo indican (foto muy pesada, límite de firmas)', async () => {
    uploadImage.mockRejectedValueOnce(new ImageUploadError('too_large', false));
    const { result } = await renderHook(() => useImageUpload('item_photo'));
    await act(async () => result.current.add([photo(1)]));
    await waitFor(() => expect(result.current.hasErrors).toBe(true));
    expect(result.current.items[0]).toMatchObject({ errorCode: 'too_large', retryable: false });
  });

  it('un fallo inesperado se marca como unexpected', async () => {
    uploadImage.mockRejectedValueOnce(new Error('raro'));
    const { result } = await renderHook(() => useImageUpload('item_photo'));
    await act(async () => result.current.add([photo(1)]));
    await waitFor(() => expect(result.current.hasErrors).toBe(true));
    expect(result.current.items[0]?.errorCode).toBe('unexpected');
  });

  it('si no se puede reducir la foto, falla con resize y no la sube', async () => {
    resizeImage.mockRejectedValueOnce(new Error('nativo'));
    const { result } = await renderHook(() => useImageUpload('item_photo'));
    await act(async () => result.current.add([photo(1)]));
    await waitFor(() => expect(result.current.hasErrors).toBe(true));
    expect(result.current.items[0]).toMatchObject({ errorCode: 'resize', retryable: false });
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it('reintentar una foto que ya está en curso no la duplica', async () => {
    const gate = deferred<{ publicId: string }>();
    uploadImage.mockImplementation(() => gate.promise);
    const { result } = await renderHook(() => useImageUpload('item_photo'));
    await act(async () => result.current.add([photo(1)]));
    await waitFor(() => expect(uploadImage).toHaveBeenCalledTimes(1));
    await act(async () => result.current.retry(result.current.items[0]!.id));
    expect(uploadImage).toHaveBeenCalledTimes(1);
    await act(async () => gate.resolve({ publicId: 'x' }));
  });
});

describe('quitar, portada y cancelación', () => {
  it('quitar una foto en curso cancela su subida y la saca de la lista', async () => {
    let signal: AbortSignal | undefined;
    uploadImage.mockImplementation(async (_purpose, _file, options) => {
      signal = options?.signal;
      return new Promise((_resolve, reject) =>
        options?.signal?.addEventListener('abort', () => reject(new UploadCancelledError())),
      );
    });
    const { result } = await renderHook(() => useImageUpload('item_photo'));
    await act(async () => result.current.add([photo(1)]));
    await waitFor(() => expect(uploadImage).toHaveBeenCalled());
    await act(async () => result.current.remove(result.current.items[0]!.id));
    expect(signal?.aborted).toBe(true);
    expect(result.current.items).toEqual([]);
    expect(result.current.hasErrors).toBe(false);
  });

  it('quitar una foto en cola evita que se suba', async () => {
    const gates = [deferred<{ publicId: string }>(), deferred<{ publicId: string }>()];
    let call = 0;
    uploadImage.mockImplementation(() => gates[call++ % 2]!.promise);
    const { result } = await renderHook(() => useImageUpload('item_photo'));
    await act(async () => result.current.add([photo(1), photo(2), photo(3)]));
    await waitFor(() => expect(uploadImage).toHaveBeenCalledTimes(MAX_CONCURRENT_UPLOADS));
    const queued = result.current.items[2]!;
    expect(queued.status).toBe('idle');
    await act(async () => result.current.remove(queued.id));
    await act(async () => {
      gates[0]!.resolve({ publicId: 'a' });
      gates[1]!.resolve({ publicId: 'b' });
    });
    await waitFor(() => expect(result.current.allDone).toBe(true));
    expect(uploadImage).toHaveBeenCalledTimes(2);
  });

  it('mover al inicio cambia la portada y las referencias siguen ese orden', async () => {
    const { result } = await renderHook(() => useImageUpload('item_photo'));
    await act(async () => result.current.add([photo(1), photo(2), photo(3)]));
    await waitFor(() => expect(result.current.allDone).toBe(true));
    await act(async () => result.current.moveToFront(result.current.items[2]!.id));
    expect(result.current.refs.map((ref) => ref.publicId)).toEqual([
      'id:file:///3-r.jpg',
      'id:file:///1-r.jpg',
      'id:file:///2-r.jpg',
    ]);
    await act(async () => result.current.moveToFront('no-existe'));
    expect(result.current.items).toHaveLength(3);
  });

  it('al desmontar se cancelan las subidas en curso y no se actualiza el estado', async () => {
    let signal: AbortSignal | undefined;
    uploadImage.mockImplementation(async (_purpose, _file, options) => {
      signal = options?.signal;
      return new Promise((_resolve, reject) =>
        options?.signal?.addEventListener('abort', () => reject(new UploadCancelledError())),
      );
    });
    const { result, unmount } = await renderHook(() => useImageUpload('item_photo'));
    await act(async () => result.current.add([photo(1), photo(2), photo(3)]));
    await waitFor(() => expect(uploadImage).toHaveBeenCalledTimes(MAX_CONCURRENT_UPLOADS));
    await unmount();
    expect(signal?.aborted).toBe(true);
    // La tercera foto, que seguía en cola, nunca se sube.
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(uploadImage).toHaveBeenCalledTimes(MAX_CONCURRENT_UPLOADS);
  });

  it('reset cancela todo y vacía la lista', async () => {
    uploadImage.mockImplementation(() => new Promise(() => undefined));
    const { result } = await renderHook(() => useImageUpload('item_photo'));
    await act(async () => result.current.add([photo(1)]));
    await waitFor(() => expect(uploadImage).toHaveBeenCalled());
    await act(async () => result.current.reset());
    expect(result.current.items).toEqual([]);
  });
});
