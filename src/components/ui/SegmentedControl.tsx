import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, shadows, sizes, spacing } from '@/theme';
import { AppText } from './AppText';

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  /** Insignia numérica opcional (p. ej. solicitudes pendientes). */
  badge?: number;
};

type SegmentedControlProps<T extends string> = {
  /** De dos a cuatro opciones. */
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View accessibilityRole="tablist" style={styles.track}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && styles.active]}
          >
            <AppText variant="label" color={selected ? 'ink' : 'muted'}>
              {option.label}
            </AppText>
            {option.badge === undefined ? null : (
              <View style={styles.badge}>
                <AppText variant="tab" color="onPrimary">
                  {String(option.badge)}
                </AppText>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  segment: {
    flex: 1,
    minHeight: sizes.touch.minSize,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
  },
  active: { backgroundColor: colors.surface, ...shadows.soft },
  badge: {
    minWidth: spacing.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
});
