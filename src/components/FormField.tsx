import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { spacing } from '@/theme';

type FormFieldProps = {
  label: string;
  children: ReactNode;
  /** Mensaje de error: se muestra con ícono y texto (no solo color). */
  error?: string | undefined;
  hint?: string | undefined;
};

/** Etiqueta, control y mensajes de un campo de formulario. */
export function FormField({ label, children, error, hint }: FormFieldProps) {
  return (
    <View style={styles.root}>
      <AppText variant="label">{label}</AppText>
      {children}
      {error === undefined ? null : (
        <View
          accessible
          style={styles.error}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <AppIcon name="danger" size="sm" color="danger" />
          <AppText variant="caption" color="danger" style={styles.errorText}>
            {error}
          </AppText>
        </View>
      )}
      {error === undefined && hint !== undefined ? (
        <AppText variant="caption" color="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  error: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  errorText: { flex: 1 },
});
