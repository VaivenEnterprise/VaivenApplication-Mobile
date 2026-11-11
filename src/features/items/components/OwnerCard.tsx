import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { RatingStars } from '@/components/ui/RatingStars';
import type { PublicUser } from '@/features/profile/schemas';
import { es } from '@/i18n/es-MX';
import { colors, radius, spacing } from '@/theme';

type OwnerCardProps = {
  owner: PublicUser;
  /** Abre el perfil público de la persona. */
  onPress: () => void;
};

/** Quién ofrece el objeto: avatar, nombre, estrellas y «4.9 (18)»; lleva a `usuario/[id]`. */
export function OwnerCard({ owner, onPress }: OwnerCardProps) {
  const rated = owner.ratingAverage !== null && owner.ratingCount > 0;
  const summary = rated
    ? `${owner.ratingAverage?.toFixed(1)} (${owner.ratingCount})`
    : es.items.detail.ratingNone;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${es.items.detail.owner} ${owner.displayName}, ${summary}. ${es.items.detail.openProfile}`}
      onPress={onPress}
      style={styles.card}
    >
      <Avatar name={owner.displayName} />
      <View style={styles.texts}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {owner.displayName}
        </AppText>
        <View style={styles.rating}>
          {rated ? <RatingStars value={owner.ratingAverage ?? 0} /> : null}
          <AppText variant="caption" color="muted">
            {summary}
          </AppText>
        </View>
      </View>
      <AppIcon name="chevronForward" color="muted" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smd,
    padding: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
  },
  texts: { flex: 1, gap: spacing.xs },
  rating: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
