// Claves de consulta del chat (Art. XIII.4).
export const chatKeys = {
  all: ['chat'] as const,
  conversations: ['chat', 'conversations'] as const,
  unread: ['chat', 'unread'] as const,
  messages: (conversationId: string) => ['chat', 'messages', conversationId] as const,
};
