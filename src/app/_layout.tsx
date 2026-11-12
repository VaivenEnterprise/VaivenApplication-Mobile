import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { Screen } from '@/components/ui/Screen';
import { RestoringScreen } from '@/features/auth/screens/RestoringScreen';
import { SuspendedScreen } from '@/features/auth/screens/SuspendedScreen';
import { useSession } from '@/features/auth/useSession';
import { es } from '@/i18n/es-MX';
import { configResult, type ConfigError } from '@/lib/config';
import { AppProviders } from '@/providers/AppProviders';
import { fontFamily, spacing } from '@/theme';

// Mantiene el splash hasta que las fuentes estén listas; si falla, la app sigue con la del sistema.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

function ConfigErrorScreen({ error }: { error: ConfigError }) {
  return (
    <Screen scroll={false} contentStyle={styles.center}>
      <IconBadge icon="warning" tone="warning" size="lg" />
      <AppText variant="heading" style={styles.centered} accessibilityRole="header">
        {es.configError.title}
      </AppText>
      <AppText color="muted" style={styles.centered}>
        {es.configError.description}
      </AppText>
      <Card variant="muted" style={styles.detail}>
        <AppText variant="caption" color="muted">
          {error.issues.join(' ')}
        </AppText>
      </Card>
    </Screen>
  );
}

/** Rutas con sesión que viven fuera de las pestañas; cada spec llena la suya (plan 003 §1). */
const SIGNED_IN_SCREENS = [
  '(tabs)',
  'objeto/[id]',
  'solicitar/[itemId]',
  'reserva/[id]',
  'chat/[id]',
  'usuario/[id]',
  'incidencia/[id]',
  'proyecto/[id]',
] as const;

/**
 * Auth gate (RF-04): sin sesión solo existen las rutas `(auth)`; con sesión, las pestañas y las
 * rutas de detalle. Mientras se restaura la sesión se muestra una pantalla de carga, sin parpadeo.
 */
function RootNavigator() {
  const { status, suspension, dismissSuspension } = useSession();
  if (suspension !== null) {
    return <SuspendedScreen until={suspension.until} onDismiss={dismissSuspension} />;
  }
  if (status === 'loading') return <RestoringScreen />;

  const signedIn = status === 'signedIn';
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(dev)" />
      <Stack.Protected guard={signedIn}>
        {SIGNED_IN_SCREENS.map((name) => (
          <Stack.Screen key={name} name={name} />
        ))}
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    [fontFamily.regular]: PlusJakartaSans_400Regular,
    [fontFamily.medium]: PlusJakartaSans_500Medium,
    [fontFamily.semibold]: PlusJakartaSans_600SemiBold,
    [fontFamily.bold]: PlusJakartaSans_700Bold,
    [fontFamily.extrabold]: PlusJakartaSans_800ExtraBold,
  });
  const ready = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return null;

  return (
    <AppErrorBoundary>
      <StatusBar style="dark" />
      {configResult.ok ? (
        <AppProviders>
          <RootNavigator />
        </AppProviders>
      ) : (
        <ConfigErrorScreen error={configResult.error} />
      )}
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centered: { textAlign: 'center' },
  detail: { alignSelf: 'stretch', marginTop: spacing.sm, padding: spacing.md },
});
