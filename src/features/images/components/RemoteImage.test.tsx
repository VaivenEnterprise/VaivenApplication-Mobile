import { fireEvent, render, screen } from '@testing-library/react-native';
import { RemoteImage } from '@/features/images/components/RemoteImage';
import type { RemoteImageData } from '@/features/images/types';
import { es } from '@/i18n/es-MX';

const data: RemoteImageData = {
  publicId: 'vaiven/item_photo/u/1',
  url: 'https://cdn.example/full.jpg',
  thumbUrl: 'https://cdn.example/thumb.jpg',
};

const imageNode = () => screen.getByTestId('remote-image');

describe('RemoteImage', () => {
  it('CA-04: con variant thumb muestra la miniatura del CDN', async () => {
    await render(<RemoteImage image={data} />);
    expect(imageNode().props.source).toEqual([{ uri: data.thumbUrl }]);
  });

  it('con variant full usa la URL completa', async () => {
    await render(<RemoteImage image={data} variant="full" />);
    expect(imageNode().props.source).toEqual([{ uri: data.url }]);
  });

  it('las fotos normales usan caché en disco y la evidencia, ninguna (P-06)', async () => {
    const { rerender } = await render(<RemoteImage image={data} />);
    expect(imageNode().props.cachePolicy).toBe('memory-disk');
    await rerender(<RemoteImage image={data} evidence />);
    expect(imageNode().props.cachePolicy).toBe('none');
  });

  it('mientras carga muestra el Skeleton y al cargar lo quita', async () => {
    await render(<RemoteImage image={data} />);
    expect(screen.getByTestId('remote-image-loading')).toBeTruthy();
    await fireEvent(imageNode(), 'load', { nativeEvent: {} });
    expect(screen.queryByTestId('remote-image-loading')).toBeNull();
    expect(screen.queryByTestId('remote-image-failed')).toBeNull();
  });

  it('si falla muestra el fondo con ícono, sin texto de error visible', async () => {
    await render(<RemoteImage image={data} />);
    await fireEvent(imageNode(), 'error', { nativeEvent: { error: 'x' } });
    expect(screen.getByTestId('remote-image-failed')).toBeTruthy();
    expect(screen.queryByTestId('remote-image-loading')).toBeNull();
    expect(screen.queryByText(es.images.remote.failed)).toBeNull();
    expect(screen.getByLabelText(es.images.remote.failed)).toBeTruthy();
  });

  it('sin imagen (null) muestra el estado de error y no intenta cargar nada', async () => {
    await render(<RemoteImage image={null} />);
    expect(screen.queryByTestId('remote-image')).toBeNull();
    expect(screen.getByTestId('remote-image-failed')).toBeTruthy();
  });

  it('al cambiar de URL vuelve a empezar desde «cargando»', async () => {
    const { rerender } = await render(<RemoteImage image={data} />);
    await fireEvent(imageNode(), 'error', { nativeEvent: { error: 'x' } });
    expect(screen.getByTestId('remote-image-failed')).toBeTruthy();
    await rerender(<RemoteImage image={{ ...data, thumbUrl: 'https://cdn.example/other.jpg' }} />);
    expect(screen.queryByTestId('remote-image-failed')).toBeNull();
    expect(screen.getByTestId('remote-image-loading')).toBeTruthy();
  });

  it('con texto alternativo la imagen es accesible; sin él es decorativa', async () => {
    const { rerender } = await render(<RemoteImage image={data} accessibilityLabel="Taladro" />);
    expect(imageNode().props.accessible).toBe(true);
    expect(imageNode().props.accessibilityLabel).toBe('Taladro');
    await rerender(<RemoteImage image={data} />);
    expect(imageNode().props.accessible).toBe(false);
  });
});
