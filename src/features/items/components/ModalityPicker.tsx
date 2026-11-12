import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon, type IconName } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { MODALITIES, type Modality } from '@/features/items/types';
import { es } from '@/i18n/es-MX';
import { colors, radius, sizes, spacing } from '@/theme';

const OPTIONS: Record<Modality, { icon: IconName; hint: string }> = {
  loan: { icon: 'hand', hint: es.items.modality.loanHint },
  rent: { icon: 'cash', hint: es.items.modality.rentHint },
};

type ModalityPickerProps = {
  value: Modality | null;
  onChange: (value: Modality) => void;
};

/** Dos opciones grandes: «Préstamo» (gratis) y «Renta» (por día) (spec 005 §7.2, punto 4). */
export function ModalityPicker({ value, onChange }: ModalityPickerProps) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={es.items.modality.label}
      style={styles.row}
    >
      {MODALITIES.map((modality) => {
        const selected = value === modality;
        const option = OPTIONS[modality];
        return (
          <Pressable
            key={modality}
            accessibilityRole="radio"
            accessibilityLabel={`${es.items.modality[modality]}, ${option.hint}`}
            accessibilityState={{ selected }}
            onPress={() => onChange(modality)}
            style={[styles.option, selected ? styles.selected : styles.idle]}
          >
            <AppIcon name={option.icon} size="lg" color={selected ? 'primaryInk' : 'muted'} />
            <AppText variant="bodyStrong" color={selected ? 'primaryInk' : 'ink'}>
              {es.items.modality[modality]}
            </AppText>
            <AppText variant="caption" color="muted">
              {option.hint}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.smd },
  option: {
    flex: 1,
    minHeight: sizes.control.height + spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.smd,
    borderRadius: radius.lg,
    borderWidth: sizes.field.borderFocus,
  },
  idle: { backgroundColor: colors.surface, borderColor: colors.border },
  selected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
});
