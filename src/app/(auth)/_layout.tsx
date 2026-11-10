import { Stack } from 'expo-router';

/** Rutas sin sesión: inicio de sesión y registro. */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
