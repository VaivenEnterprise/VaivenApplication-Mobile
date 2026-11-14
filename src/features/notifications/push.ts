import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';
import {
  deletePushToken,
  registerPushToken,
  type PushPlatform,
} from '@/features/notifications/api';
import { es } from '@/i18n/es-MX';
import { secureStorage } from '@/lib/storage/secureStorage';

// Permisos, canal y token de push (spec 011 RF-03, RF-04, RF-09; plan P-02, P-03, P-07, P-08).
// Todo lo que toca `expo-notifications` vive aquí para que el resto se pruebe con dobles.
// Nunca se registran tokens ni datos de avisos en consola (Art. VIII.3).

export type PushPermission = 'granted' | 'denied' | 'undetermined';

/** Canal por defecto de Android: lo usan las push que llegan sin canal explícito. */
export const ANDROID_CHANNEL_ID = 'default';

/** Se guarda al mostrar la pantalla previa (o al responder el permiso) para no insistir (P-03). */
export const PRIMER_SEEN_KEY = 'vaiven.push.primerSeen';
/** Se guarda cuando la persona apaga el interruptor: no se vuelve a registrar sola. */
export const DISABLED_KEY = 'vaiven.push.disabled';

/** Token registrado en esta sesión; permite darlo de baja al cerrar sesión (CA-06). */
let registeredToken: string | null = null;

export function getRegisteredToken(): string | null {
  return registeredToken;
}

/** Solo para pruebas. */
export function resetPushState(): void {
  registeredToken = null;
}

/** En emulador no hay push (P-08); Expo Go en Android tampoco las recibe, pero eso se ve al pedir el token. */
export function isPushSupported(): boolean {
  return Device.isDevice;
}

export function currentPlatform(): PushPlatform | null {
  return Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : null;
}

function toPermission(status: string): PushPermission {
  return status === 'granted' || status === 'denied' ? status : 'undetermined';
}

export async function getPermission(): Promise<PushPermission> {
  const result = await Notifications.getPermissionsAsync();
  return toPermission(result.status);
}

/** Pide el permiso del sistema. En Android 13+ el canal debe existir antes del diálogo. */
export async function requestPermission(): Promise<PushPermission> {
  await ensureChannel();
  const result = await Notifications.requestPermissionsAsync();
  return toPermission(result.status);
}

/** Crea el canal «Vaivén» con importancia alta (RF-04, P-07). Solo Android; no falla si no puede. */
export async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: es.notifications.channel.name,
      importance: AndroidImportance.HIGH,
    });
  } catch {
    // Sin canal la push llega igual con el canal que Android asigne.
  }
}

/** `projectId` de EAS desde la configuración (público, no es un secreto; P-02). */
function projectId(): string | null {
  const eas = (Constants.expoConfig?.extra as { eas?: { projectId?: unknown } } | undefined)?.eas;
  return typeof eas?.projectId === 'string' && eas.projectId !== '' ? eas.projectId : null;
}

/** Token de Expo de este dispositivo; `null` si no se puede obtener (sin proyecto, Expo Go, red). */
export async function getExpoToken(): Promise<string | null> {
  const id = projectId();
  if (id === null) return null;
  try {
    const result = await Notifications.getExpoPushTokenAsync({ projectId: id });
    return result.data === '' ? null : result.data;
  } catch {
    return null;
  }
}

/** Qué hacer con las push que llegan con la app abierta: no mostrar la del sistema, la app pinta la suya (§7.3). */
export function configureForegroundHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Obtiene el token y lo registra en el servidor (`POST /me/push-tokens`). Devuelve `false` si no
 * había token o plataforma; los fallos de red se propagan para que quien llama decida.
 */
export async function registerDevice(): Promise<boolean> {
  const platform = currentPlatform();
  if (platform === null) return false;
  await ensureChannel();
  const token = await getExpoToken();
  if (token === null) return false;
  await registerPushToken(token, platform);
  registeredToken = token;
  return true;
}

/** Da de baja el token en el servidor. Sin token registrado intenta obtenerlo; los fallos se ignoran. */
export async function unregisterDevice(): Promise<void> {
  const token = registeredToken ?? (isPushSupported() ? await getExpoToken() : null);
  if (token === null) return;
  try {
    await deletePushToken(token);
  } catch {
    // El servidor reasigna el token cuando otra persona lo registre; no se bloquea nada.
  }
  registeredToken = null;
}

/** Lee una marca booleana del almacén seguro. */
export async function readFlag(key: string): Promise<boolean> {
  return (await secureStorage.get(key)) === '1';
}

export async function writeFlag(key: string, value: boolean): Promise<void> {
  if (value) await secureStorage.set(key, '1');
  else await secureStorage.remove(key);
}
