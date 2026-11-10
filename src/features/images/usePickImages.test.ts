import * as ImagePicker from 'expo-image-picker';
import { act, renderHook } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { usePickImages } from '@/features/images/usePickImages';

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const picker = jest.mocked(ImagePicker);
const asset = (n: number) => ({ uri: `file:///${n}.jpg`, width: 4000, height: 3000 });

beforeEach(() => {
  jest.resetAllMocks();
  picker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true } as never);
});

describe('cámara', () => {
  it('pide permiso, toma la foto y la devuelve con sus medidas', async () => {
    picker.launchCameraAsync.mockResolvedValue({ canceled: false, assets: [asset(1)] } as never);
    const { result } = await renderHook(() => usePickImages({ max: 5 }));
    let photos: unknown;
    await act(async () => {
      photos = await result.current.pickFromCamera();
    });
    expect(picker.requestCameraPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(photos).toEqual([{ uri: 'file:///1.jpg', width: 4000, height: 3000 }]);
    expect(result.current.status).toBe('idle');
  });

  it('CA-03: permiso negado → estado denied, sin abrir la cámara, y acceso a Ajustes', async () => {
    picker.requestCameraPermissionsAsync.mockResolvedValue({ granted: false } as never);
    const settings = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    const { result } = await renderHook(() => usePickImages({ max: 5 }));
    await act(async () => {
      expect(await result.current.pickFromCamera()).toEqual([]);
    });
    expect(picker.launchCameraAsync).not.toHaveBeenCalled();
    expect(result.current.status).toBe('denied');
    expect(result.current.deniedSource).toBe('camera');
    await act(async () => {
      await result.current.openSettings();
    });
    expect(settings).toHaveBeenCalledTimes(1);
    await act(async () => result.current.dismiss());
    expect(result.current.status).toBe('idle');
    expect(result.current.deniedSource).toBeNull();
  });

  it('cancelar la cámara no devuelve fotos ni cambia el estado', async () => {
    picker.launchCameraAsync.mockResolvedValue({ canceled: true, assets: null } as never);
    const { result } = await renderHook(() => usePickImages({ max: 5 }));
    await act(async () => {
      expect(await result.current.pickFromCamera()).toEqual([]);
    });
    expect(result.current.status).toBe('idle');
  });

  it('si la cámara falla, el estado pasa a error', async () => {
    picker.launchCameraAsync.mockRejectedValue(new Error('sin cámara'));
    const { result } = await renderHook(() => usePickImages({ max: 5 }));
    await act(async () => {
      expect(await result.current.pickFromCamera()).toEqual([]);
    });
    expect(result.current.status).toBe('error');
  });
});

describe('galería', () => {
  it('no pide permiso y limita la selección a lo que aún cabe', async () => {
    picker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [asset(1), asset(2), asset(3)],
    } as never);
    const { result } = await renderHook(() => usePickImages({ max: 5, count: 3 }));
    let photos: unknown[] = [];
    await act(async () => {
      photos = await result.current.pickFromLibrary();
    });
    expect(picker.requestCameraPermissionsAsync).not.toHaveBeenCalled();
    expect(picker.launchImageLibraryAsync).toHaveBeenCalledWith(
      expect.objectContaining({ allowsMultipleSelection: true, selectionLimit: 2 }),
    );
    expect(photos).toHaveLength(2);
  });

  it('con una sola plaza libre desactiva la selección múltiple', async () => {
    picker.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: null } as never);
    const { result } = await renderHook(() => usePickImages({ max: 5, count: 4 }));
    await act(async () => {
      await result.current.pickFromLibrary();
    });
    expect(picker.launchImageLibraryAsync).toHaveBeenCalledWith(
      expect.objectContaining({ allowsMultipleSelection: false, selectionLimit: 1 }),
    );
  });

  it('un fallo de la galería deja el estado en error', async () => {
    picker.launchImageLibraryAsync.mockRejectedValue(new Error('x'));
    const { result } = await renderHook(() => usePickImages({ max: 5 }));
    await act(async () => {
      await result.current.pickFromLibrary();
    });
    expect(result.current.status).toBe('error');
  });
});

describe('límite (CA-05)', () => {
  it('con el máximo alcanzado bloquea ambos orígenes sin abrir nada', async () => {
    const { result } = await renderHook(() => usePickImages({ max: 5, count: 5 }));
    expect(result.current.canAdd).toBe(false);
    expect(result.current.remaining).toBe(0);
    await act(async () => {
      expect(await result.current.pickFromCamera()).toEqual([]);
      expect(await result.current.pickFromLibrary()).toEqual([]);
    });
    expect(picker.requestCameraPermissionsAsync).not.toHaveBeenCalled();
    expect(picker.launchCameraAsync).not.toHaveBeenCalled();
    expect(picker.launchImageLibraryAsync).not.toHaveBeenCalled();
  });

  it('con más fotos que el máximo, remaining nunca es negativo', async () => {
    const { result } = await renderHook(() => usePickImages({ max: 2, count: 9 }));
    expect(result.current.remaining).toBe(0);
  });
});
