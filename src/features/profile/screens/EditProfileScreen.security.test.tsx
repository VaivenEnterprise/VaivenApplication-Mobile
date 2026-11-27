import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { EditProfileScreen } from '@/features/profile/screens/EditProfileScreen';
import { es } from '@/i18n/es-MX';
import { failure, fakeUser, installFakeApi, ok } from '@/test/fakeApi';

const mockUser = fakeUser;

// Spec 021-T009: suite de seguridad propia de la edición de perfil (S-01, S-05, S-09).
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
}));
jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({ status: 'signedIn', user: mockUser, setUser: jest.fn() }),
}));

// El primer render de la suite carga en frío el árbol de pantallas y puede pasar de 5 s.
jest.setTimeout(30_000);
const t = es.profile.edit;

function renderEdit() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <EditProfileScreen />
    </QueryClientProvider>,
  );
}

afterEach(() => jest.restoreAllMocks());

describe('EditProfileScreen (seguridad)', () => {
  it('solo envía campos editables: nunca rol, correo, id ni calificación (asignación masiva)', async () => {
    const { calls } = installFakeApi({
      'PATCH /me': () => ok({ ...fakeUser, displayName: 'Ana M.' }),
    });
    await renderEdit();
    await fireEvent.changeText(screen.getByLabelText(t.name), 'Ana M.');
    await fireEvent.press(screen.getByRole('button', { name: t.save }));
    await waitFor(() => expect(calls).toHaveLength(1));
    const campos = Object.keys(calls[0]?.body as Record<string, unknown>);
    expect(campos.every((c) => ['displayName', 'phone'].includes(c))).toBe(true);
    for (const prohibido of ['role', 'email', 'id', 'ratingAverage', 'ratingCount', 'status']) {
      expect(campos).not.toContain(prohibido);
    }
  });

  it('el correo no se puede editar desde esta pantalla', async () => {
    installFakeApi({});
    await renderEdit();
    expect(screen.queryByLabelText(es.auth.login.email)).toBeNull();
    expect(screen.queryByDisplayValue(fakeUser.email)).toBeNull();
  });

  it('con un teléfono o nombre inválidos no sale ninguna petición', async () => {
    const { calls } = installFakeApi({});
    await renderEdit();
    await fireEvent.changeText(screen.getByLabelText(t.phone), '<script>1</script>');
    await fireEvent.press(screen.getByRole('button', { name: t.save }));
    expect(await screen.findByText(t.phoneInvalid)).toBeTruthy();
    expect(calls).toHaveLength(0);
  });

  it('un 401/403 del servidor no se maneja como éxito ni filtra detalles técnicos', async () => {
    installFakeApi({ 'PATCH /me': () => failure(403, 'forbidden') });
    await renderEdit();
    await fireEvent.changeText(screen.getByLabelText(t.name), 'Ana M.');
    await fireEvent.press(screen.getByRole('button', { name: t.save }));
    await screen.findByRole('alert');
    expect(screen.queryByText(t.saved)).toBeNull();
    expect(screen.queryByText(/req-1|stack|forbidden/i)).toBeNull();
  });
});
