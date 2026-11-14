// Textos del centro de avisos y de las notificaciones push (spec 011). Segunda persona, verbo primero (Art. V).

export const notificationsEs = {
  center: {
    title: 'Avisos',
    back: 'Volver',
    markAll: 'Marcar todas como leídas',
    markAllDone: 'Todos tus avisos están leídos',
    today: 'Hoy',
    yesterday: 'Ayer',
    emptyTitle: 'Todo al día',
    emptyDescription: 'Cuando pase algo con tus solicitudes, mensajes o entregas, lo verás aquí.',
    loadingMore: 'Cargando más…',
    loadMore: 'Ver más avisos',
    markFailed: 'No pudimos marcar los avisos como leídos. Intenta de nuevo.',
  },
  time: {
    now: 'Ahora',
    minutesAgo: 'min',
    ago: 'hace',
  },
  row: {
    unread: 'No leído',
    read: 'Leído',
    open: 'Abrir aviso',
  },
  badge: {
    unread: 'sin leer',
    none: 'Sin avisos nuevos',
  },
  profileRow: 'Avisos',
  detail: {
    title: 'Aviso importante',
    viewIncident: 'Ver incidencia',
    done: 'Listo',
  },
  push: {
    toggleTitle: 'Avisos en el teléfono',
    on: 'Activados',
    off: 'Desactivados',
    denied: 'Desactivados en los ajustes del teléfono',
    unavailable: 'No disponibles en este dispositivo',
    openSettings: 'Abrir ajustes',
    enableFailed: 'No pudimos activar los avisos. Intenta de nuevo.',
    toggleA11y: 'Avisos en el teléfono',
  },
  primer: {
    title: 'Entérate al instante',
    requests: 'Solicitudes',
    messages: 'Mensajes',
    deliveries: 'Entregas',
    enable: 'Activar avisos',
    later: 'Ahora no',
  },
  banner: {
    open: 'Abrir aviso',
    dismiss: 'Cerrar aviso',
  },
  channel: {
    name: 'Vaivén',
  },
} as const;
