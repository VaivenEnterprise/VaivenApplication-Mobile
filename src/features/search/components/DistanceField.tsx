import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { ChoiceChip } from '@/features/items';
import type { RadiusKm } from '@/features/search/types';
import type { LocationApi } from '@/features/search/useLocation';
import { es } from '@/i18n/es-MX';
import { POLICY } from '@/lib/policy';
import { spacing } from '@/theme';

const t = es.search.filters;

type DistanceFieldProps = {
  value: RadiusKm | null;
  onChange: (radius: RadiusKm | null) => void;
  location: LocationApi;
};

/**
 * Distancia (spec 006 §7.2, RF-04): chips 1 · 3 · 5 · 10 km. El permiso de ubicación se pide al
 * elegir un radio, no antes. Si se niega, el filtro entero se oculta y el resto sigue (CA-04).
 * Volver a tocar el radio elegido lo quita.
 */
export function DistanceField({ value, onChange, location }: DistanceFieldProps) {
  if (location.availability === 'unavailable') return null;

  const choose = async (radius: RadiusKm) => {
    if (value === radius) {
      onChange(null);
      return;
    }
    if (location.coords === null && (await location.locate()) === null) return;
    onChange(radius);
  };

  return (
    <View style={styles.root}>
      <AppText variant="subheading" accessibilityRole="header">
        {t.distance}
      </AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="radiogroup"
        accessibilityLabel={t.distance}
        contentContainerStyle={styles.row}
      >
        {POLICY.search.radiiKm.map((radius) => (
          <ChoiceChip
            key={radius}
            label={`${radius} ${t.distanceUnit}`}
            selected={value === radius}
            onPress={() => void choose(radius)}
          />
        ))}
      </ScrollView>
      <AppText variant="caption" color="muted">
        {location.locating ? t.distanceLocating : t.distanceHint}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.smd },
  row: { flexDirection: 'row', gap: spacing.sm },
});
