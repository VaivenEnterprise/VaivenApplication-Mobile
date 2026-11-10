import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Chip } from '@/components/ui/Chip';
import type { HomeItem } from '@/features/home/schemas';
import { es } from '@/i18n/es-MX';
import { formatMXN } from '@/lib/format/money';
import { colors, motion, radius, sizes, spacing } from '@/theme';

const PHOTO_RATIO = 4 / 3;

/** «$90» en vez de «$90.00» cuando el precio es redondo. */
function priceOf(item: HomeItem): string | null {
  if (item.modality === 'loan' || item.pricePerDayCents === 0) return null;
  return formatMXN(item.pricePerDayCents).replace(/\.00$/, '');
}

type HomeItemTileProps = {
  item: HomeItem;
  onPress: (item: HomeItem) => void;
};

/** Tarjeta de 160 pt de un objeto reciente: foto 4:3, título de una línea y precio o «Gratis». */
export function HomeItemTile({ item, onPress }: HomeItemTileProps) {
  const price = priceOf(item);
  const spoken = price === null ? es.inicio.itemA11yFree : `${price} ${es.inicio.perDay}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${spoken}`}
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.tile,
        pressed && { transform: [{ scale: motion.pressScale }] },
      ]}
    >
      <View style={styles.photo}>
        {item.thumbUrl === null ? (
          <AppIcon name="cube" size="lg" color="muted" />
        ) : (
          <Image
            source={{ uri: item.thumbUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
        )}
      </View>
      <AppText variant="bodyStrong" numberOfLines={1}>
        {item.title}
      </AppText>
      {price === null ? (
        <View style={styles.free}>
          <Chip label={es.inicio.free} variant="success" />
        </View>
      ) : (
        <AppText variant="label" color="primaryInk">
          {`${price} ${es.inicio.perDay}`}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { width: sizes.homeTile, gap: spacing.xs },
  photo: {
    width: sizes.homeTile,
    aspectRatio: PHOTO_RATIO,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  free: { alignItems: 'flex-start' },
});
