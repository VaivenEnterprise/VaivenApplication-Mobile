import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import type { PaymentMode } from '@/features/bookings/types';
import { es } from '@/i18n/es-MX';
import { colors, radius, sizes, spacing } from '@/theme';

type RentMode = Exclude<PaymentMode, 'none'>;
const MODES: readonly RentMode[] = ['full_on_delivery', 'split_50_50'];

type PaymentModePickerProps = {
  value: RentMode;
  onChange: (mode: RentMode) => void;
};

/**
 * «¿Cómo pagan?» (spec 007 §7.3): dos tarjetas seleccionables. Solo explican la forma de pago; los
 * importes salen de la cotización del servidor (Art. V), no se calculan aquí.
 */
export function PaymentModePicker({ value, onChange }: PaymentModePickerProps) {
  return (
    <View accessibilityRole="radiogroup" style={styles.root}>
      {MODES.map((mode) => {
        const selected = mode === value;
        return (
          <Pressable
            key={mode}
            accessibilityRole="radio"
            accessibilityLabel={`${es.bookings.paymentMode[mode]}. ${es.bookings.paymentModeHint[mode]}`}
            accessibilityState={{ selected }}
            onPress={() => onChange(mode)}
            style={[styles.card, selected ? styles.selected : styles.idle]}
          >
            <AppText variant="bodyStrong" color={selected ? 'primaryInk' : 'ink'}>
              {es.bookings.paymentMode[mode]}
            </AppText>
            <AppText variant="caption" color="muted">
              {es.bookings.paymentModeHint[mode]}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  card: {
    minHeight: sizes.touch.minSize,
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: sizes.control.border,
  },
  idle: { backgroundColor: colors.surface, borderColor: colors.fieldBorder },
  selected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
});
