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
          <Stack screenOptions={{ headerShown: false }} />
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
