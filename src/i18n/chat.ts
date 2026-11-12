// Textos del chat (spec 008). Segunda persona, verbos primero y siempre con salida (Art. V).
// El motivo de un mensaje rechazado por moderación lo manda el servidor (`details[].issue`).

export const chatEs = {
  title: 'Mensajes',
  back: 'Volver',
  list: {
    emptyTitle: 'Aún no tienes mensajes',
    emptyDescription: 'Tus conversaciones aparecen cuando aceptan una solicitud',
    noMessages: 'Sin mensajes todavía',
    closed: 'Conversación cerrada',
    unread: 'sin leer',
    youPrefix: 'Tú: ',
    skeleton: 'Cargando conversaciones',
  },
  header: {
    openBooking: 'Ver reserva',
  },
  day: { today: 'Hoy', yesterday: 'Ayer' },
  message: {
    mine: 'Tú',
    sending: 'Enviando',
    notSent: 'No enviado',
    retry: 'Reintentar',
    retryA11y: 'Reintentar el envío de este mensaje',
    sentAt: 'Enviado a las',
    olderLoading: 'Cargando mensajes anteriores',
  },
  chat: {
    emptyTitle: 'Empieza la conversación',
    emptyDescription: 'Coordinen dónde y cuándo se ven, y los detalles del objeto.',
    closedBar: 'Conversación cerrada',
    closedHint: 'Ya no se pueden enviar mensajes. Puedes seguir leyendo el historial.',
    notFound: 'No encontramos esta conversación.',
  },
  composer: {
    placeholder: 'Escribe un mensaje',
    fieldLabel: 'Mensaje',
    send: 'Enviar mensaje',
    counter: 'caracteres',
    sendingHint: 'Enviando el mensaje anterior',
  },
  quickReplies: {
    label: 'Respuestas rápidas',
    items: ['¿Dónde nos vemos?', 'Ya llegué', '¿A qué hora?', 'Gracias'],
  },
  notice: {
    moderationTitle: 'No se envió tu mensaje',
    moderationFallback: 'Contiene contenido no permitido. Edítalo e inténtalo de nuevo.',
    slowDown: 'Más despacio. Espera un momento.',
    closed: 'La conversación ya está cerrada.',
    dismiss: 'Cerrar aviso',
  },
  section: {
    title: 'Mensajes',
    open: 'Abrir chat',
    openA11y: 'Abrir el chat de esta reserva',
    noMessages: 'Coordina el encuentro con la otra persona.',
    unread: 'sin leer',
  },
} as const;
