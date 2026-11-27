import * as LocalAuthentication from 'expo-local-authentication';
import { secureStorage } from '@/lib/storage/secureStorage';

// Spec 021-T015 (RF-14): biometría OPCIONAL para volver a entrar tras el cierre por inactividad.
// No se guarda ningún dato biométrico: el sistema solo responde si la persona se confirmó. La única
// marca («desbloqueo activado») vive en el almacén seguro, como el token (Art. VIII.1, S-14f).

export const BIOMETRIC_UNLOCK_KEY = 'vaiven.biometricUnlock';
const ENABLED = '1';

/** `true` si el teléfono tiene sensor y al menos una huella o rostro registrados. */
export async function biometricsAvailable(): Promise<boolean> {
  try {
    return (
      (await LocalAuthentication.hasHardwareAsync()) &&
      (await LocalAuthentication.isEnrolledAsync())
    );
  } catch {
    return false;
  }
}

/** Pide al sistema que la persona se confirme; `true` solo si lo logró (cancelar es `false`). */
export async function confirmIdentity(
  promptMessage: string,
  cancelLabel: string,
): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({ promptMessage, cancelLabel });
    return result.success;
  } catch {
    return false;
  }
}

/** La persona activó el desbloqueo con biometría en este teléfono. */
export async function isBiometricUnlockEnabled(): Promise<boolean> {
  return (await secureStorage.get(BIOMETRIC_UNLOCK_KEY)) === ENABLED;
}

/** Activa o desactiva el desbloqueo; devuelve `true` si el almacén seguro lo guardó. */
export function setBiometricUnlock(enabled: boolean): Promise<boolean> {
  return enabled
    ? secureStorage.set(BIOMETRIC_UNLOCK_KEY, ENABLED)
    : secureStorage.remove(BIOMETRIC_UNLOCK_KEY);
}
