import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { SearchBar } from '@/components/ui/SearchBar';
import { es } from '@/i18n/es-MX';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.search;

type ExploreSearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onOpenFilters: () => void;
  /** Filtros activos (sin contar el texto): se muestra como insignia sobre el botón. */
  activeFilters: number;
};

/**
 * Parte fija de Explorar (spec 006 §7.1): `SearchBar` de `ui` con «¿Qué necesitas?» y, a la
 * derecha, el botón de filtros con la insignia del número de filtros activos.
 */
export function ExploreSearchBar({
  value,
  onChangeText,
  onOpenFilters,
  activeFilters,
}: ExploreSearchBarProps) {
  const label =
    activeFilters > 0 ? `${t.filtersButton}, ${activeFilters} ${t.filtersActive}` : t.filtersButton;
  return (
    <SearchBar
      value={value}
      onChangeText={onChangeText}
      placeholder={t.placeholder}
      trailing={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={onOpenFilters}
          style={styles.button}
        >
          <AppIcon name="options" color={activeFilters > 0 ? 'primaryInk' : 'ink'} />
          {activeFilters > 0 ? (
            <View style={styles.badge} testID="filters-badge">
              <AppText variant="eyebrow" color="onPrimary">
                {String(activeFilters)}
              </AppText>
            </View>
          ) : null}
        </Pressable>
      }
    />
  );
}

const BADGE = spacing.md + spacing.xs;

const styles = StyleSheet.create({
  button: {
    minWidth: sizes.touch.minSize,
    minHeight: sizes.touch.minSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    minWidth: BADGE,
    height: BADGE,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
