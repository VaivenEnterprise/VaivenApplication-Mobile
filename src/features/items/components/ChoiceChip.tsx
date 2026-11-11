import { Pressable, StyleSheet } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { colors, radius, sizes, spacing } from '@/theme';

type ChoiceChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

/** Opción de una elección única (categoría, estado físico): píldora táctil de al menos 44 pt. */
export function ChoiceChip({ label, selected, onPress }: ChoiceChipProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected ? styles.selected : styles.idle]}
    >
      <AppText variant="label" color={selected ? 'onPrimary' : 'ink'}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: sizes.touch.minSize,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: sizes.field.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idle: { backgroundColor: colors.surface, borderColor: colors.fieldBorder },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
});
