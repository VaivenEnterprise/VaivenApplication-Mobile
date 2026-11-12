import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Chip } from '@/components/ui/Chip';
import { ItemStatusBadge } from '@/features/items/components/ItemStatusBadge';
import {
  metaSpoken,
  metaText,
  priceSpoken,
  priceText,
  type ItemCardData,
} from '@/features/items/format';
import { es } from '@/i18n/es-MX';
import { colors, motion, radius, sizes, spacing } from '@/theme';

const PHOTO_RATIO = 4 / 3;

export type ItemCardVariant = 'grid' | 'row';

type ItemCardProps = {
  item: ItemCardData;
  /** `grid` para cuadrículas (Explorar, Proyectos); `row` para listas (Mis objetos). */
  variant?: ItemCardVariant;
  onPress: (item: ItemCardData) => void;
};

function Thumb({ uri, style }: { uri: string | null; style: object }) {
  return (
    <View style={style}>
      {uri === null ? (
        <AppIcon name="cube" size="lg" color="muted" />
      ) : (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          accessibilityIgnoresInvertColors
        />
      )}
    </View>
  );
}

function Price({ item }: { item: ItemCardData }) {
  const price = priceText(item);
  if (price === null) {
    return (
      <View style={styles.free}>
        <Chip label={es.items.money.free} variant="success" />
      </View>
    );
  }
  return (
    <AppText variant="label" color="primaryInk">
      {`${price} ${es.items.money.perDay}`}
    </AppText>
  );
}

/**
 * Tarjeta de un objeto (spec 005 §7.1 y §7.3). `grid`: foto 4:3, título y precio. `row`: miniatura
 * de 72 pt, título de una línea, precio y píldora de estado. Sin menús dentro: tocar abre el detalle.
 * La reutilizan 006 (Explorar) y Proyectos.
 */
export function ItemCard({ item, variant = 'grid', onPress }: ItemCardProps) {
  const spoken = priceSpoken(item);
  const status = item.status === undefined ? '' : `, ${es.items.status[item.status]}`;
  const meta = metaText(item);
  const metaA11y = metaSpoken(item);
  const label = `${item.title}, ${spoken}${metaA11y === null ? '' : `, ${metaA11y}`}${status}`;
  const feedback = ({ pressed }: { pressed: boolean }) =>
    pressed ? { transform: [{ scale: motion.pressScale }] } : null;

  if (variant === 'row') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => onPress(item)}
        style={(state) => [styles.row, feedback(state)]}
      >
        <Thumb uri={item.thumbUrl} style={styles.thumb} />
        <View style={styles.rowTexts}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {item.title}
          </AppText>
          <Price item={item} />
          {item.status === undefined ? null : <ItemStatusBadge status={item.status} />}
        </View>
        <AppIcon name="chevronForward" color="muted" />
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => onPress(item)}
      style={(state) => [styles.grid, feedback(state)]}
    >
      <Thumb uri={item.thumbUrl} style={styles.photo} />
      <AppText variant="bodyStrong" numberOfLines={1}>
        {item.title}
      </AppText>
      <Price item={item} />
      {meta === null ? null : (
        <AppText variant="caption" color="muted" numberOfLines={1}>
          {meta}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: { flex: 1, gap: spacing.xs },
  photo: {
    width: '100%',
    aspectRatio: PHOTO_RATIO,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smd,
    padding: spacing.smd,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    minHeight: sizes.thumbLg + spacing.lg,
  },
  thumb: {
    width: sizes.thumbLg,
    height: sizes.thumbLg,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTexts: { flex: 1, gap: spacing.xs },
  free: { alignItems: 'flex-start' },
});
