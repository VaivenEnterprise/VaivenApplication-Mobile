import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { borders, colors, radius, sizes, spacing, touch } from '@/theme';

type Props = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
};

export function Checkbox({ label, checked, onChange, error }: Props) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityHint={error}
        accessibilityLabel={label}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={() => onChange(!checked)}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <View style={[styles.box, checked && styles.boxChecked]}>
          {checked ? (
            <Ionicons color={colors.onPrimary} name="checkmark" size={sizes.iconSmall} />
          ) : null}
        </View>
        <AppText variant="caption" style={styles.label}>
          {label}
        </AppText>
      </Pressable>
      {error ? (
        <AppText
          accessibilityLiveRegion="polite"
          color="danger"
          variant="caption"
          style={styles.error}
        >
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  error: {
    marginLeft: sizes.icon + spacing.sm,
  },
  box: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: borders.width,
    height: sizes.icon,
    justifyContent: 'center',
    width: sizes.icon,
  },
  boxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    flex: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: touch.minSize,
  },
});
