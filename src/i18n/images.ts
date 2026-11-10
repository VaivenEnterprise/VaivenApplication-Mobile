// Textos de la feature de imágenes (spec 004). Los permisos y los errores hablan en segunda
// persona y siempre ofrecen una salida (Art. V).

export const imagesEs = {
  picker: {
    add: 'Agregar foto',
    /** «{n}/{max}» se arma en el componente con estos dos textos. */
    counterOf: '/',
    of: 'de',
    cover: 'Portada',
    makeCover: 'Hacer portada',
    remove: 'Quitar foto',
    photoLabel: 'Foto',
    uploading: 'Subiendo foto',
    uploaded: 'Foto lista',
    failed: 'No se pudo subir. Toca para reintentar',
    retry: 'Reintentar subida',
    limitReached: 'Llegaste al límite de fotos',
    sheetTitle: 'Agregar foto',
    takePhoto: 'Tomar foto',
    chooseGallery: 'Elegir de la galería',
    actions: 'Opciones de la foto',
  },
  permissions: {
    cameraTitle: 'Necesitamos tu cámara',
    cameraDenied: 'Para tomar la foto, permite el acceso a la cámara en Ajustes.',
    libraryTitle: 'Necesitamos tus fotos',
    libraryDenied: 'Para elegir una foto, permite el acceso a tus fotos en Ajustes.',
    openSettings: 'Abrir Ajustes',
    dismiss: 'Ahora no',
  },
  remote: {
    loading: 'Cargando foto',
    failed: 'No se pudo cargar la foto',
  },
  errors: {
    signature: 'No pudimos preparar la subida. Inténtalo de nuevo.',
    upload: 'No se pudo subir la foto. Revisa tu conexión e inténtalo de nuevo.',
    rateLimited: 'Subiste muchas fotos seguidas. Espera un momento.',
    tooLarge: 'La foto es demasiado pesada.',
    invalidFormat: 'Esa foto no tiene un formato válido. Usa JPG, PNG o WEBP.',
    resize: 'No pudimos preparar esa foto. Elige otra.',
    cancelled: 'Se canceló la subida.',
    unexpected: 'Algo salió mal con la foto. Inténtalo de nuevo.',
  },
} as const;
