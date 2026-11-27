import { fireEvent, render, screen } from '@testing-library/react-native';
import { RegisterScreen } from '@/features/auth/screens/RegisterScreen';
import { es } from '@/i18n/es-MX';
import { getConfig } from '@/lib/config';

// Spec 021-T009: suite de seguridad propia de la pantalla de registro (S-01, S-03, S-05).
const mockSignUp = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: () => true,
  }),
}));
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({ signUp: mockSignUp }),
}));
jest.mock('@/lib/config', () => {
  const actual = jest.requireActual<typeof import('@/lib/config')>('@/lib/config');
  return { ...actual, getConfig: jest.fn() };
});

// El primer render de la suite carga en frío el árbol de pantallas y puede pasar de 5 s.
jest.setTimeout(30_000);
const t = es.auth.register;
const SECRETO = 'Contra-Secreta-123';

beforeEach(() => {
  mockSignUp.mockReset();
  jest.mocked(getConfig).mockReturnValue({
    apiBaseUrl: 'http://api.test',
    appEnv: 'development',
    legalBaseUrl: 'https://sitio.example',
  });
});

async function llenar(pwd: string, confirm: string, marcar = true) {
  await fireEvent.changeText(screen.getByLabelText(t.name), 'Ana López');
  await fireEvent.changeText(screen.getByLabelText(t.email), 'ana@example.com');
  await fireEvent.changeText(screen.getByLabelText(t.password), pwd);
  await fireEvent.changeText(screen.getByLabelText(t.confirm), confirm);
  if (marcar) {
    await fireEvent.press(screen.getByRole('checkbox', { name: t.adult }));
    await fireEvent.press(screen.getByRole('checkbox', { name: /Acepto los/ }));
  }
  await fireEvent.press(screen.getByRole('button', { name: t.submit }));
}

describe('RegisterScreen (seguridad)', () => {
  it('las dos contraseñas están enmascaradas y piden «nueva contraseña» al gestor', async () => {
    await render(<RegisterScreen />);
    for (const etiqueta of [t.password, t.confirm]) {
      const campo = screen.getByLabelText(etiqueta);
      expect(campo.props.secureTextEntry).toBe(true);
      expect(campo.props.autoComplete).toBe('new-password');
    }
  });

  it('si las contraseñas no coinciden no se envía nada al servidor', async () => {
    await render(<RegisterScreen />);
    await llenar(SECRETO, `${SECRETO}x`);
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('sin aceptar la mayoría de edad y los términos no se crea la cuenta', async () => {
    await render(<RegisterScreen />);
    await llenar(SECRETO, SECRETO, false);
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('una contraseña corta no se envía ni se muestra en pantalla', async () => {
    await render(<RegisterScreen />);
    await llenar('1234', '1234');
    expect(mockSignUp).not.toHaveBeenCalled();
    expect(screen.queryByText(/1234/)).toBeNull();
  });

  it('un fallo del servidor no vuelca la contraseña en la consola ni en pantalla', async () => {
    const espias = (['log', 'warn', 'error', 'info'] as const).map((m) =>
      jest.spyOn(console, m).mockImplementation(() => undefined),
    );
    mockSignUp.mockRejectedValue(new Error('boom'));
    await render(<RegisterScreen />);
    await llenar(SECRETO, SECRETO);
    await screen.findByRole('alert');
    expect(screen.queryByText(new RegExp(SECRETO))).toBeNull();
    for (const espia of espias) expect(JSON.stringify(espia.mock.calls)).not.toContain(SECRETO);
    espias.forEach((e) => e.mockRestore());
  });
});
