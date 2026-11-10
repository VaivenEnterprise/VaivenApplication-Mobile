import { render, screen } from '@testing-library/react-native';
import { UploadProgress } from '@/features/images/components/UploadProgress';

const root = () => screen.getByTestId('ring', { includeHiddenElements: true });

describe('UploadProgress', () => {
  it('es decorativo para los lectores de pantalla (la foto ya anuncia su estado)', async () => {
    await render(<UploadProgress progress={0.5} testID="ring" />);
    expect(root().props.accessibilityElementsHidden).toBe(true);
  });

  it.each([-1, 0, 0.5, 1, 7])('acepta %s sin romperse (se recorta a 0–1)', async (value) => {
    await render(<UploadProgress progress={value} testID="ring" />);
    expect(root()).toBeTruthy();
  });
});
