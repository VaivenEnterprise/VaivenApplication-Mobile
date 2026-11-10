import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { es } from '@/i18n/es-MX';
import { ApiError } from '@/lib/api/errors';

const mockPush = jest.fn();
const mockSignIn = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn(), canGoBack: () => true }),
}));
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({ signIn: mockSignIn }),
}));

const t = es.auth.login;

async function fill(email: string, password: string) {
  await fireEvent.changeText(screen.getByLabelText(t.email), email);
  await fireEvent.changeText(screen.getByLabelText(t.password), password);
}

const submit = () => fireEvent.press(screen.getByRole('button', { name: t.submit }));

beforeEach(() => {
  mockSignIn.mockReset();
  mockPush.mockReset();
});

describe('LoginScreen: contenido (CA-07)', () => {
  it('solo muestra correo, contraseña con ojo, el botón y el enlace «Crea una»', async () => {
    await render(<LoginScreen />);
    expect(screen.getByLabelText(t.email)).toBeTruthy();
    expect(screen.getByLabelText(t.password)).toBeTruthy();
    expect(screen.getByRole('button', { name: es.auth.showPassword })).toBeTruthy();
    expect(screen.getByRole('button', { name: t.submit })).toBeTruthy();
    expect(screen.getByRole('link', { name: t.createOne })).toBeTruthy();
    // Solo hay dos campos y dos botones (enviar y ojo).
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.queryByText(/compartir|olvidaste|explorar la app/i)).toBeNull();
    expect(screen.getByText(t.titleAccent)).toBeTruthy();
  });

  it.each([
    [844, true],
    [640, false],
  ])('con una altura útil de %s pt, ilustración visible: %s', async (height, visible) => {
    const window = { width: 390, height, scale: 2, fontScale: 1 };
    jest.spyOn(Dimensions, 'get').mockImplementation(() => window);
    await render(<LoginScreen />);
    const illustration = screen.queryByTestId('neighborhood-illustration', { hidden: true });
    expect(illustration !== null).toBe(visible);
  });

  it('el enlace «Crea una» abre el registro', async () => {
    await render(<LoginScreen />);
    await fireEvent.press(screen.getByRole('link', { name: t.createOne }));
    expect(mockPush).toHaveBeenCalledWith('/register');
  });
});

describe('LoginScreen: validación (CA-05)', () => {
  it('con la contraseña corta muestra el error y no llama a la API', async () => {
    await render(<LoginScreen />);
    await fill('ana@example.com', '1234');
    await submit();
    expect(await screen.findByText(es.auth.validation.passwordTooShort)).toBeTruthy();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('con campos vacíos pide correo y contraseña', async () => {
    await render(<LoginScreen />);
    await submit();
    expect(await screen.findByText(es.auth.validation.emailRequired)).toBeTruthy();
    expect(screen.getByText(es.auth.validation.passwordRequired)).toBeTruthy();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('con un correo inválido lo marca', async () => {
    await render(<LoginScreen />);
    await fill('no-es-correo', '12345678');
    await submit();
    expect(await screen.findByText(es.auth.validation.emailInvalid)).toBeTruthy();
  });
});

describe('LoginScreen: envío', () => {
  it('envía el correo recortado y la contraseña', async () => {
    mockSignIn.mockResolvedValue(undefined);
    await render(<LoginScreen />);
    await fill('  ana@example.com ', '12345678');
    await submit();
    await waitFor(() =>
      expect(mockSignIn).toHaveBeenCalledWith({ email: 'ana@example.com', password: '12345678' }),
    );
  });

  it('mientras envía muestra el estado cargando y bloquea el reenvío', async () => {
    let resolve: () => void = () => undefined;
    mockSignIn.mockReturnValue(
      new Promise<void>((done) => {
        resolve = done;
      }),
    );
    await render(<LoginScreen />);
    await fill('ana@example.com', '12345678');
    await submit();

    const button = await screen.findByRole('button', { name: t.submit, busy: true });
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(mockSignIn).toHaveBeenCalledTimes(1);

    resolve();
    await waitFor(() => expect(screen.getByRole('button', { name: t.submit })).not.toBeDisabled());
  });

  it.each([
    [new ApiError('unauthorized', 'x', 401, 'r'), es.auth.formErrors.invalidCredentials],
    [new ApiError('rate_limited', 'x', 429, 'r'), es.auth.formErrors.rateLimited],
    [new ApiError('network_error', 'x', null, 'r'), es.errors.network_error],
    [new Error('boom'), es.errors.unexpected],
  ])('muestra el aviso del formulario ante %s', async (error, message) => {
    mockSignIn.mockRejectedValue(error);
    await render(<LoginScreen />);
    await fill('ana@example.com', '12345678');
    await submit();
    expect(within(await screen.findByRole('alert')).getByText(message)).toBeTruthy();
  });

  it('el aviso se limpia al volver a enviar', async () => {
    mockSignIn.mockRejectedValueOnce(new ApiError('unauthorized', 'x', 401, 'r'));
    mockSignIn.mockResolvedValueOnce(undefined);
    await render(<LoginScreen />);
    await fill('ana@example.com', '12345678');
    await submit();
    expect(await screen.findByRole('alert')).toBeTruthy();
    await submit();
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });
});
