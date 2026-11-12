import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { usePriceSuggestion } from '@/features/items/hooks';
import { es } from '@/i18n/es-MX';
import { colors, radius, sizes, spacing } from '@/theme';
import { POLICY } from '@/lib/policy';

const t = es.items.form;

type PriceSuggestionProps = {
  /** Valor declarado en centavos; el chip aparece solo cuando está dentro del rango permitido. */
  declaredValueCents: number | null;
  /** Recibe el precio sugerido (centavos): el formulario lo rellena como `suggested`. */
  onApply: (cents: number) => void;
};

/** Chip «Usar sugerido» (spec 005 §7.2, RF-04): consulta `GET /items/price-suggestion` al tocarlo. */
export function PriceSuggestion({ declaredValueCents, onApply }: PriceSuggestionProps) {
  const suggestion = usePriceSuggestion();
  const [applied, setApplied] = useState(false);
  const [failed, setFailed] = useState(false);

  const valid =
    declaredValueCents !== null &&
    declaredValueCents >= POLICY.declaredValueCents.min &&
    declaredValueCents <= POLICY.declaredValueCents.max;
  if (!valid) return null;

  const apply = async () => {
    setFailed(false);
    try {
      const cents = await suggestion.mutateAsync(declaredValueCents);
      onApply(cents);
      setApplied(true);
    } catch {
      setFailed(true);
    }
  };

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.useSuggested}
        accessibilityState={{ busy: suggestion.isPending, disabled: suggestion.isPending }}
        disabled={suggestion.isPending}
        onPress={() => void apply()}
        style={styles.chip}
      >
        <AppIcon name="success" size="sm" color="secondaryPressed" />
        <AppText variant="label" color="secondaryPressed">
          {t.useSuggested}
        </AppText>
      </Pressable>
      {applied && !failed ? (
        <AppText variant="caption" color="muted" accessibilityLiveRegion="polite">
          {t.suggestedApplied}
        </AppText>
      ) : null}
      {failed ? (
        <AppText variant="caption" color="danger" accessibilityRole="alert">
          {t.suggestionFailed}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs, alignItems: 'flex-start' },
  chip: {
    minHeight: sizes.touch.minSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.secondarySoft,
  },
});
