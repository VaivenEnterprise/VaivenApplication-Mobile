// Claves de consulta de calificaciones (Art. XIII.4, Art. VI.6).
export const ratingsKeys = {
  all: ['ratings'] as const,
  status: (bookingId: string) => ['ratings', 'status', bookingId] as const,
  user: (userId: string) => ['ratings', 'user', userId] as const,
};
