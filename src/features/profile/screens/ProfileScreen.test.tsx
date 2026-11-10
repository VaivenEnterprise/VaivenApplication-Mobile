import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ProfileScreen } from '@/features/profile/screens/ProfileScreen';
import { es } from '@/i18n/es-MX';
import { failure, fakeUser, installFakeApi, ok } from '@/test/fakeApi';

const mockPush = jest.fn();
const mockSignOut = jest.fn();
const mockSetUser = jest.fn();
let mockUser: typeof fakeUser | null = fakeUser;

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn() }),
}));
jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({
    status: 'signedIn',
    user: mockUser,
    signOut: mockSignOut,
    setUser: mockSetUser,
  }),
}));

const t = es.profile;

function renderProfile(props: Parameters<typeof ProfileScreen>[0] = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ProfileScreen {...props} />
    </QueryClientProvider>,
  );
}

const meApi = { 'GET /me': () => ok(fakeUser) };

beforeEach(() => {
  mockUser = fakeUser;
  mockPush.mockReset();
  mockSignOut.mockReset();
  mockSetUser.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ProfileScreen (CA-11)', () => {
  it('muestra la inicial, el nombre, antigüedad y las tres acciones', async () => {
    installFakeApi(meApi);
    await renderProfile();
    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Ana López' })).toBeTruthy();
    expect(screen.getByText(`${t.memberSince} noviembre de 2026`)).toBeTruthy();
    expect(screen.getByText(t.editProfile)).toBeTruthy();
    expect(screen.getByText(t.signOut)).toBeTruthy();
    expect(screen.getByRole('button', { name: t.deleteAccount })).toBeTruthy();
    // No hay estadísticas ni textos explicativos.
    expect(screen.queryByText(/estadística/i)).toBeNull();
  });

  it('refresca la cuenta con GET /me y actualiza la sesión', async () => {
    installFakeApi({ 'GET /me': () => ok({ ...fakeUser, displayName: 'Ana M.' }) });
    await renderProfile();
    await waitFor(() =>
      expect(mockSetUser).toHaveBeenCalledWith(expect.objectContaining({ displayName: 'Ana M.' })),
    );
    expect(await screen.findByRole('header', { name: 'Ana M.' })).toBeTruthy();
  });

  it('sin usuario en la sesión no pinta nada', async () => {
    mockUser = null;
    installFakeApi({ 'GET /me': () => failure(401, 'unauthorized') });
    await renderProfile();
    expect(screen.queryByText(t.editProfile)).toBeNull();
  });

  it('«Editar perfil» abre la edición', async () => {
    installFakeApi(meApi);
    await renderProfile();
    await fireEvent.press(screen.getByText(t.editProfile));
    expect(mockPush).toHaveBeenCalledWith('/perfil/editar');
  });

  it('«Cerrar sesión» cierra la sesión', async () => {
    installFakeApi(meApi);
    await renderProfile();
    await fireEvent.press(screen.getByText(t.signOut));
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('pinta los marcadores de reputación y de filas extra cuando se pasan', async () => {
    installFakeApi(meApi);
    await renderProfile({
      renderReputation: (user) => <Text>{`reputación de ${user.displayName}`}</Text>,
      renderExtraRows: () => <Text>Notificaciones</Text>,
    });
    expect(screen.getByText('reputación de Ana López')).toBeTruthy();
    expect(screen.getByText('Notificaciones')).toBeTruthy();
  });
});

describe('Eliminar cuenta (RF-08)', () => {
  async function openSheet() {
    await fireEvent.press(screen.getByRole('button', { name: t.deleteAccount }));
    return screen.findByLabelText(t.delete.password);
  }
  const confirm = () => screen.getByRole('button', { name: t.delete.confirm, hidden: true });

  it('abre una hoja que pide la contraseña y deshabilita «Eliminar» sin ella', async () => {
    installFakeApi(meApi);
    await renderProfile();
    const password = await openSheet();
    expect(screen.getByText(t.delete.title)).toBeTruthy();
    expect(screen.getByText(t.delete.description)).toBeTruthy();
    expect(confirm()).toBeDisabled();
    await fireEvent.changeText(password, 'secreta-123');
    expect(confirm()).not.toBeDisabled();
  });

  it('con la contraseña correcta borra la cuenta y cierra la sesión', async () => {
    const { calls } = installFakeApi({ ...meApi, 'DELETE /me': () => ({ status: 204 }) });
    await renderProfile();
    await fireEvent.changeText(await openSheet(), 'secreta-123');
    await fireEvent.press(confirm());
    await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1));
    const deletion = calls.find((call) => call.method === 'DELETE');
    expect(deletion?.body).toEqual({ password: 'secreta-123' });
  });

  it('contraseña incorrecta (403): error bajo el campo y no cierra la sesión', async () => {
    installFakeApi({ ...meApi, 'DELETE /me': () => failure(403, 'forbidden') });
    await renderProfile();
    await fireEvent.changeText(await openSheet(), 'mala');
    await fireEvent.press(confirm());
    expect(await screen.findByText(t.delete.wrongPassword)).toBeTruthy();
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('operaciones pendientes (409): aviso «Tienes operaciones pendientes»', async () => {
    installFakeApi({ ...meApi, 'DELETE /me': () => failure(409, 'conflict') });
    await renderProfile();
    await fireEvent.changeText(await openSheet(), 'secreta-123');
    await fireEvent.press(confirm());
    expect(await screen.findByText(t.delete.pending)).toBeTruthy();
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('otro fallo muestra un aviso con el mensaje del código', async () => {
    installFakeApi({ ...meApi, 'DELETE /me': () => failure(503, 'service_unavailable') });
    await renderProfile();
    await fireEvent.changeText(await openSheet(), 'secreta-123');
    await fireEvent.press(confirm());
    const alert = await screen.findByRole('alert', { hidden: true });
    expect(within(alert).getByText(es.errors.service_unavailable)).toBeTruthy();
  });

  it('«Cancelar» cierra la hoja y borra la contraseña escrita', async () => {
    installFakeApi(meApi);
    await renderProfile();
    await fireEvent.changeText(await openSheet(), 'secreta-123');
    await fireEvent.press(screen.getByRole('button', { name: t.delete.cancel, hidden: true }));
    await waitFor(() => expect(screen.queryByLabelText(t.delete.password)).toBeNull());
    const reopened = await openSheet();
    expect(reopened.props.value).toBe('');
  });
});
