import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { RatingStars } from '@/components/ui/RatingStars';
import type { Rating } from '@/features/ratings/types';
import { es } from '@/i18n/es-MX';
import { formatDate } from '@/lib/format/date';
import { spacing } from '@/theme';

const t = es.ratings.reputation;

/** Una calificación recibida: quién calificó, estrellas, fecha y comentario (spec 010 §7.2). */
export function RatingCard({ rating }: { rating: Rating }) {
  const comment = rating.comment?.trim() ?? '';
  return (
    <Card variant="muted" style={styles.card}>
      <View style={styles.head}>
        <Avatar name={rating.rater.displayName} size="sm" />
        <View style={styles.who}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {rating.rater.displayName}
          </AppText>
          <AppText variant="caption" color="muted">
            {formatDate(rating.createdAt)}
          </AppText>
        </View>
        <RatingStars value={rating.score} />
      </View>
      <AppText color={comment === '' ? 'muted' : 'ink'}>
        {comment === '' ? t.noComment : comment}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm, padding: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.smd },
  who: { flex: 1 },
});
