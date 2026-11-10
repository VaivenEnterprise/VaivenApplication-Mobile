import { useContext } from 'react';
import { SessionContext, type SessionValue } from '@/features/auth/session';

/** Sesión actual. Solo se usa dentro de `SessionProvider`. */
export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (value === null) throw new Error('useSession debe usarse dentro de SessionProvider.');
  return value;
}
