// Todos los textos visibles de la app (Art. V.3). Ningún componente lleva texto
// literal. Las claves de `errors` cubren cada `ApiErrorCode` (lib/api/errors.ts).

export const es = {
  common: {
    retry: 'Reintentar',
    loading: 'Cargando…',
    back: 'Volver',
  },
  home: {
    title: 'Vaivén',
    subtitle: 'Presta y renta objetos cerca de ti.',
  },
  diagnostics: {
    title: 'Diagnóstico',
    badge: 'DEV',
    name: 'Nombre',
    version: 'Versión',
    environment: 'Entorno',
    serverTime: 'Hora del servidor',
  },
  errors: {
    // Códigos del servidor
    validation_failed: 'Revisa los datos e inténtalo de nuevo.',
    unauthorized: 'Tu sesión terminó. Inicia sesión de nuevo.',
    forbidden: 'No tienes permiso para hacer esto.',
    not_found: 'No encontramos lo que buscas.',
    conflict: 'Algo cambió mientras tanto. Actualiza e inténtalo de nuevo.',
    rate_limited: 'Demasiados intentos. Espera un momento.',
    internal_error: 'Algo salió mal de nuestro lado. Inténtalo de nuevo.',
    service_unavailable: 'El servicio no está disponible por ahora. Inténtalo más tarde.',
    // Códigos propios del cliente
    network_error: 'Sin conexión. Revisa tu internet.',
    timeout: 'La conexión tardó demasiado. Inténtalo de nuevo.',
    invalid_response: 'Recibimos una respuesta inesperada. Inténtalo de nuevo.',
    // Genéricos
    unexpected: 'Ocurrió algo inesperado. Inténtalo de nuevo.',
    config: 'La app no está bien configurada. Revisa las variables del archivo .env.',
  },
  notFound: {
    title: 'No encontramos esta página',
    action: 'Ir al inicio',
  },
} as const;

export type Messages = typeof es;
