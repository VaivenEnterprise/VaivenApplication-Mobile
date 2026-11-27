import { fireEvent, render, screen } from '@testing-library/react-native';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { es } from '@/i18n/es-MX';
import { ApiError } from '@/lib/api/errors';

// Spec 021-T009: suite de seguridad propia de la pantalla de inicio de sesión (S-01, S-03, S-05).
const mockPush = jest.fn();
const mockSignIn = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn(), canGoBack: () => true }),
}));
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({ signIn: mockSignIn }),
}));

// El primer render de la suite carga en frío el árbol de pantallas y puede pasar de 5 s.
jest.setTimeout(30_000);
const t = es.auth.login;
const SECRETO = 'Contra-Secreta-123';

async function enviar(password = SECRETO) {
  await fireEvent.changeText(screen.getByLabelText(t.email), 'ana@example.com');
  await fireEvent.changeText(screen.getByLabelText(t.password), password);
  await fireEvent.press(screen.getByRole('button', { name: t.submit }));
}

beforeEach(() => {
  mockSignIn.mockReset();
  mockPush.mockReset();
});

describe('LoginScreen (seguridad)', () => {
  it('la contraseña está enmascarada por defecto y con autocompletado de credenciales', async () => {
    await render(<LoginScreen />);
    const campo = screen.getByLabelText(t.password);
    expect(campo.props.secureTextEntry).toBe(true);
    expect(campo.props.autoComplete).toBe('current-password');
  });

  it('el ojo solo cambia la visibilidad del campo, no la envía a ningún sitio', async () => {
    await render(<LoginScreen />);
    await fireEvent.press(screen.getByRole('button', { name: es.auth.showPassword }));
    expect(screen.getByLabelText(t.password).props.secureTextEntry).toBe(false);
    expect(mockSignIn).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('un fallo de credenciales no revela si el correo existe ni repite la contraseña', async () => {
    mockSignIn.mockRejectedValue(new ApiError('unauthorized', 'x', 401, 'r'));
    await render(<LoginScreen />);
    await enviar();
    expect(await screen.findByText(es.auth.formErrors.invalidCredentials)).toBeTruthy();
    expect(screen.queryByText(new RegExp(SECRETO))).toBeNull();
    expect(screen.queryByText(/no existe|no registrado|not found/i)).toBeNull();
  });

  it('la contraseña no llega al registro de consola ni a la navegación al fallar', async () => {
    const espias = (['log', 'warn', 'error', 'info'] as const).map((m) =>
      jest.spyOn(console, m).mockImplementation(() => undefined),
    );
    mockSignIn.mockRejectedValue(new Error('boom'));
    await render(<LoginScreen />);
    await enviar();
    await screen.findByRole('alert');
    for (const espia of espias) expect(JSON.stringify(espia.mock.calls)).not.toContain(SECRETO);
    expect(JSON.stringify(mockPush.mock.calls)).not.toContain(SECRETO);
    espias.forEach((e) => e.mockRestore());
  });

  it('con datos inválidos no se envía nada al servidor', async () => {
    await render(<LoginScreen />);
    await enviar('corta');
    expect(mockSignIn).not.toHaveBeenCalled();
  });
});
