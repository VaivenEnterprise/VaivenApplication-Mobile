import { createContext, useCallback, useMemo, useState, type PropsWithChildren } from 'react';
import type { User } from '@/lib/domain/models';
import { mariana } from '@/mocks/users';

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  signInAsMariana: () => void;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);

  const signInAsMariana = useCallback(() => setUser(mariana), []);
  const signOut = useCallback(() => setUser(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      signInAsMariana,
      signOut,
    }),
    [signInAsMariana, signOut, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
