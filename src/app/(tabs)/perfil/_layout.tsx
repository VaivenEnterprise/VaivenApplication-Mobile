import { Stack } from 'expo-router';

/** Pila de la pestaña: las pantallas internas de su spec se agregan aquí dentro. */
export default function TabStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
