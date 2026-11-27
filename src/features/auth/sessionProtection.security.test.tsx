/// <reference types="node" />
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as ScreenCapture from 'expo-screen-capture';
import * as SecureStore from 'expo-secure-store';
import fs from 'node:fs';
import path from 'node:path';
import { Text } from 'react-native';
import { AppState, type AppStateStatus } from 'react-native';
import { BIOMETRIC_UNLOCK_KEY, setBiometricUnlock } from '@/features/auth/biometrics';
import { INACTIVITY_TIMEOUT_MS, useInactivityTimeout } from '@/features/auth/inactivity';
import { useSensitiveScreen } from '@/features/auth/screenCapture';
import { REFRESH_TOKEN_KEY, SessionProvider } from '@/features/auth/session';
import { useSession } from '@/features/auth/useSession';
import { es } from '@/i18n/es-MX';
import { getAccessToken, resetAuthInterceptor } from '@/lib/api/authInterceptor';
import { fakeTokens, fakeUser, installFakeApi, installMemorySecureStore, ok } from '@/test/fakeApi';

// Spec 021 · T015 · S-14 (OWASP M3 autenticación/autorización insegura, M9 almacenamiento inseguro):
// pantallas sensibles sin capturas, cierre de sesión por inactividad y biometría opcional para
// volver a entrar, sin guardar nada nuevo fuera del almacén seguro.

jest.setTimeout(30_000);

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const capture = jest.mocked(ScreenCapture);
const biometrics = jest.mocked(LocalAuthentication);
const SRC = path.resolve(__dirname, '..', '..');

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('S-14a · M9 · pantallas sensibles sin capturas', () => {
  it('S-14a bloquea al montar y vuelve a permitir al desmontar, con la misma etiqueta', async () => {
    const { unmount } = await renderHook(() => useSensitiveScreen());
    const key = capture.preventScreenCaptureAsync.mock.calls.at(-1)?.[0];
    expect(typeof key).toBe('string');
    expect(capture.allowScreenCaptureAsync).not.toHaveBeenCalledWith(key);
    await unmount();
    expect(capture.allowScreenCaptureAsync).toHaveBeenCalledWith(key);
  });

  it('S-14a cada pantalla usa su etiqueta: cerrar una no desbloquea la que sigue abierta', async () => {
    capture.preventScreenCaptureAsync.mockClear();
    const first = await renderHook(() => useSensitiveScreen());
    await renderHook(() => useSensitiveScreen());
    const [a, b] = capture.preventScreenCaptureAsync.mock.calls.map((call) => call[0]);
    expect(a).not.toBe(b);
    await first.unmount();
    expect(capture.allowScreenCaptureAsync).toHaveBeenCalledWith(a);
    expect(capture.allowScreenCaptureAsync).not.toHaveBeenCalledWith(b);
  });

  it('S-14a si el dispositivo no lo admite, la pantalla sigue sin errores ni registros', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    capture.preventScreenCaptureAsync.mockRejectedValueOnce(new Error('unavailable'));
    await renderHook(() => useSensitiveScreen());
    await act(async () => undefined);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it.each([
    'features/auth/screens/LoginScreen.tsx',
    'features/auth/screens/RegisterScreen.tsx',
    'features/auth/screens/LockScreen.tsx',
    'features/profile/screens/ProfileScreen.tsx',
    'features/profile/screens/EditProfileScreen.tsx',
    'features/handover/screens/EvidenceScreen.tsx',
    'features/handover/screens/QrScreen.tsx',
  ])('S-14a %s usa useSensitiveScreen()', (rel) => {
    const text = fs.readFileSync(path.join(SRC, rel), 'utf8');
    expect(text).toMatch(/^\s+useSensitiveScreen\(\);$/m);
  });
});

describe('S-14b · M3 · temporizador de inactividad', () => {
  const listeners: ((state: AppStateStatus) => void)[] = [];
  beforeEach(() => {
    listeners.length = 0;
    jest.useFakeTimers();
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      listeners.push(listener);
      return { remove: () => listeners.splice(listeners.indexOf(listener), 1) };
    });
  });
  const emit = (state: AppStateStatus) => listeners.forEach((listener) => listener(state));
  const tick = (ms: number) =>
    act(async () => {
      jest.advanceTimersByTime(ms);
    });
  // Con temporizadores simulados, el render asíncrono de RNTL confirma el árbol al vaciar los de 0 ms.
  async function mount(active: boolean, onExpire: () => void) {
    const hook = await renderHook(() => ({
      markActivity: useInactivityTimeout(active, 1_000, onExpire),
    }));
    await tick(0);
    return hook;
  }

  it('S-14b el tiempo configurado es de 15 minutos', () => {
    expect(INACTIVITY_TIMEOUT_MS).toBe(15 * 60 * 1000);
  });

  it('S-14b vence una sola vez al cumplirse el tiempo sin actividad', async () => {
    const onExpire = jest.fn();
    await mount(true, onExpire);
    await tick(999);
    expect(onExpire).not.toHaveBeenCalled();
    await tick(1);
    expect(onExpire).toHaveBeenCalledTimes(1);
    await tick(5_000);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('S-14b la actividad reinicia la cuenta', async () => {
    const onExpire = jest.fn();
    const { result } = await mount(true, onExpire);
    await tick(600);
    await act(async () => {
      result.current.markActivity();
    });
    await tick(600);
    expect(onExpire).not.toHaveBeenCalled();
    await tick(400);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('S-14b cuenta el tiempo en segundo plano: al volver vence aunque el temporizador no corrió', async () => {
    const onExpire = jest.fn();
    await mount(true, onExpire);
    emit('background');
    // En segundo plano los temporizadores de JS no corren: solo avanza el reloj.
    jest.setSystemTime(Date.now() + 5_000);
    expect(onExpire).not.toHaveBeenCalled();
    await act(async () => {
      emit('active');
    });
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('S-14b volver pronto de segundo plano no cierra la sesión', async () => {
    const onExpire = jest.fn();
    await mount(true, onExpire);
    jest.setSystemTime(Date.now() + 300);
    await act(async () => {
      emit('active');
    });
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('S-14b sin sesión activa no cuenta y al desmontar no queda nada pendiente', async () => {
    const onExpire = jest.fn();
    const inactive = await mount(false, onExpire);
    await tick(5_000);
    expect(onExpire).not.toHaveBeenCalled();
    await inactive.unmount();
    const active = await mount(true, onExpire);
    await active.unmount();
    await tick(5_000);
    expect(onExpire).not.toHaveBeenCalled();
    expect(listeners).toHaveLength(0);
  });
});

// ---- Sesión completa con un tiempo de inactividad corto (temporizadores reales) ----

const SHORT_MS = 150;

function Probe() {
  const { status, signedOutReason } = useSession();
  return <Text testID="probe">{`${status}|${signedOutReason ?? 'none'}`}</Text>;
}

async function renderSession(stored: Record<string, string>) {
  resetAuthInterceptor();
  const saved = installMemorySecureStore(stored);
  const api = installFakeApi({
    'POST /auth/refresh': () => ok({ tokens: fakeTokens(2) }),
    'GET /me': () => ok(fakeUser),
    'POST /auth/logout': () => ({ status: 204 }),
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(['algo-sensible'], { email: fakeUser.email });
  await render(
    <QueryClientProvider client={client}>
      <SessionProvider inactivityTimeoutMs={SHORT_MS}>
        <Probe />
      </SessionProvider>
    </QueryClientProvider>,
  );
  await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('signedIn|none'));
  return { saved, api, client };
}

describe('S-14c · M3/M9 · cierre de sesión por inactividad', () => {
  it('S-14c sin biometría, la inactividad cierra la sesión como «Cerrar sesión» y lo explica', async () => {
    const { saved, api, client } = await renderSession({ [REFRESH_TOKEN_KEY]: 'refresh-1' });
    await waitFor(() =>
      expect(screen.getByTestId('probe')).toHaveTextContent('signedOut|inactivity'),
    );
    expect(saved.has(REFRESH_TOKEN_KEY)).toBe(false);
    expect(getAccessToken()).toBeNull();
    expect(client.getQueryData(['algo-sensible'])).toBeUndefined();
    expect(api.calls.some((call) => call.path === '/auth/logout')).toBe(true);
  });

  it('S-14c tocar la app cuenta como actividad y aplaza el cierre', async () => {
    await renderSession({ [REFRESH_TOKEN_KEY]: 'refresh-1' });
    for (let i = 0; i < 4; i++) {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, SHORT_MS / 2));
      });
      await fireEvent(screen.getByTestId('probe'), 'touchStart');
    }
    // Pasó el doble del límite, pero con toques: la sesión sigue abierta.
    expect(screen.getByTestId('probe')).toHaveTextContent('signedIn|none');
    await waitFor(() =>
      expect(screen.getByTestId('probe')).toHaveTextContent('signedOut|inactivity'),
    );
  });
});

describe('S-14d · M3/M9 · bloqueo con biometría opcional', () => {
  // Cada prueba parte de un teléfono sin biometría (el doble de `jest.setup.ts`).
  beforeEach(() => {
    biometrics.hasHardwareAsync.mockReset().mockResolvedValue(false);
    biometrics.isEnrolledAsync.mockReset().mockResolvedValue(false);
    biometrics.authenticateAsync
      .mockReset()
      .mockResolvedValue({ success: false, error: 'not_available' });
  });

  function withBiometrics(results: boolean[]) {
    biometrics.hasHardwareAsync.mockResolvedValue(true);
    biometrics.isEnrolledAsync.mockResolvedValue(true);
    for (const success of results) {
      biometrics.authenticateAsync.mockResolvedValueOnce(
        success ? { success: true } : { success: false, error: 'user_cancel' },
      );
    }
  }

  it('S-14d con biometría activada, la inactividad BLOQUEA: sin token de acceso ni caché, la app desmontada', async () => {
    withBiometrics([false]);
    const { saved, client } = await renderSession({
      [REFRESH_TOKEN_KEY]: 'refresh-1',
      [BIOMETRIC_UNLOCK_KEY]: '1',
    });
    expect(await screen.findByRole('header', { name: es.auth.lock.title })).toBeTruthy();
    expect(screen.queryByTestId('probe')).toBeNull();
    expect(getAccessToken()).toBeNull();
    expect(client.getQueryData(['algo-sensible'])).toBeUndefined();
    // El token de refresco sigue solo en el almacén seguro, para volver a entrar.
    expect(saved.get(REFRESH_TOKEN_KEY)).toBe('refresh-2');
    // Al aparecer se pidió la biometría una vez; la persona canceló y sigue bloqueada.
    expect(biometrics.authenticateAsync).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(es.auth.lock.failed)).toBeTruthy();
  });

  it('S-14d una biometría fallida no desbloquea; una correcta restaura la sesión con el servidor', async () => {
    withBiometrics([false, false, true]);
    const { api } = await renderSession({
      [REFRESH_TOKEN_KEY]: 'refresh-1',
      [BIOMETRIC_UNLOCK_KEY]: '1',
    });
    await screen.findByText(es.auth.lock.failed);
    await fireEvent.press(screen.getByRole('button', { name: es.auth.lock.unlock }));
    expect(await screen.findByText(es.auth.lock.failed)).toBeTruthy();
    expect(screen.queryByTestId('probe')).toBeNull();
    const refreshesBefore = api.calls.filter((call) => call.path === '/auth/refresh').length;

    await fireEvent.press(screen.getByRole('button', { name: es.auth.lock.unlock }));
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent(/^signedIn\|/));
    expect(api.calls.filter((call) => call.path === '/auth/refresh')).toHaveLength(
      refreshesBefore + 1,
    );
    expect(getAccessToken()).toBe('access-2');
  });

  it('S-14d «Cerrar sesión» desde el bloqueo borra el token y la marca de biometría', async () => {
    withBiometrics([false]);
    const { saved } = await renderSession({
      [REFRESH_TOKEN_KEY]: 'refresh-1',
      [BIOMETRIC_UNLOCK_KEY]: '1',
    });
    await screen.findByText(es.auth.lock.failed);
    await fireEvent.press(screen.getByRole('button', { name: es.auth.lock.signOut }));
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent(/^signedOut\|/));
    expect(saved.has(REFRESH_TOKEN_KEY)).toBe(false);
    expect(saved.has(BIOMETRIC_UNLOCK_KEY)).toBe(false);
  });

  it('S-14d con la marca activada pero sin biometría en el teléfono, cierra la sesión', async () => {
    const { saved } = await renderSession({
      [REFRESH_TOKEN_KEY]: 'refresh-1',
      [BIOMETRIC_UNLOCK_KEY]: '1',
    });
    await waitFor(() =>
      expect(screen.getByTestId('probe')).toHaveTextContent('signedOut|inactivity'),
    );
    expect(saved.has(REFRESH_TOKEN_KEY)).toBe(false);
  });
});

describe('S-14e · M9 · la marca de biometría solo vive en el almacén seguro', () => {
  it('S-14e activar y desactivar escribe y borra solo en expo-secure-store', async () => {
    installMemorySecureStore();
    const store = jest.mocked(SecureStore);
    await setBiometricUnlock(true);
    expect(store.setItemAsync).toHaveBeenCalledWith(BIOMETRIC_UNLOCK_KEY, '1');
    await setBiometricUnlock(false);
    expect(store.deleteItemAsync).toHaveBeenCalledWith(BIOMETRIC_UNLOCK_KEY);
  });

  it('S-14e no se guarda ningún dato biométrico: solo se pregunta al sistema sí o no', () => {
    const text = fs.readFileSync(path.join(SRC, 'features/auth/biometrics.ts'), 'utf8');
    expect(text).not.toMatch(/AsyncStorage|localStorage/);
    expect(text).toMatch(/result\.success/);
  });
});
