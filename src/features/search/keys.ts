// Claves de consulta de búsqueda (Art. XIII.4). La clave lleva la consulta completa (texto, filtros
// y coordenadas redondeadas) para que cambiar cualquier filtro cancele la petición anterior.
export const searchKeys = {
  all: ['search'] as const,
  items: (query: string) => ['search', 'items', query] as const,
};
