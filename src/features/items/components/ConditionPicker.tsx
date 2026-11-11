import { StyleSheet, View } from 'react-native';
import { ChoiceChip } from '@/features/items/components/ChoiceChip';
import { CONDITIONS, type Condition } from '@/features/items/types';
import { es } from '@/i18n/es-MX';
import { spacing } from '@/theme';

type ConditionPickerProps = {
  value: Condition | null;
  onChange: (value: Condition) => void;
};

/** Estado físico del objeto como chips (spec 005 §7.2, punto 5). */
export function ConditionPicker({ value, onChange }: ConditionPickerProps) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={es.items.condition.label}
      style={styles.row}
    >
      {CONDITIONS.map((condition) => (
        <ChoiceChip
          key={condition}
          label={es.items.condition[condition]}
          selected={value === condition}
          onPress={() => onChange(condition)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
