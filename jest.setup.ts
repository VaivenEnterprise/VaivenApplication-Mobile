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

export {};
