import { ScrollView, StyleSheet, View } from 'react-native';
import { ChoiceChip, useCategories } from '@/features/items';
import { es } from '@/i18n/es-MX';
import { spacing } from '@/theme';

const t = es.search;

type CategoryChipsProps = {
  /** Clave de la categoría elegida; `null` = «Todo». */
  value: string | null;
  onChange: (category: string | null) => void;
  /** Con `true` los chips se acomodan en varias líneas (hoja de filtros) en lugar de desplazarse. */
  wrap?: boolean;
};

/**
 * Chips de categoría de selección única (spec 006 §7.1). Las categorías vienen de
 * `GET /categories` (`useCategories`); mientras cargan o si fallan, queda solo «Todo».
 * Volver a tocar la categoría elegida la quita.
 */
export function CategoryChips({ value, onChange, wrap = false }: CategoryChipsProps) {
  const { data } = useCategories();
  const chips = (
    <>
      <ChoiceChip
        label={t.allCategories}
        selected={value === null}
        onPress={() => onChange(null)}
      />
      {(data ?? []).map((category) => (
        <ChoiceChip
          key={category.key}
          label={category.label}
          selected={value === category.key}
          onPress={() => onChange(value === category.key ? null : category.key)}
        />
      ))}
    </>
  );

  if (wrap) {
    return (
      <View accessibilityRole="radiogroup" accessibilityLabel={t.categories} style={styles.wrap}>
        {chips}
      </View>
    );
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="radiogroup"
      accessibilityLabel={t.categories}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {chips}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.xs },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
