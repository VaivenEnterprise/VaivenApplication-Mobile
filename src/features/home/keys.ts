// Claves de consulta de Inicio (Art. XIII.4). La cuenta propia usa `authKeys.me`.
export const homeKeys = {
  recent: (limit: number) => ['home', 'recent', limit] as const,
};
