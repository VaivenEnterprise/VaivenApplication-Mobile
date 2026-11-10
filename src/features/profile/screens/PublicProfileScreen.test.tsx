import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { PublicProfileScreen } from '@/features/profile/screens/PublicProfileScreen';
import { es } from '@/i18n/es-MX';
import { failure, installFakeApi, ok } from '@/test/fakeApi';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn(), replace: jest.fn() }),
}));
jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({ status: 'signedIn' }),
}));

const publicUser = {
  id: 'abc',
  displayName: 'Beto Ruiz',
  ratingAverage: 4.5,
  ratingCount: 18,
  memberSince: '2026-09-15T18:00:00Z',
};

function renderProfile(props: Partial<Parameters<typeof PublicProfileScreen>[0]> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PublicProfileScreen id="abc" {...props} />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  jest.restoreAllMocks();
  mockBack.mockReset();
});

describe('PublicProfileScreen', () => {
  it('muestra el nombre, la antigüedad y el resumen de calificaciones', async () => {
    const { calls } = installFakeApi({ 'GET /users/abc': () => ok(publicUser) });
    await renderProfile();
    expect(await screen.findByRole('header', { name: 'Beto Ruiz' })).toBeTruthy();
    expect(screen.getByText(`${es.profile.memberSince} septiembre de 2026`)).toBeTruthy();
    expect(screen.getByText('4.5')).toBeTruthy();
    expect(screen.getByText('18 calificaciones')).toBeTruthy();
    expect(calls[0]?.path).toBe('/users/abc');
    // Nunca se pide ni se muestra contacto.
    expect(screen.queryByText(/@|teléfono/i)).toBeNull();
  });

  it('sin calificaciones muestra «Aún sin calificaciones»', async () => {
    installFakeApi({
      'GET /users/abc': () => ok({ ...publicUser, ratingAverage: null, ratingCount: 0 }),
    });
    await renderProfile();
    expect(await screen.findByText(es.profile.publicProfile.noRatings)).toBeTruthy();
  });

  it('mientras carga muestra el estado de carga', async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    installFakeApi({
      'GET /users/abc': async () => {
        await gate;
        return ok(publicUser);
      },
    });
    await renderProfile();
    expect(screen.getByLabelText(es.common.loading)).toBeTruthy();
    release();
    expect(await screen.findByText('Beto Ruiz')).toBeTruthy();
  });

  it('con error muestra el estado de error y reintenta', async () => {
    let attempts = 0;
    installFakeApi({
      'GET /users/abc': () => {
        attempts += 1;
        return attempts === 1 ? failure(404, 'not_found') : ok(publicUser);
      },
    });
    await renderProfile();
    expect(await screen.findByText(es.errors.not_found)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: es.common.retry }));
    expect(await screen.findByText('Beto Ruiz')).toBeTruthy();
  });

  it('«Volver» regresa', async () => {
    installFakeApi({ 'GET /users/abc': () => ok(publicUser) });
    await renderProfile();
    await fireEvent.press(screen.getByRole('button', { name: es.common.back }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('usa los marcadores de reputación y de acción del encabezado cuando se pasan', async () => {
    installFakeApi({ 'GET /users/abc': () => ok(publicUser) });
    await renderProfile({
      renderReputation: (user) => <Text>{`reputación ${user.id}`}</Text>,
      renderHeaderAction: (user) => <Text>{`acciones ${user.displayName}`}</Text>,
    });
    await waitFor(() => expect(screen.getByText('reputación abc')).toBeTruthy());
    expect(screen.getByText('acciones Beto Ruiz')).toBeTruthy();
    expect(screen.queryByText('18 calificaciones')).toBeNull();
  });
});
