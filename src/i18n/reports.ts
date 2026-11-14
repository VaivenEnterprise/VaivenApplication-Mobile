// Textos de reportes y del aviso de moderación (spec 011). Segunda persona, verbo primero (Art. V).

export const reportsEs = {
  button: {
    label: 'Reportar',
    item: 'Reportar este objeto',
    message: 'Reportar este mensaje',
    user: 'Reportar a esta persona',
    messageAction: 'Reportar mensaje',
  },
  sheet: {
    title: 'Reportar',
    reasonsLabel: 'Motivo',
    detailsLabel: 'Detalles (opcional)',
    detailsHint: 'Cuéntanos qué pasó para que el equipo lo revise.',
    counter: 'caracteres',
    submit: 'Enviar',
    submitting: 'Enviando…',
    success: 'Gracias, lo revisaremos',
    done: 'Listo',
    duplicate: 'Ya lo reportaste',
    decisionTitle: 'Reportar esta decisión',
    decisionHint: 'Cuéntanos por qué crees que no debió rechazarse el texto.',
  },
  reasons: {
    prohibited_content: 'Contenido prohibido',
    inappropriate: 'Inapropiado',
    spam: 'Spam',
    other: 'Otro',
  },
  errors: {
    generic: 'No pudimos enviar el reporte. Intenta de nuevo.',
    self: 'No puedes reportar tu propio contenido.',
    notFound: 'Ya no encontramos lo que quieres reportar.',
    detailsTooLong: 'Los detalles pueden tener hasta 500 caracteres.',
    reasonRequired: 'Elige un motivo.',
  },
  moderation: {
    title: 'No se puede publicar',
    reasonFallback: 'El texto contiene algo que no está permitido en Vaivén.',
    reportDecision: 'Reportar esta decisión',
    reported: 'Gracias, lo revisaremos',
    categoryFallback: 'Contenido no permitido',
    dismiss: 'Cerrar aviso',
  },
} as const;
