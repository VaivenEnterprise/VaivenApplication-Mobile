import * as ImagePicker from 'expo-image-picker';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useEffect } from 'react';
import { Linking } from 'react-native';
import * as api from '@/features/images/api';
import { ImageUploadError } from '@/features/images/cloudinary';
import { PhotoPicker } from '@/features/images/components/PhotoPicker';
import { useImageUpload } from '@/features/images/useImageUpload';
import { es } from '@/i18n/es-MX';

jest.mock('@/features/images/api', () => ({ uploadImage: jest.fn() }));
jest.mock('@/features/images/resize', () => ({
  resizeImage: jest.fn(async (image: { uri: string }) => ({
    uri: `${image.uri}-r`,
    width: 1600,
    height: 1200,
  })),
}));
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const t = es.images;
const uploadImage = jest.mocked(api.uploadImage);
const picker = jest.mocked(ImagePicker);
const asset = (n: number) => ({ uri: `file:///${n}.jpg`, width: 4000, height: 3000 });

const latest: { current: ReturnType<typeof useImageUpload> | null } = { current: null };
function Harness({ max }: { max?: number }) {
  const uploader = useImageUpload('item_photo');
  useEffect(() => {
    latest.current = uploader;
  });
  return <PhotoPicker uploader={uploader} max={max} />;
}

const addButton = (count: number, max: number) =>
  screen.getByRole('button', { name: `${t.picker.add}, ${count} ${t.picker.of} ${max}` });

async function addFromGallery(count: number, max = 5, current = 0) {
  picker.launchImageLibraryAsync.mockResolvedValueOnce({
    canceled: false,
    assets: Array.from({ length: count }, (_, index) => asset(current + index + 1)),
  } as never);
  await fireEvent.press(addButton(current, max));
  await fireEvent.press(await screen.findByText(t.picker.chooseGallery));
}

beforeEach(() => {
  // Solo se reinician los dobles de este archivo: `resetAllMocks` borraría los de jest-expo.
  for (const double of [
    uploadImage,
    picker.requestCameraPermissionsAsync,
    picker.launchCameraAsync,
    picker.launchImageLibraryAsync,
  ]) {
    double.mockReset();
  }
  latest.current = null;
  uploadImage.mockImplementation(async (_purpose, file) => ({ publicId: `id:${file.uri}` }));
  picker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true } as never);
});
afterEach(() => jest.restoreAllMocks());

describe('PhotoPicker: elegir', () => {
  it('sin fotos muestra solo la casilla «+» con el contador 0/5', async () => {
    await render(<Harness />);
    expect(screen.getByText('0/5')).toBeTruthy();
    expect(screen.queryByText(t.picker.cover)).toBeNull();
  });

  it('tocar «+» abre la hoja con «Tomar foto» y «Elegir de la galería»', async () => {
    await render(<Harness />);
    await fireEvent.press(addButton(0, 5));
    expect(await screen.findByText(t.picker.takePhoto)).toBeTruthy();
    expect(screen.getByText(t.picker.chooseGallery)).toBeTruthy();
  });

  it('elegir de la galería agrega las fotos, las sube y la primera lleva «Portada»', async () => {
    await render(<Harness />);
    await addFromGallery(2);
    await waitFor(() => expect(latest.current?.allDone).toBe(true));
    expect(screen.getByText('2/5')).toBeTruthy();
    expect(screen.getAllByText(t.picker.cover)).toHaveLength(1);
    expect(
      screen.getByLabelText(new RegExp(`${t.picker.photoLabel} 1, ${t.picker.cover}`)),
    ).toBeTruthy();
    expect(latest.current?.refs).toHaveLength(2);
  });

  it('tomar una foto con la cámara la agrega', async () => {
    picker.launchCameraAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [asset(1)],
    } as never);
    await render(<Harness />);
    await fireEvent.press(addButton(0, 5));
    await fireEvent.press(await screen.findByText(t.picker.takePhoto));
    await waitFor(() => expect(latest.current?.allDone).toBe(true));
    expect(screen.getByText('1/5')).toBeTruthy();
  });

  it('CA-05: con límite 2 y 3 fotos elegidas solo entran 2, y «+» desaparece', async () => {
    await render(<Harness max={2} />);
    await addFromGallery(3, 2);
    await waitFor(() => expect(latest.current?.allDone).toBe(true));
    expect(latest.current?.items).toHaveLength(2);
    expect(screen.queryByRole('button', { name: new RegExp(t.picker.add) })).toBeNull();
    expect(screen.getByText(t.picker.limitReached)).toBeTruthy();
  });
});

describe('PhotoPicker: estados por foto', () => {
  it('mientras sube muestra el anillo de avance y después lo quita', async () => {
    let finish: (value: { publicId: string }) => void = () => undefined;
    uploadImage.mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)));
    await render(<Harness />);
    await addFromGallery(1);
    expect(
      await screen.findByTestId('upload-progress', { includeHiddenElements: true }),
    ).toBeTruthy();
    finish({ publicId: 'x' });
    await waitFor(() =>
      expect(screen.queryByTestId('upload-progress', { includeHiddenElements: true })).toBeNull(),
    );
  });

  it('CA-02: una subida fallida muestra el error y tocar la foto la reintenta', async () => {
    uploadImage.mockRejectedValueOnce(new ImageUploadError('upload', true));
    await render(<Harness />);
    await addFromGallery(1);
    expect(await screen.findByTestId('upload-failed')).toBeTruthy();
    expect(screen.getByText(t.errors.upload).props.accessibilityRole).toBe('alert');

    picker.launchImageLibraryAsync.mockClear();
    await fireEvent.press(screen.getByLabelText(new RegExp(`${t.picker.photoLabel} 1`)));
    await waitFor(() => expect(latest.current?.allDone).toBe(true));
    expect(uploadImage).toHaveBeenCalledTimes(2);
    expect(picker.launchImageLibraryAsync).not.toHaveBeenCalled();
    expect(screen.queryByTestId('upload-failed')).toBeNull();
  });

  it('un error no reintentable muestra su mensaje y no ofrece reintento al tocar', async () => {
    uploadImage.mockRejectedValueOnce(new ImageUploadError('too_large', false));
    await render(<Harness />);
    await addFromGallery(1);
    expect(await screen.findByText(t.errors.tooLarge)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(new RegExp(`${t.picker.photoLabel} 1`)));
    expect(uploadImage).toHaveBeenCalledTimes(1);
  });
});

describe('PhotoPicker: quitar y portada', () => {
  it('la «X» quita la foto y libera su casilla', async () => {
    await render(<Harness />);
    await addFromGallery(2);
    await waitFor(() => expect(latest.current?.allDone).toBe(true));
    await fireEvent.press(screen.getByRole('button', { name: `${t.picker.remove} 1` }));
    expect(latest.current?.items).toHaveLength(1);
    expect(screen.getByText('1/5')).toBeTruthy();
  });

  it('pulsación larga → «Hacer portada» mueve la foto al inicio', async () => {
    await render(<Harness />);
    await addFromGallery(2);
    await waitFor(() => expect(latest.current?.allDone).toBe(true));
    const secondId = latest.current!.items[1]!.id;
    await fireEvent(screen.getByLabelText(new RegExp(`${t.picker.photoLabel} 2`)), 'longPress');
    await fireEvent.press(await screen.findByText(t.picker.makeCover));
    expect(latest.current?.items[0]?.id).toBe(secondId);
  });

  it('la portada no ofrece «Hacer portada» pero sí «Quitar foto» en su menú', async () => {
    await render(<Harness />);
    await addFromGallery(1);
    await waitFor(() => expect(latest.current?.allDone).toBe(true));
    await fireEvent(screen.getByLabelText(new RegExp(`${t.picker.photoLabel} 1`)), 'longPress');
    expect(await screen.findByText(t.picker.remove)).toBeTruthy();
    expect(screen.queryByText(t.picker.makeCover)).toBeNull();
    await fireEvent.press(screen.getByText(t.picker.remove));
    expect(latest.current?.items).toHaveLength(0);
  });

  it('accesibilidad: acciones «Hacer portada» y «Quitar foto» sin pulsación larga', async () => {
    await render(<Harness />);
    await addFromGallery(2);
    await waitFor(() => expect(latest.current?.allDone).toBe(true));
    const second = screen.getByLabelText(new RegExp(`${t.picker.photoLabel} 2`));
    expect(second.props.accessibilityActions.map((a: { name: string }) => a.name)).toEqual([
      'makeCover',
      'remove',
    ]);
    const secondId = latest.current!.items[1]!.id;
    await fireEvent(second, 'accessibilityAction', { nativeEvent: { actionName: 'makeCover' } });
    expect(latest.current?.items[0]?.id).toBe(secondId);
  });
});

describe('PhotoPicker: permisos (CA-03)', () => {
  it('cámara negada → mensaje en español y botón a Ajustes; «Ahora no» lo cierra', async () => {
    picker.requestCameraPermissionsAsync.mockResolvedValue({ granted: false } as never);
    const settings = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    await render(<Harness />);
    await fireEvent.press(addButton(0, 5));
    await fireEvent.press(await screen.findByText(t.picker.takePhoto));
    expect(await screen.findByText(t.permissions.cameraTitle)).toBeTruthy();
    expect(screen.getByText(t.permissions.cameraDenied)).toBeTruthy();
    expect(picker.launchCameraAsync).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole('button', { name: t.permissions.openSettings }));
    expect(settings).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByRole('button', { name: t.permissions.dismiss }));
    expect(screen.queryByText(t.permissions.cameraTitle)).toBeNull();
  });
});
