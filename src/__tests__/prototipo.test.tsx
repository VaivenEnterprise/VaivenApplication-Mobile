import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from '@/app/prototipo/(auth)/login';
import RegisterScreen from '@/app/prototipo/(auth)/register';
import AccountScreen from '@/app/prototipo/(tabs)/cuenta';
import ExploreScreen from '@/app/prototipo/(tabs)/explorar';
import HomeScreen from '@/app/prototipo/(tabs)/index';
import AssistantScreen from '@/app/prototipo/asistente';
import ProjectDetailScreen from '@/app/prototipo/herramienta/[id]';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { esMX as t } from '@/i18n/es-MX';
import { mariana } from '@/mocks/users';

const mockRouter = {
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
  push: jest.fn(),
  replace: jest.fn(),
};

let mockDetailId = 'project-hang-picture';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: mockDetailId }),
  useRouter: () => mockRouter,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

const metrics = {
  frame: { height: 844, width: 390, x: 0, y: 0 },
  insets: { bottom: 0, left: 0, right: 0, top: 0 },
};

function renderScreen(element: ReactElement) {
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <AuthProvider>{element}</AuthProvider>
    </SafeAreaProvider>,
  );
}

describe('pantallas del prototipo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDetailId = 'project-hang-picture';
  });

  it('Inicio invitado muestra proyectos y al entrar muestra kit y trabajos', async () => {
    await renderScreen(<HomeScreen />);

    expect(screen.getByText(t.home.guestGreeting)).toBeTruthy();
    expect(screen.getByText(t.home.popularProjects)).toBeTruthy();
    expect(screen.queryByText(t.home.kitTitle)).toBeNull();
    expect(screen.getAllByText('Colgar un cuadro').length).toBeGreaterThan(0);

    await fireEvent.press(screen.getByRole('button', { name: t.home.enter }));

    expect(screen.getByText(t.home.userGreeting(mariana.name))).toBeTruthy();
    expect(screen.getByText(t.home.location)).toBeTruthy();
    expect(screen.getByText(t.home.kitTitle)).toBeTruthy();
    expect(screen.getByText(t.home.recentWork)).toBeTruthy();
    expect(screen.getByLabelText(t.assistant.fabLabel)).toBeTruthy();
  });

  it('Explorar muestra las herramientas y sus estados', async () => {
    await renderScreen(<ExploreScreen />);

    expect(screen.getByText(t.explore.subtitle)).toBeTruthy();
    expect(screen.getByText('Taladro percutor')).toBeTruthy();
    expect(screen.getByText('Nivel de burbuja')).toBeTruthy();
    expect(screen.getByText('Juego de brocas')).toBeTruthy();
    expect(screen.getByText(t.tools.status.lent)).toBeTruthy();
  });

  it('Asistente responde a un mensaje', async () => {
    await renderScreen(<AssistantScreen />);

    expect(screen.getByText(t.assistant.initialMessages[0]?.text ?? '')).toBeTruthy();
    await fireEvent.changeText(
      screen.getByPlaceholderText(t.assistant.placeholder),
      'Necesito un taladro',
    );
    await fireEvent.press(screen.getByRole('button', { name: t.assistant.send }));

    expect(screen.getByText('Necesito un taladro')).toBeTruthy();
    expect(screen.getByText(t.assistant.mockReply)).toBeTruthy();
  });

  it('Cuenta entra como Mariana y acepta una solicitud', async () => {
    await renderScreen(<AccountScreen />);

    expect(screen.getByText(t.account.guestTitle)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: t.auth.signIn }));

    expect(screen.getByText(mariana.name)).toBeTruthy();
    expect(screen.getByText(t.requests.status.pending)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: t.requests.accept }));

    expect(screen.queryByText(t.requests.status.pending)).toBeNull();
    expect(screen.getAllByText(t.requests.status.accepted)).toHaveLength(2);
  });

  it('Login valida, muestra carga y entra con datos válidos', async () => {
    await renderScreen(<LoginScreen />);

    expect(screen.getByText(t.auth.welcomeBack)).toBeTruthy();
    await fireEvent.changeText(
      screen.getByPlaceholderText(t.auth.emailPlaceholder),
      '  MARIANA@VAIVEN.MX ',
    );
    await fireEvent.changeText(screen.getByPlaceholderText(t.auth.passwordPlaceholder), 'Segura1!');

    const submit = screen.getByRole('button', { name: t.auth.signInCta });

    await fireEvent.press(submit);

    expect(submit.props.accessibilityState?.busy).toBe(true);
    expect(submit.props.accessibilityState?.disabled).toBe(true);
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/prototipo'));
  });

  it('Login muestra errores y no navega con datos inválidos', async () => {
    await renderScreen(<LoginScreen />);

    expect(screen.queryByText(t.auth.validation.emailRequired)).toBeNull();
    expect(screen.queryByText(t.auth.validation.passwordRequired)).toBeNull();

    await fireEvent.changeText(screen.getByPlaceholderText(t.auth.emailPlaceholder), 'mariana');
    await fireEvent.changeText(screen.getByPlaceholderText(t.auth.passwordPlaceholder), 'secreta');
    await fireEvent.press(screen.getByRole('button', { name: t.auth.signInCta }));

    expect(await screen.findByText(t.auth.validation.emailInvalid)).toBeTruthy();
    expect(screen.getByText(t.auth.validation.passwordMin)).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('Registro valida, muestra carga y crea la cuenta', async () => {
    await renderScreen(<RegisterScreen />);

    expect(screen.getByText(t.auth.safeCommunity)).toBeTruthy();
    expect(screen.getByText(t.auth.trustTitle)).toBeTruthy();
    await fireEvent.changeText(
      screen.getByPlaceholderText(t.auth.fullNamePlaceholder),
      '  Mariana   López ',
    );
    await fireEvent.changeText(
      screen.getByPlaceholderText(t.auth.emailPlaceholder),
      '  MARIANA@VAIVEN.MX ',
    );
    await fireEvent.changeText(screen.getByPlaceholderText(t.auth.phonePlaceholder), '5512345678');
    await fireEvent.changeText(screen.getByPlaceholderText(t.auth.passwordPlaceholder), 'Segura1!');
    await fireEvent.press(screen.getByRole('checkbox', { name: t.auth.terms }));

    const submit = screen.getByRole('button', { name: t.auth.createAccountCta });

    await fireEvent.press(submit);

    expect(submit.props.accessibilityState?.busy).toBe(true);
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/prototipo'));
  });

  it('Registro muestra errores y no navega con datos inválidos', async () => {
    await renderScreen(<RegisterScreen />);

    await fireEvent.press(screen.getByRole('button', { name: t.auth.createAccountCta }));

    expect(await screen.findByText(t.auth.validation.nameRequired)).toBeTruthy();
    expect(screen.getByText(t.auth.validation.emailRequired)).toBeTruthy();
    expect(screen.getByText(t.auth.validation.phoneRequired)).toBeTruthy();
    expect(screen.getByText(t.auth.validation.passwordRequired)).toBeTruthy();
    expect(screen.getByText(t.auth.validation.termsRequired)).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('Detalle resuelve el proyecto y permite pedir una herramienta', async () => {
    await renderScreen(<ProjectDetailScreen />);

    expect(screen.getByText('Colgar un cuadro')).toBeTruthy();
    expect(screen.getByText(t.tools.detailTitle)).toBeTruthy();
    expect(screen.getByText('Taladro percutor')).toBeTruthy();
    expect(screen.getByText(t.tools.owner('Carlos'))).toBeTruthy();
    expect(screen.getAllByText(t.tools.distance(3)).length).toBeGreaterThan(0);
    expect(screen.getByText(t.tools.mapTitle)).toBeTruthy();
    expect(screen.getByText(t.requests.title)).toBeTruthy();

    const firstRequestButton = screen.getAllByRole('button', { name: t.tools.request })[0];

    if (!firstRequestButton) {
      throw new Error('Request button not found');
    }

    await fireEvent.press(firstRequestButton);

    expect(screen.getByText(t.tools.requested)).toBeTruthy();
  });

  it('Detalle acepta id de herramienta y muestra vacío si no existe', async () => {
    mockDetailId = 'tool-drill';
    await renderScreen(<ProjectDetailScreen />);

    expect(screen.getByText('Colgar un cuadro')).toBeTruthy();

    await screen.unmount();
    mockDetailId = 'missing-detail';
    await renderScreen(<ProjectDetailScreen />);

    expect(screen.getByText(t.tools.notFound)).toBeTruthy();
  });
});
