// Claves de consulta de autenticación (P-05, Art. XIII.4).
export const authKeys = {
  all: ['auth'] as const,
  me: ['auth', 'me'] as const,
};
