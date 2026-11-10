import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { JPEG_QUALITY, MAX_SIDE, resizeImage, targetSize } from '@/features/images/resize';

jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  ImageManipulator: { manipulate: jest.fn() },
}));

const resizeCall = jest.fn();
const saveAsync = jest.fn();
const renderAsync = jest.fn();

beforeEach(() => {
  resizeCall.mockReset();
  saveAsync.mockReset();
  renderAsync.mockReset();
  const context = { resize: resizeCall, renderAsync };
  resizeCall.mockReturnValue(context);
  renderAsync.mockResolvedValue({ saveAsync });
  jest.mocked(ImageManipulator.manipulate).mockReturnValue(context as never);
});

describe('targetSize', () => {
  it.each([
    [4000, 3000, 1600, 1200],
    [3000, 4000, 1200, 1600],
    [1600, 1600, 1600, 1600],
    [1600, 900, 1600, 900],
    [800, 600, 800, 600],
    [6000, 6000, 1600, 1600],
    [5000, 1000, 1600, 320],
  ])('%i×%i → %i×%i', (w, h, outW, outH) => {
    expect(targetSize(w, h)).toEqual({ width: outW, height: outH });
  });

  it('nunca agranda una foto chica', () => {
    const { width, height } = targetSize(320, 240);
    expect(Math.max(width, height)).toBeLessThanOrEqual(320);
  });
});

describe('resizeImage', () => {
  it('CA-01: una foto de 4000×3000 sube con lado mayor 1600 px y JPEG 0.8', async () => {
    saveAsync.mockResolvedValue({ uri: 'file:///out.jpg', width: 1600, height: 1200 });
    const result = await resizeImage({ uri: 'file:///in.jpg', width: 4000, height: 3000 });
    expect(ImageManipulator.manipulate).toHaveBeenCalledWith('file:///in.jpg');
    expect(resizeCall).toHaveBeenCalledWith({ width: MAX_SIDE });
    expect(saveAsync).toHaveBeenCalledWith({ format: SaveFormat.JPEG, compress: JPEG_QUALITY });
    expect(result).toEqual({ uri: 'file:///out.jpg', width: 1600, height: 1200 });
  });

  it('una foto vertical se limita por la altura', async () => {
    saveAsync.mockResolvedValue({ uri: 'file:///out.jpg', width: 1200, height: 1600 });
    await resizeImage({ uri: 'file:///in.jpg', width: 3000, height: 4000 });
    expect(resizeCall).toHaveBeenCalledWith({ height: MAX_SIDE });
  });

  it('una foto que ya cabe no se redimensiona, pero sí se recomprime a JPEG', async () => {
    saveAsync.mockResolvedValue({ uri: 'file:///out.jpg', width: 800, height: 600 });
    const result = await resizeImage({ uri: 'file:///in.png', width: 800, height: 600 });
    expect(resizeCall).not.toHaveBeenCalled();
    expect(saveAsync).toHaveBeenCalledWith({ format: SaveFormat.JPEG, compress: JPEG_QUALITY });
    expect(result.uri).toBe('file:///out.jpg');
  });

  it('si el módulo nativo falla, el error sube tal cual', async () => {
    renderAsync.mockRejectedValue(new Error('boom'));
    await expect(resizeImage({ uri: 'x', width: 10, height: 10 })).rejects.toThrow('boom');
  });
});
