// Claves de consulta de avisos (Art. XIII.4, Art. VI.6).
export const notificationsKeys = {
  all: ['notifications'] as const,
  list: ['notifications', 'list'] as const,
  unread: ['notifications', 'unread-count'] as const,
};
