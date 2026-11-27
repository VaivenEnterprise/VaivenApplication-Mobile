import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { login, logout, refreshTokens, register } from '@/features/auth/api';
import {
  BIOMETRIC_UNLOCK_KEY,
  biometricsAvailable,
  confirmIdentity,
  isBiometricUnlockEnabled,
} from '@/features/auth/biometrics';
import { INACTIVITY_TIMEOUT_MS, useInactivityTimeout } from '@/features/auth/inactivity';
import { LockScreen } from '@/features/auth/screens/LockScreen';
import { runBeforeSignOut } from '@/features/auth/signOutHooks';
import {
  toRegisterRequest,
  type AuthResult,
  type LoginInput,
  type RegisterInput,
  type Tokens,
  type User,
} from '@/features/auth/schemas';
import { getMe } from '@/features/profile/api';
import { es } from '@/i18n/es-MX';
import { setAccessToken, setSessionHandlers } from '@/lib/api/authInterceptor';
import { ApiError, isStepUpRequired } from '@/lib/api/errors';
import { secureStorage } from '@/lib/storage/secureStorage';

// Sesión de la app (spec 003 RF-02, RF-07, P-02): el token de acceso vive solo en
// memoria (`authInterceptor`) y el `refreshToken` en el almacén seguro. Nada de esto
// se registra en logs ni entra en la caché de consultas (RNF-01).

export const REFRESH_TOKEN_KEY = 'vaiven.refreshToken';

export type SessionStatus = 'loading' | 'signedOut' | 'signedIn';

/** Cuenta suspendida: `until` es la fecha de fin (ISO) solo si el servidor la informa. */
export type Suspension = { readonly until: string | null };

export type SessionValue = {
  status: SessionStatus;
  user: User | null;
  suspension: Suspension | null;
  /**
   * Spec 021-T014 (B-5): al arrancar no se llegó al servidor (sin red, tiempo agotado o 5xx) y hay
   * una sesión guardada. `status` sigue en `loading`: no se muestra el login ni se abre la sesión.
   */
  restoreOffline: boolean;
  /** Vuelve a intentar restaurar la sesión guardada (sin efecto si ya hay un intento en curso). */
  retryRestore: () => void;
  /** Spec 021-T015: la sesión se cerró por inactividad (el login lo explica); se limpia al entrar. */
  signedOutReason: 'inactivity' | null;
  signIn: (input: LoginInput) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  /** Cierra la sesión en el dispositivo al instante y avisa al servidor sin bloquear. */
  signOut: () => Promise<void>;
  /** Actualiza el usuario en memoria (p. ej. tras editar el perfil). */
  setUser: (user: User) => void;
  dismissSuspension: () => void;
};

export const SessionContext = createContext<SessionValue | null>(null);

/**
 * El contrato solo define `403 forbidden` para una cuenta suspendida (sin fecha). Si el
 * servidor agrega `suspendedUntil` en `details`, se muestra; si no, la pantalla omite la fecha.
 */
export function suspensionFrom(error: unknown): Suspension | null {
  if (!(error instanceof ApiError) || error.status !== 403) return null;
  const detail = error.details.find((item) => item.field === 'suspendedUntil');
  return { until: detail?.issue ?? null };
}

type Props = {
  children: ReactNode;
  /** Tiempo sin uso antes de cerrar o bloquear la sesión; por defecto `INACTIVITY_TIMEOUT_MS`. */
  inactivityTimeoutMs?: number;
};

export function SessionProvider({ children, inactivityTimeoutMs = INACTIVITY_TIMEOUT_MS }: Props) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [suspension, setSuspension] = useState<Suspension | null>(null);
  const [restoreOffline, setRestoreOffline] = useState(false);
  const [locked, setLocked] = useState(false);
  const [signedOutReason, setSignedOutReason] = useState<'inactivity' | null>(null);
  const refreshToken = useRef<string | null>(null);
  const restoreStarted = useRef(false);
  const restoring = useRef(false);

  const storeTokens = useCallback(async (tokens: Tokens) => {
    setAccessToken(tokens.accessToken);
    refreshToken.current = tokens.refreshToken;
    await secureStorage.set(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }, []);

  /** Borra todo rastro local de la sesión (tokens, usuario, caché y desbloqueo con biometría). */
  const clearLocal = useCallback(async () => {
    setAccessToken(null);
    refreshToken.current = null;
    setUser(null);
    setLocked(false);
    setStatus('signedOut');
    queryClient.clear();
    await secureStorage.remove(REFRESH_TOKEN_KEY);
    await secureStorage.remove(BIOMETRIC_UNLOCK_KEY);
  }, [queryClient]);

  const open = useCallback(
    async (result: AuthResult) => {
      await storeTokens(result.tokens);
      setSuspension(null);
      setSignedOutReason(null);
      setUser(result.user);
      setStatus('signedIn');
    },
    [storeTokens],
  );

  // Renovación para el cliente de API (single-flight en `authInterceptor`).
  useEffect(() => {
    setSessionHandlers({
      refresh: async () => {
        const current = refreshToken.current;
        if (current === null) return false;
        try {
          await storeTokens(await refreshTokens(current));
          return true;
        } catch {
          return false;
        }
      },
      onSessionExpired: () => {
        void clearLocal();
      },
    });
    return () => setSessionHandlers(null);
  }, [storeTokens, clearLocal]);

  // Restaura la sesión guardada (CA-02). Nunca dos intentos a la vez: renovar dos veces con el
  // mismo `refreshToken` lo marcaría como reutilizado y el servidor cerraría todas las sesiones.
  const restore = useCallback(async () => {
    if (restoring.current) return;
    restoring.current = true;
    try {
      const stored = await secureStorage.get(REFRESH_TOKEN_KEY);
      if (stored === null) {
        setRestoreOffline(false);
        setStatus('signedOut');
        return;
      }
      try {
        await storeTokens(await refreshTokens(stored));
        setUser(await getMe());
        setRestoreOffline(false);
        setStatus('signedIn');
      } catch (error) {
        const suspended = suspensionFrom(error);
        if (suspended !== null) setSuspension(suspended);
        // El 401 `stepUp` (spec 021-T033) no rechaza la sesión: solo pide confirmar la identidad.
        const definitive =
          error instanceof ApiError &&
          !isStepUpRequired(error) &&
          (error.status === 401 || error.status === 403);
        if (definitive) {
          // El servidor rechazó la sesión: se cierra y se borra el token (S-04c).
          setRestoreOffline(false);
          await clearLocal();
        } else {
          // Spec 021-T014 (B-5): sin red o con el servidor caído se conserva el token guardado y
          // se espera (estado «sin conexión»), sin mostrar el login ni dejar tokens en memoria.
          setAccessToken(null);
          refreshToken.current = null;
          setRestoreOffline(true);
        }
      }
    } finally {
      restoring.current = false;
    }
  }, [storeTokens, clearLocal]);

  // Al arrancar, una sola vez.
  useEffect(() => {
    if (restoreStarted.current) return;
    restoreStarted.current = true;
    void restore();
  }, [restore]);

  const retryRestore = useCallback(() => {
    void restore();
  }, [restore]);

  const signIn = useCallback(
    async (input: LoginInput) => {
      try {
        await open(await login(input));
      } catch (error) {
        const suspended = suspensionFrom(error);
        if (suspended !== null) setSuspension(suspended);
        throw error;
      }
    },
    [open],
  );

  const signUp = useCallback(
    async (input: RegisterInput) => {
      try {
        await open(await register(toRegisterRequest(input)));
      } catch (error) {
        const suspended = suspensionFrom(error);
        if (suspended !== null) setSuspension(suspended);
        throw error;
      }
    },
    [open],
  );

  const signOut = useCallback(async () => {
    // Tareas de otras features que necesitan la sesión viva (p. ej. baja del token de push, 011).
    await runBeforeSignOut();
    const token = refreshToken.current;
    await clearLocal();
    if (token === null) return;
    try {
      await logout(token);
    } catch {
      // El servidor ya no importa: el dispositivo quedó sin tokens y el de acceso vence solo.
    }
  }, [clearLocal]);

  const dismissSuspension = useCallback(() => setSuspension(null), []);

  // Spec 021-T015 (RF-14): tras `inactivityTimeoutMs` sin uso, con el desbloqueo con biometría
  // activado la sesión se BLOQUEA (sin token de acceso ni caché en memoria; el de refresco sigue en
  // el almacén seguro); sin él, se CIERRA como «Cerrar sesión» y el login lo explica.
  const onInactive = useCallback(async () => {
    if ((await isBiometricUnlockEnabled()) && (await biometricsAvailable())) {
      setAccessToken(null);
      setUser(null);
      queryClient.clear();
      setStatus('loading');
      setLocked(true);
      return;
    }
    await signOut();
    setSignedOutReason('inactivity');
  }, [queryClient, signOut]);

  const markActivity = useInactivityTimeout(
    status === 'signedIn' && !locked,
    inactivityTimeoutMs,
    () => void onInactive(),
  );

  /** Biometría para salir del bloqueo; si la persona se confirma, se restaura la sesión guardada. */
  const unlock = useCallback(async () => {
    const ok = await confirmIdentity(es.auth.lock.prompt, es.auth.lock.cancel);
    if (!ok) return false;
    setLocked(false);
    void restore();
    return true;
  }, [restore]);

  const value = useMemo<SessionValue>(
    () => ({
      status,
      user,
      suspension,
      restoreOffline,
      retryRestore,
      signedOutReason,
      signIn,
      signUp,
      signOut,
      setUser,
      dismissSuspension,
    }),
    [
      status,
      user,
      suspension,
      restoreOffline,
      retryRestore,
      signedOutReason,
      signIn,
      signUp,
      signOut,
      dismissSuspension,
    ],
  );

  return (
    <SessionContext.Provider value={value}>
      {locked ? (
        <LockScreen onUnlock={unlock} onSignOut={() => void signOut()} />
      ) : (
        // Cualquier toque dentro de la app cuenta como actividad (no captura ni bloquea el toque).
        <View style={styles.fill} onTouchStart={markActivity}>
          {children}
        </View>
      )}
    </SessionContext.Provider>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
