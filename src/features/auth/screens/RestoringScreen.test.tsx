import { render, screen } from '@testing-library/react-native';
import { RestoringScreen } from '@/features/auth/screens/RestoringScreen';
import { es } from '@/i18n/es-MX';

jest.setTimeout(30_000);

describe('RestoringScreen (spec 003 §7.12)', () => {
  it('muestra un indicador accesible de progreso con la etiqueta de restauración', async () => {
    await render(<RestoringScreen />);
    expect(screen.getByRole('progressbar', { name: es.auth.restoring })).toBeTruthy();
  });

  it('no muestra texto visible ni botones mientras restaura la sesión', async () => {
    await render(<RestoringScreen />);
    expect(screen.queryByText(es.auth.restoring)).toBeNull();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
