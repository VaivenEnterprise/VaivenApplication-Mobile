import { QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { SessionProvider } from '@/features/auth/session';
import { createQueryClient } from '@/lib/query/queryClient';

type AppProvidersProps = {
  children: ReactNode;
};

/** Proveedores globales de la app: caché de consultas y sesión (003). Otros se agregan aquí en sus specs. */
export function AppProviders({ children }: AppProvidersProps) {
  // Un cliente por montaje: se crea una sola vez y no se comparte entre pruebas.
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>{children}</SessionProvider>
    </QueryClientProvider>
  );
}
