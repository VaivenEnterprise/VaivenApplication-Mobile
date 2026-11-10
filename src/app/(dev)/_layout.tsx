import { Redirect, Stack, type Href } from 'expo-router';
import { getConfig } from '@/lib/config';

// Sin `.expo/types` (CI, clon limpio) '/' no es un `Href` válido; con ellos sí. La conversión sirve a ambos casos.
const HOME = '/' as string as Href;

/** Rutas solo de desarrollo: fuera de `development` se vuelve al inicio (P-10). */
export default function DevLayout() {
  if (getConfig().appEnv !== 'development') return <Redirect href={HOME} />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
