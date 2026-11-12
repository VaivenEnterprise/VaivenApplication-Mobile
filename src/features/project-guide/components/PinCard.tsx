import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { RatingStars } from '@/components/ui/RatingStars';
import { zoneText } from '@/features/project-guide/components/ToolRow';
import { distanceLabel } from '@/features/project-guide/geometry';
import type { ToolHit } from '@/features/project-guide/types';
import { formatMXN } from '@/lib/format/money';
import { es } from '@/i18n/es-MX';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.bookings.guide;

type PinCardProps = {
  visible: boolean;
  number: number;
  hit: ToolHit;
  /** Hay posición: la zona lleva la distancia aproximada. */
  located: boolean;
  onClose: () => void;
  onRequest: () => void;
  onView: () => void;
};

/**
 * Ficha de la persona (spec 007 §7.1) al tocar un pin o «Conseguir»: objeto, quién lo tiene, precio
 * y zona aproximada, con «Solicitar» y «Ver objeto». No muestra datos de contacto ni dirección.
 */
export function PinCard({
  visible,
  number,
  hit,
  located,
  onClose,
  onRequest,
  onView,
}: PinCardProps) {
  const distance = located ? distanceLabel(hit.distanceKm) : null;
  const zone = distance === null ? zoneText(hit.zone) : `${zoneText(hit.zone)} · ${distance}`;
  const rated = hit.owner.ratingAverage != null && hit.owner.ratingCount > 0;
  const price =
    hit.pricePerDayCents === 0
      ? es.bookings.free
      : `${formatMXN(hit.pricePerDayCents)} ${es.items.money.perDay}`;
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={`${t.pinCard} #${number}`}
      footer={
        <View style={styles.footer}>
          <Button label={t.request} onPress={onRequest} />
          <Button label={t.viewItem} variant="outline" onPress={onView} />
        </View>
      }
    >
      <View style={styles.body}>
        <View style={styles.item}>
          <View style={styles.thumb}>
            {hit.thumbUrl ? (
              <Image
                source={{ uri: hit.thumbUrl }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                accessibilityIgnoresInvertColors
              />
            ) : (
              <AppIcon name="cube" size="lg" color="muted" />
            )}
          </View>
          <AppText variant="subheading" style={styles.title}>
            {hit.title}
          </AppText>
        </View>
        <View style={styles.owner}>
          <Avatar name={hit.owner.displayName} />
          <View style={styles.ownerTexts}>
            <AppText variant="bodyStrong">{hit.owner.displayName}</AppText>
            {rated ? (
              <View style={styles.rating}>
                <RatingStars value={hit.owner.ratingAverage ?? 0} />
                <AppText variant="caption" color="muted">
                  {`${hit.owner.ratingAverage?.toFixed(1)} (${hit.owner.ratingCount})`}
                </AppText>
              </View>
            ) : null}
          </View>
        </View>
        <AppText variant="title">{price}</AppText>
        <Chip label={zone} icon="pin" />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.smd },
  thumb: {
    width: sizes.thumbLg,
    height: sizes.thumbLg,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1 },
  owner: { flexDirection: 'row', alignItems: 'center', gap: spacing.smd },
  ownerTexts: { flex: 1, gap: spacing.xs },
  rating: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  footer: { gap: spacing.sm },
});
