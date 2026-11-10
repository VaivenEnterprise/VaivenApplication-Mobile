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
import { login, logout, refreshTokens, register } from '@/features/auth/api';
import {
  toRegisterRequest,
  type AuthResult,
  type LoginInput,
  type RegisterInput,
  type Tokens,
  type User,
} from '@/features/auth/schemas';
import { getMe } from '@/features/profile/api';
import { setAccessToken, setSessionHandlers } from '@/lib/api/authInterceptor';
import { ApiError } from '@/lib/api/errors';
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

type Props = { children: ReactNode };

export function SessionProvider({ children }: Props) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [suspension, setSuspension] = useState<Suspension | null>(null);
  const refreshToken = useRef<string | null>(null);
  const restoreStarted = useRef(false);

  const storeTokens = useCallback(async (tokens: Tokens) => {
    setAccessToken(tokens.accessToken);
    refreshToken.current = tokens.refreshToken;
    await secureStorage.set(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }, []);

  /** Borra todo rastro local de la sesión (tokens, usuario y caché de consultas). */
  const clearLocal = useCallback(async () => {
    setAccessToken(null);
    refreshToken.current = null;
    setUser(null);
    setStatus('signedOut');
    queryClient.clear();
    await secureStorage.remove(REFRESH_TOKEN_KEY);
  }, [queryClient]);

  const open = useCallback(
    async (result: AuthResult) => {
      await storeTokens(result.tokens);
      setSuspension(null);
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

  // Restaura la sesión al arrancar (CA-02). Una sola vez: renovar dos veces con el mismo
  // `refreshToken` lo marcaría como reutilizado y el servidor cerraría todas las sesiones.
  useEffect(() => {
    if (restoreStarted.current) return;
    restoreStarted.current = true;
    void (async () => {
      const stored = await secureStorage.get(REFRESH_TOKEN_KEY);
      if (stored === null) {
        setStatus('signedOut');
        return;
      }
      try {
        await storeTokens(await refreshTokens(stored));
        setUser(await getMe());
        setStatus('signedIn');
      } catch (error) {
        const suspended = suspensionFrom(error);
        if (suspended !== null) setSuspension(suspended);
        // Sin red o con el servidor caído se conserva el token para el próximo arranque.
        const definitive =
          error instanceof ApiError && (error.status === 401 || error.status === 403);
        if (definitive) await clearLocal();
        else {
          setAccessToken(null);
          refreshToken.current = null;
          setStatus('signedOut');
        }
      }
    })();
  }, [storeTokens, clearLocal]);

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

  const value = useMemo<SessionValue>(
    () => ({ status, user, suspension, signIn, signUp, signOut, setUser, dismissSuspension }),
    [status, user, suspension, signIn, signUp, signOut, dismissSuspension],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
