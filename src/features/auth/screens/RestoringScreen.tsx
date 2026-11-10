import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { BrandMark } from '@/components/ui/BrandMark';
import { Screen } from '@/components/ui/Screen';
import { es } from '@/i18n/es-MX';
import { colors, spacing } from '@/theme';

/** Mientras se restaura la sesión (spec 003 §7.12): marca centrada e indicador discreto, sin texto. */
export function RestoringScreen() {
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
});
