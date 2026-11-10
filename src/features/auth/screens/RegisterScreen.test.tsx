import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { RegisterScreen } from '@/features/auth/screens/RegisterScreen';
import { es } from '@/i18n/es-MX';
import { ApiError } from '@/lib/api/errors';
import { getConfig } from '@/lib/config';

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockSignUp = jest.fn();
let mockCanGoBack = true;

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
    back: mockBack,
    canGoBack: () => mockCanGoBack,
  }),
}));
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({ signUp: mockSignUp }),
}));
jest.mock('@/lib/config', () => {
  const actual = jest.requireActual<typeof import('@/lib/config')>('@/lib/config');
  return { ...actual, getConfig: jest.fn() };
});

const t = es.auth.register;
const v = es.auth.validation;

const mockedConfig = jest.mocked(getConfig);

beforeEach(() => {
  mockSignUp.mockReset();
  mockBack.mockReset();
  mockReplace.mockReset();
  mockCanGoBack = true;
  mockedConfig.mockReturnValue({
    apiBaseUrl: 'http://api.test',
    appEnv: 'development',
    legalBaseUrl: 'https://sitio.example',
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

async function fillAll(
  overrides: Partial<Record<'name' | 'email' | 'pwd' | 'confirm', string>> = {},
) {
  await fireEvent.changeText(screen.getByLabelText(t.name), overrides.name ?? 'Ana López');
  await fireEvent.changeText(screen.getByLabelText(t.email), overrides.email ?? 'ana@example.com');
  await fireEvent.changeText(screen.getByLabelText(t.password), overrides.pwd ?? 'una-contrasena');
  await fireEvent.changeText(
    screen.getByLabelText(t.confirm),
    overrides.confirm ?? 'una-contrasena',
  );
}

const adultBox = () => screen.getByRole('checkbox', { name: t.adult });
const termsBox = () => screen.getByRole('checkbox', { name: /Acepto los/ });
const submit = () => fireEvent.press(screen.getByRole('button', { name: t.submit }));

async function fillValidForm() {
  await fillAll();
  await fireEvent.press(adultBox());
  await fireEvent.press(termsBox());
}

describe('RegisterScreen: contenido', () => {
  it('muestra cabecera, tarjeta de confianza, cuatro campos y dos casillas, sin teléfono', async () => {
    await render(<RegisterScreen />);
    expect(screen.getByText(t.title)).toBeTruthy();
    expect(screen.getByText(t.subtitle)).toBeTruthy();
    expect(screen.getByText(t.safeChip)).toBeTruthy();
    expect(screen.getByText(t.trustTitle)).toBeTruthy();
    expect(screen.getByText(t.trustText)).toBeTruthy();
    for (const label of [t.name, t.email, t.password, t.confirm]) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
    expect(screen.queryByLabelText(/teléfono/i)).toBeNull();
  });

  it('«Volver» regresa y, sin historial, lleva a inicio de sesión', async () => {
    await render(<RegisterScreen />);
    await fireEvent.press(screen.getByRole('button', { name: es.common.back }));
    expect(mockBack).toHaveBeenCalledTimes(1);

    mockCanGoBack = false;
    await fireEvent.press(screen.getByRole('button', { name: es.common.back }));
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('«Inicia sesión» abre el inicio de sesión', async () => {
    await render(<RegisterScreen />);
    await fireEvent.press(screen.getByRole('link', { name: t.signIn }));
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });
});

describe('RegisterScreen: enlaces legales', () => {
  it('«términos de uso» y «aviso de privacidad» abren las páginas públicas', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue();
    await render(<RegisterScreen />);
    await fireEvent.press(screen.getByText(t.termsLink));
    await fireEvent.press(screen.getByText(t.privacyLink));
    expect(open).toHaveBeenNthCalledWith(1, 'https://sitio.example/terminos/');
    expect(open).toHaveBeenNthCalledWith(2, 'https://sitio.example/privacidad/');
  });

  it('sin sitio configurado el texto se muestra sin enlace', async () => {
    mockedConfig.mockReturnValue({ apiBaseUrl: 'http://api.test', appEnv: 'development' });
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue();
    await render(<RegisterScreen />);
    expect(screen.getByText(t.termsLink)).toBeTruthy();
    await fireEvent.press(screen.getByText(t.termsLink));
    expect(open).not.toHaveBeenCalled();
    expect(screen.queryAllByRole('link', { name: t.termsLink })).toHaveLength(0);
  });
});

describe('RegisterScreen: validación sin llamar a la API', () => {
  it('CA-08: contraseñas distintas → error bajo «Confirmar contraseña»', async () => {
    await render(<RegisterScreen />);
    await fillAll({ confirm: 'otra-contrasena' });
    await fireEvent.press(adultBox());
    await fireEvent.press(termsBox());
    await submit();

    expect(await screen.findByText(v.confirmMismatch)).toBeTruthy();
    expect(mockSignUp).not.toHaveBeenCalled();
    // Solo ese campo queda en error.
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });

  it('CA-05: contraseña corta → error en el campo', async () => {
    await render(<RegisterScreen />);
    await fillAll({ pwd: '1234', confirm: '1234' });
    await fireEvent.press(adultBox());
    await fireEvent.press(termsBox());
    await submit();
    expect(await screen.findByText(v.passwordTooShort)).toBeTruthy();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('formulario vacío: marca los campos y las dos casillas', async () => {
    await render(<RegisterScreen />);
    await submit();
    expect(await screen.findByText(v.nameRequired)).toBeTruthy();
    expect(screen.getByText(v.emailRequired)).toBeTruthy();
    expect(screen.getByText(v.passwordRequired)).toBeTruthy();
    expect(screen.getByText(v.confirmRequired)).toBeTruthy();
    expect(screen.getByText(v.adultRequired)).toBeTruthy();
    expect(screen.getByText(v.termsRequired)).toBeTruthy();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('sin marcar «Acepto» no envía', async () => {
    await render(<RegisterScreen />);
    await fillAll();
    await fireEvent.press(adultBox());
    await submit();
    expect(await screen.findByText(v.termsRequired)).toBeTruthy();
    expect(screen.queryByText(v.adultRequired)).toBeNull();
    expect(mockSignUp).not.toHaveBeenCalled();
  });
});

describe('RegisterScreen: envío (CA-01)', () => {
  it('envía los datos y las casillas marcadas', async () => {
    mockSignUp.mockResolvedValue(undefined);
    await render(<RegisterScreen />);
    await fillValidForm();
    await submit();
    await waitFor(() => expect(mockSignUp).toHaveBeenCalledTimes(1));
    expect(mockSignUp).toHaveBeenCalledWith({
      displayName: 'Ana López',
      email: 'ana@example.com',
      password: 'una-contrasena',
      confirmPassword: 'una-contrasena',
      isAdult: true,
      acceptTerms: true,
    });
  });

  it('mientras envía muestra cargando y no permite reenviar', async () => {
    let resolve: () => void = () => undefined;
    mockSignUp.mockReturnValue(
      new Promise<void>((done) => {
        resolve = done;
      }),
    );
    await render(<RegisterScreen />);
    await fillValidForm();
    await submit();
    const button = await screen.findByRole('button', { name: t.submit, busy: true });
    await fireEvent.press(button);
    expect(mockSignUp).toHaveBeenCalledTimes(1);
    resolve();
    await waitFor(() => expect(screen.getByRole('button', { name: t.submit })).not.toBeDisabled());
  });

  it('409: marca el correo en su campo', async () => {
    mockSignUp.mockRejectedValue(new ApiError('conflict', 'x', 409, 'r'));
    await render(<RegisterScreen />);
    await fillValidForm();
    await submit();
    expect(await screen.findByText(es.auth.formErrors.emailTaken)).toBeTruthy();
  });

  it.each([
    [new ApiError('rate_limited', 'x', 429, 'r'), es.auth.formErrors.rateLimited],
    [new ApiError('service_unavailable', 'x', 503, 'r'), es.errors.service_unavailable],
    [new Error('boom'), es.errors.unexpected],
  ])('muestra el aviso del formulario ante %s', async (error, message) => {
    mockSignUp.mockRejectedValue(error);
    await render(<RegisterScreen />);
    await fillValidForm();
    await submit();
    expect(within(await screen.findByRole('alert')).getByText(message)).toBeTruthy();
  });
});
