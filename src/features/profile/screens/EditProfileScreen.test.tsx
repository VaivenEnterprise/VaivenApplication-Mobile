import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { EditProfileScreen } from '@/features/profile/screens/EditProfileScreen';
import { es } from '@/i18n/es-MX';
import { failure, fakeUser, installFakeApi, ok } from '@/test/fakeApi';

const mockBack = jest.fn();
const mockSetUser = jest.fn();
let mockUser: typeof fakeUser = fakeUser;

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn(), replace: jest.fn() }),
}));
jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({ status: 'signedIn', user: mockUser, setUser: mockSetUser }),
}));

const t = es.profile.edit;

function renderEdit() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <EditProfileScreen />
    </QueryClientProvider>,
  );
}

const save = () => screen.getByRole('button', { name: t.save });

beforeEach(() => {
  mockUser = fakeUser;
  mockBack.mockReset();
  mockSetUser.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('EditProfileScreen', () => {
  it('muestra los datos actuales y «Guardar» deshabilitado sin cambios', async () => {
    mockUser = { ...fakeUser, phone: '+525512345678' };
    installFakeApi({});
    await renderEdit();
    expect(screen.getByLabelText(t.name).props.value).toBe('Ana López');
    expect(screen.getByLabelText(t.phone).props.value).toBe('+525512345678');
    expect(screen.getByText(t.phoneHint)).toBeTruthy();
    expect(save()).toBeDisabled();
  });

  it('«Volver» regresa a Perfil', async () => {
    installFakeApi({});
    await renderEdit();
    await fireEvent.press(screen.getByRole('button', { name: es.common.back }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('al cambiar el nombre habilita «Guardar» y envía solo ese campo', async () => {
    const { calls } = installFakeApi({
      'PATCH /me': () => ok({ ...fakeUser, displayName: 'Ana M.' }),
    });
    await renderEdit();
    await fireEvent.changeText(screen.getByLabelText(t.name), '  Ana M. ');
    expect(save()).not.toBeDisabled();
    await fireEvent.press(save());
    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0]?.body).toEqual({ displayName: 'Ana M.' });
    await waitFor(() =>
      expect(mockSetUser).toHaveBeenCalledWith(expect.objectContaining({ displayName: 'Ana M.' })),
    );
  });

  it('agrega el teléfono limpiando espacios y guiones', async () => {
    const { calls } = installFakeApi({
      'PATCH /me': () => ok({ ...fakeUser, phone: '5512345678' }),
    });
    await renderEdit();
    await fireEvent.changeText(screen.getByLabelText(t.phone), '55 1234-5678');
    await fireEvent.press(save());
    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0]?.body).toEqual({ phone: '5512345678' });
  });

  it('vaciar el teléfono lo borra (phone: null)', async () => {
    mockUser = { ...fakeUser, phone: '+525512345678' };
    const { calls } = installFakeApi({ 'PATCH /me': () => ok(fakeUser) });
    await renderEdit();
    await fireEvent.changeText(screen.getByLabelText(t.phone), '');
    await fireEvent.press(save());
    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0]?.body).toEqual({ phone: null });
  });

  it('un teléfono inválido o un nombre demasiado corto no llaman a la API', async () => {
    const { calls } = installFakeApi({});
    await renderEdit();
    await fireEvent.changeText(screen.getByLabelText(t.phone), '123');
    await fireEvent.changeText(screen.getByLabelText(t.name), 'A');
    await fireEvent.press(save());
    expect(await screen.findByText(t.phoneInvalid)).toBeTruthy();
    expect(screen.getByText(es.auth.validation.nameTooShort)).toBeTruthy();
    expect(calls).toHaveLength(0);
  });

  it('al guardar muestra «Guardado» y regresa a Perfil', async () => {
    jest.useFakeTimers({ advanceTimers: true });
    installFakeApi({ 'PATCH /me': () => ok({ ...fakeUser, displayName: 'Ana M.' }) });
    await renderEdit();
    await fireEvent.changeText(screen.getByLabelText(t.name), 'Ana M.');
    await fireEvent.press(save());
    expect(await screen.findByText(t.saved)).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('un fallo de la API se muestra en el formulario y no regresa', async () => {
    installFakeApi({ 'PATCH /me': () => failure(503, 'service_unavailable') });
    await renderEdit();
    await fireEvent.changeText(screen.getByLabelText(t.name), 'Ana M.');
    await fireEvent.press(save());
    expect(await screen.findByText(es.errors.service_unavailable)).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
    expect(screen.queryByText(t.saved)).toBeNull();
  });
});
