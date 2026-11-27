import { useContext, useEffect } from 'react';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { BrandMark } from '@/components/ui/BrandMark';
import { Button } from '@/components/ui/Button';
import { IconBadge } from '@/components/ui/IconBadge';
import { Screen } from '@/components/ui/Screen';
import { SessionContext } from '@/features/auth/session';
import { es } from '@/i18n/es-MX';
import { colors, spacing } from '@/theme';

const t = es.auth.restoreOffline;

/**
 * Mientras se restaura la sesión (spec 003 §7.12): marca centrada e indicador discreto, sin texto.
 * Spec 021-T014 (B-5): si al arrancar no hay red, la sesión guardada se conserva y aquí se explica,
 * con «Reintentar»; también se reintenta solo al volver la app a primer plano. Nunca el login.
 */
export function RestoringScreen() {
  const session = useContext(SessionContext);
  const offline = session?.restoreOffline === true;
  const retry = session?.retryRestore;

  useEffect(() => {
    if (!offline || retry === undefined) return undefined;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') retry();
    });
    return () => subscription.remove();
  }, [offline, retry]);

  if (offline && retry !== undefined) {
    return (
      <Screen background="auth" scroll={false} contentStyle={styles.offline}>
        <IconBadge icon="cloudOffline" tone="warning" size="lg" />
        <AppText variant="title" accessibilityRole="header" style={styles.centered}>
          {t.title}
        </AppText>
        <AppText color="muted" style={styles.centered}>
          {t.description}
        </AppText>
        <Button label={es.common.retry} onPress={retry} />
      </Screen>
    );
  }

  return (
    <Screen background="auth" scroll={false} contentStyle={styles.center}>
      <BrandMark size="md" />
      <View accessible accessibilityLabel={es.auth.restoring} accessibilityRole="progressbar">
        <ActivityIndicator color={colors.primary} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  // Misma composición que `SuspendedScreen`: contenido centrado y botón a lo ancho.
  offline: { flex: 1, alignItems: 'stretch', justifyContent: 'center', gap: spacing.md },
  centered: { textAlign: 'center' },
});
