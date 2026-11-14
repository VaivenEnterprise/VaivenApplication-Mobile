import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

// Dobles de `expo-notifications` y `expo-device` para pruebas de la spec 011. Cada prueba debe
// declarar en línea `jest.mock('expo-notifications', () => ({ … }))` y `jest.mock('expo-device', …)` con
// funciones `jest.fn()` (las que usa la app); aquí se les da comportamiento.

export const PUSH_TOKEN = 'ExponentPushToken[abc123]';

type FakePushOptions = {
  permission?: 'granted' | 'denied' | 'undetermined';
  /** Qué responde el sistema al pedir el permiso desde «undetermined». */
  grantOnRequest?: boolean;
  isDevice?: boolean;
  token?: string | null;
};

type NotificationInput = { title?: string; body?: string; data?: Record<string, unknown> };

const shape = (identifier: string, input: NotificationInput) => ({
  request: {
    identifier,
    content: {
      title: input.title ?? 'Título',
      body: input.body ?? 'Detalle',
      data: input.data ?? {},
    },
  },
});

/** Configura los dobles y devuelve controles para simular lo que hace el sistema. */
export function installFakePush(options: FakePushOptions = {}) {
  const n = jest.mocked(Notifications);
  for (const fn of Object.values(n)) {
    if (typeof fn === 'function' && 'mockReset' in fn) (fn as jest.Mock).mockReset();
  }
  let permission = options.permission ?? 'undetermined';
  Object.defineProperty(Device, 'isDevice', {
    value: options.isDevice ?? true,
    configurable: true,
  });

  n.getPermissionsAsync.mockImplementation(async () => ({ status: permission }) as never);
  n.requestPermissionsAsync.mockImplementation(async () => {
    if (permission === 'undetermined') {
      permission = options.grantOnRequest === false ? 'denied' : 'granted';
    }
    return { status: permission } as never;
  });
  n.setNotificationChannelAsync.mockResolvedValue(null as never);
  n.getExpoPushTokenAsync.mockImplementation(async () => {
    if (options.token === null) throw new Error('sin token');
    return { data: options.token ?? PUSH_TOKEN, type: 'expo' } as never;
  });

  let received: ((notification: unknown) => void) | null = null;
  let responded: ((response: unknown) => void) | null = null;
  const removeReceived = jest.fn();
  const removeResponse = jest.fn();
  n.addNotificationReceivedListener.mockImplementation(((listener: (n: unknown) => void) => {
    received = listener;
    return { remove: removeReceived };
  }) as never);
  n.addNotificationResponseReceivedListener.mockImplementation(((
    listener: (r: unknown) => void,
  ) => {
    responded = listener;
    return { remove: removeResponse };
  }) as never);
  n.getLastNotificationResponse.mockReturnValue(null);

  return {
    notifications: n,
    removeReceived,
    removeResponse,
    setPermission: (next: 'granted' | 'denied' | 'undetermined') => {
      permission = next;
    },
    /** Llega una push con la app abierta. */
    emitReceived: (input: NotificationInput = {}) => received?.(shape('n-received', input)),
    /** La persona toca una push con la app abierta o en segundo plano. */
    emitResponse: (input: NotificationInput = {}, id = 'n-tapped') =>
      responded?.({ actionIdentifier: 'default', notification: shape(id, input) }),
    /** La app se abrió tocando una push (arranque en frío). */
    setLastResponse: (input: NotificationInput = {}, id = 'n-cold') => {
      n.getLastNotificationResponse.mockReturnValue({
        actionIdentifier: 'default',
        notification: shape(id, input),
      } as never);
    },
    hasReceivedListener: () => received !== null,
  };
}
