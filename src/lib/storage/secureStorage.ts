import * as SecureStore from 'expo-secure-store';

// Único acceso al almacén seguro del dispositivo (Art. VIII.1): tokens y
// credenciales viven aquí, nunca en AsyncStorage ni en variables EXPO_PUBLIC_*.
// Ningún método lanza: un fallo se traduce en `null` o `false`. No se registran
// claves ni valores para no filtrar datos sensibles.

/** Lee un valor; devuelve `null` si no existe o si el almacén falla. */
async function get(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

/** Guarda un valor; devuelve `true` si se guardó. */
async function set(key: string, value: string): Promise<boolean> {
  try {
    await SecureStore.setItemAsync(key, value);
    return true;
  } catch {
    return false;
  }
}

/** Borra un valor; devuelve `true` si la operación terminó bien. */
async function remove(key: string): Promise<boolean> {
  try {
    await SecureStore.deleteItemAsync(key);
    return true;
  } catch {
    return false;
  }
}

export const secureStorage = { get, set, remove } as const;
