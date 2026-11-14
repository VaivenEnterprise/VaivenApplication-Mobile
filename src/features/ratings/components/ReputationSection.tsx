import { StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { RatingStars } from '@/components/ui/RatingStars';
import { RatingsList } from '@/features/ratings/components/RatingsList';
import { formatAverage } from '@/features/ratings/components/RatingSummary';
import { es } from '@/i18n/es-MX';
import { spacing } from '@/theme';

const t = es.ratings.reputation;

type ReputationSectionProps = {
  /** Cualquier persona con promedio y cantidad: el perfil propio o el público. */
  user: { id: string; ratingAverage: number | null; ratingCount: number };
};

/**
 * Reputación de una persona (spec 010 §7.2, RF-03): promedio grande con estrellas y cantidad, y
 * debajo los comentarios. Sin calificaciones: «Aún sin calificaciones».
 */
export function ReputationSection({ user }: ReputationSectionProps) {
  const { ratingAverage, ratingCount } = user;
  if (ratingAverage === null || ratingCount <= 0) {
    return <EmptyState compact icon="starOutline" title={t.empty} description={t.emptyHint} />;
  }
  return (
    <View style={styles.root}>
      <Card style={styles.summary}>
        <AppText variant="display">{formatAverage(ratingAverage)}</AppText>
        <RatingStars value={ratingAverage} />
        <AppText variant="caption" color="muted">
          {`${ratingCount} ${ratingCount === 1 ? t.ratingOne : t.ratings}`}
        </AppText>
      </Card>
      <RatingsList userId={user.id} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md, alignSelf: 'stretch' },
  summary: { alignItems: 'center', gap: spacing.sm },
});
