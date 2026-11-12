// Todos los textos visibles de la app (Art. V.3). Ningún componente lleva texto
// literal. Las claves de `errors` cubren cada `ApiErrorCode` (lib/api/errors.ts).

import { authEs } from '@/i18n/auth';
import { bookingsEs } from '@/i18n/bookings';
import { imagesEs } from '@/i18n/images';
import { inicioEs } from '@/i18n/inicio';
import { itemsEs } from '@/i18n/items';
import { profileEs } from '@/i18n/profile';
import { projectsEs } from '@/i18n/projects';
import { searchEs } from '@/i18n/search';
import { tabsEs } from '@/i18n/tabs';

export const es = {
  common: {
    retry: 'Reintentar',
    loading: 'Cargando…',
    back: 'Volver',
  },
  brand: {
    name: 'Vaivén',
    initial: 'V',
  },
  ui: {
    close: 'Cerrar',
    clearSearch: 'Borrar búsqueda',
    outOfFive: 'de 5',
  },
  auth: authEs,
  profile: profileEs,
  tabs: tabsEs,
  inicio: inicioEs,
  images: imagesEs,
  items: itemsEs,
  bookings: bookingsEs,
  projects: projectsEs,
  search: searchEs,
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
    url: 'URL activa',
    health: '/healthz',
    readiness: '/readyz',
    redis: 'Redis',
    responding: 'Responde',
    ready: 'Listo',
    notReady: 'No disponible',
    devOnly: 'Esta pantalla solo existe en desarrollo.',
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
    description: 'Puede que el enlace haya cambiado.',
    action: 'Ir al inicio',
  },
  configError: {
    title: 'La app no está bien configurada',
    description: 'Revisa las variables del archivo .env.',
  },
} as const;

export type Messages = typeof es;
