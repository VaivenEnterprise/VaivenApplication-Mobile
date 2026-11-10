import { StyleSheet, View } from 'react-native';
import { es } from '@/i18n/es-MX';
import { colors, radius, shadows, sizes, spacing } from '@/theme';
import { AppText } from './AppText';

export type BrandMarkSize = 'sm' | 'md';

type BrandMarkProps = {
  size?: BrandMarkSize;
  showName?: boolean;
};

const TILE = { sm: sizes.brandTile, md: sizes.thumb } as const;
const LETTER = { sm: 'heading', md: 'title' } as const;
const NAME = { sm: 'heading', md: 'title' } as const;

/** Recuadro terracota con la «V» y, opcionalmente, el nombre de la marca. */
export function BrandMark({ size = 'sm', showName = true }: BrandMarkProps) {
  return (
    <View style={styles.row} accessible accessibilityLabel={es.brand.name}>
      <View style={[styles.tile, { width: TILE[size], height: TILE[size] }]}>
        <AppText variant={LETTER[size]} color="onPrimary">
          {es.brand.initial}
        </AppText>
      </View>
      {showName ? <AppText variant={NAME[size]}>{es.brand.name}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.smd },
  tile: {
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
});
