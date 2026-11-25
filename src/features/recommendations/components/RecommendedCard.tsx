import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Chip } from '@/components/ui/Chip';
import { priceSpoken, priceText } from '@/features/items';
import type { Recommendation } from '@/features/recommendations/types';
import { es } from '@/i18n/es-MX';
import { colors, motion, radius, sizes, spacing } from '@/theme';

const PHOTO_RATIO = 4 / 3;
const t = es.recommendations;

/** Motivo en es-MX a partir del código del servidor (Art. V.4): «Porque viste: Taladro Bosch». */
export function reasonText(reason: Recommendation['reason']): string {
  switch (reason.code) {
    case 'similar_to':
      return reason.itemTitle === undefined || reason.itemTitle === ''
        ? t.reason.similarToGeneric
        : `${t.reason.similarTo} ${reason.itemTitle}`;
    case 'popular_in_category':
      return t.reason.popularInCategory;
    case 'popular_nearby':
      return t.reason.popularNearby;
    case 'popular':
      return t.reason.popular;
  }
}

type RecommendedCardProps = {
  recommendation: Recommendation;
  onPress: (itemId: string) => void;
};

/**
 * Tarjeta de 160 pt de «Recomendado para ti» (spec 015 §7.1): foto 4:3, título de una línea, precio
 * o «Gratis» y, debajo, el motivo en una línea con ícono de ojo. Mismo lenguaje que las tarjetas
 * del Inicio; el precio sale del formateo de 005 (P-04).
 */
export function RecommendedCard({ recommendation, onPress }: RecommendedCardProps) {
  const { item, reason } = recommendation;
  const price = priceText(item);
  const why = reasonText(reason);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${priceSpoken(item)}, ${why}`}
      onPress={() => onPress(item.id)}
      style={({ pressed }) => [
        styles.tile,
        pressed && { transform: [{ scale: motion.pressScale }] },
      ]}
    >
      <View style={styles.photo}>
        {item.thumbUrl === null || item.thumbUrl === undefined ? (
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
          <Chip label={t.free} variant="success" />
        </View>
      ) : (
        <AppText variant="label" color="primaryInk">
          {`${price} ${t.perDay}`}
        </AppText>
      )}
      <View style={styles.reason}>
        <AppIcon name="eye" size="sm" color="muted" />
        <AppText variant="caption" color="muted" numberOfLines={1} style={styles.reasonText}>
          {why}
        </AppText>
      </View>
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
  reason: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  reasonText: { flex: 1 },
});
