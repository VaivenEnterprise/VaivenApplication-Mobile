import { act as reactAct } from 'react';
import { AccessibilityInfo } from 'react-native';
import { act } from '@testing-library/react-native';
import { reduceMotionSync } from '@/test/fakeA11y';

// Configuración global de Jest. Las simulaciones de módulos nativos se agregan
// aquí cuando una tarea las necesite (p. ej. expo-secure-store en T009).

// Spec 011: `_layout.tsx` monta `NotificationsBootstrap`, que importa `expo-notifications`; el módulo
// real no funciona fuera de un dispositivo. Este doble inactivo evita que cualquier prueba que cargue
// el router lo toque. Las pruebas de notificaciones lo reemplazan con su propio `jest.mock` y
// `installFakePush` (src/test/fakePush.ts).
jest.mock('expo-notifications', () => ({
  AndroidImportance: { HIGH: 4 },
  getPermissionsAsync: jest.fn(async () => ({ status: 'undetermined' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'denied' })),
  setNotificationChannelAsync: jest.fn(async () => null),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: 'ExponentPushToken[test]', type: 'expo' })),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getLastNotificationResponse: jest.fn(() => null),
  clearLastNotificationResponse: jest.fn(),
}));

// Spec 021-T008: React Query programa un temporizador de recolección (5 min por defecto) por cada
// consulta de un `QueryClient`; esos temporizadores mantienen vivo el proceso de Jest («did not exit
// one second after the test run»). En pruebas se desactiva la recolección por defecto
// (`gcTime: Infinity`); lo que una prueba o un hook fijan de forma explícita no se toca.
jest.mock('@tanstack/react-query', () => {
  const actual =
    jest.requireActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  class TestQueryClient extends actual.QueryClient {
    constructor(config: ConstructorParameters<typeof actual.QueryClient>[0] = {}) {
      super({
        ...config,
        defaultOptions: {
          ...config.defaultOptions,
          queries: { gcTime: Infinity, ...config.defaultOptions?.queries },
          mutations: { gcTime: Infinity, ...config.defaultOptions?.mutations },
        },
      });
      // Registro para que `afterEach` espere a que terminen las consultas en vuelo.
      const registro = ((globalThis as Record<string, unknown>).__testQueryClients ??=
        []) as unknown[];
      registro.push(this);
    }
  }
  return { ...actual, QueryClient: TestQueryClient };
});

// Las notificaciones diferidas de React Query actualizan componentes con un temporizador de 0 ms; si
// llegan después de que la prueba terminó, React avisa («not wrapped in act»). Antes de desmontar
// se vacían dentro de `act`. Con temporizadores simulados no se hace (la prueba los controla).
afterEach(async () => {
  // Spec 021-T008: las peticiones del `fetch` falso (`src/test/fakeApi.ts`) que siguen sin respuesta se
  // abortan como haría la red; si no, el temporizador de 10 s de `apiFetch` dejaba vivo el worker.
  const pendientes = (globalThis as Record<string, unknown>).__fakeApiPending as
    Set<() => void> | undefined;
  if (pendientes !== undefined) {
    for (const abortar of pendientes) abortar();
    pendientes.clear();
  }
  if ((setTimeout as unknown as { clock?: unknown }).clock !== undefined) return;
  const clientes = ((globalThis as Record<string, unknown>).__testQueryClients ?? []) as {
    isFetching: () => number;
    isMutating: () => number;
  }[];
  // Espera (hasta ~1 s) a que las consultas y mutaciones en vuelo terminen dentro de `act`.
  for (let i = 0; i < 50 && clientes.some((c) => c.isFetching() + c.isMutating() > 0); i++) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
  }
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  clientes.length = 0;
});

// Spec 021-T008: todas las notificaciones de React Query (que llegan con un temporizador) se entregan
// dentro de un `act` síncrono de React, así que nunca producen «not wrapped in act», llegue la
// respuesta cuando llegue. El `act` es síncrono a propósito: uno asíncrono sin esperar se solapa.
beforeAll(() => {
  const flag = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const { notifyManager } =
    jest.requireActual<typeof import('@tanstack/query-core')>('@tanstack/query-core');
  notifyManager.setNotifyFunction((callback) => {
    const previo = flag.IS_REACT_ACT_ENVIRONMENT;
    flag.IS_REACT_ACT_ENVIRONMENT = true;
    try {
      reactAct(() => {
        callback();
      });
    } finally {
      flag.IS_REACT_ACT_ENVIRONMENT = previo;
    }
  });
});

// Las fuentes de los iconos se dan por cargadas: `@expo/vector-icons` hace un `setState` asíncrono al
// terminar de cargarlas y, en pruebas, llega fuera de `act`.
jest.mock('expo-font', () => ({
  ...jest.requireActual<typeof import('expo-font')>('expo-font'),
  isLoaded: () => true,
  loadAsync: jest.fn(async () => undefined),
}));

// Por defecto, «reducir movimiento» se resuelve al instante y en verdadero (sin pulso: la animación en bucle emitiría actualizaciones fuera de act) (ver `src/test/fakeA11y.ts`).
beforeEach(() => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockImplementation(reduceMotionSync(true));
});

export {};
