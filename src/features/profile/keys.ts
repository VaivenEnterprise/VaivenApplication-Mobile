// Claves de consulta del perfil (Art. XIII.4). La cuenta propia usa `authKeys.me`.
export const profileKeys = {
  user: (id: string) => ['profile', 'user', id] as const,
};
