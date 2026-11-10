import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { colors, radius, sizes, spacing } from '@/theme';

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Contenido de la etiqueta; puede llevar texto anidado con enlaces. */
  children: ReactNode;
  /** Etiqueta para lectores de pantalla (el contenido puede incluir enlaces). */
  accessibilityLabel: string;
  error?: string | undefined;
};

/** Casilla con área táctil ≥ 44 pt y mensaje de error con ícono. */
export function Checkbox({
  checked,
  onChange,
  children,
  accessibilityLabel,
  error,
}: CheckboxProps) {
  const invalid = error !== undefined;
  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ checked }}
          onPress={() => onChange(!checked)}
          style={styles.target}
        >
          <View style={[styles.box, checked && styles.boxChecked, invalid && styles.boxError]}>
            {checked ? <AppIcon name="check" size="sm" color="onPrimary" /> : null}
          </View>
        </Pressable>
        <AppText style={styles.label}>{children}</AppText>
      </View>
      {invalid ? (
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
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  target: {
    width: sizes.touch.minSize,
    height: sizes.touch.minSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: sizes.field.checkbox,
    height: sizes.field.checkbox,
    borderRadius: radius.sm,
    borderWidth: sizes.control.border,
    borderColor: colors.fieldBorder,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  boxError: { borderColor: colors.danger },
  label: { flex: 1, paddingTop: spacing.smd },
  error: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  errorText: { flex: 1 },
});
