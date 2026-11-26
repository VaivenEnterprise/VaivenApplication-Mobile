import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { useDeleteAccount } from '@/features/profile/hooks';

// Spec 016 · S-05 (OWASP M3, M6): la baja de cuenta exige la contraseña y solo cierra la
// sesión local cuando el servidor la confirma.

const mockSignOut = jest.fn(async () => undefined);
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({ status: 'signedIn', user: { id: 'u1' }, signOut: mockSignOut }),
}));
jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));

jest.setTimeout(30_000);

const reply = (status: number, body: unknown): Response =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;
const err = (status: number, code: string) =>
  reply(status, { error: { code, message: 'x', requestId: 'r1', details: [] } });

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(() => useDeleteAccount(), { wrapper });
}

beforeEach(() => mockSignOut.mockClear());
afterEach(() => jest.restoreAllMocks());

describe('S-05 · M3/M6 · baja de cuenta', () => {
  it('S-05a envía DELETE /me con la contraseña y, al confirmarse, cierra la sesión local', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(reply(204, null));
    const { result } = await setup();
    await act(async () => {
      await result.current.mutateAsync('mi-clave-123');
    });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://api.test/api/v1/me');
    expect(init.method).toBe('DELETE');
    expect(JSON.parse(init.body as string)).toEqual({ password: 'mi-clave-123' });
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('S-05b una contraseña incorrecta (403) se informa y NO cierra la sesión', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(err(403, 'forbidden'));
    const { result } = await setup();
    await act(async () => {
      await result.current.mutateAsync('mal').catch(() => undefined);
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ status: 403 });
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('S-05c reservas activas (409) se informan y NO cierran la sesión', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(err(409, 'conflict'));
    const { result } = await setup();
    await act(async () => {
      await result.current.mutateAsync('clave-123').catch(() => undefined);
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ status: 409 });
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('S-05d un fallo de red no cierra la sesión ni escribe la contraseña en consola', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) =>
      jest.spyOn(console, m).mockImplementation(() => undefined),
    );
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Network request failed'));
    const { result } = await setup();
    await act(async () => {
      await result.current.mutateAsync('clave-secreta').catch(() => undefined);
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockSignOut).not.toHaveBeenCalled();
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  });
});
