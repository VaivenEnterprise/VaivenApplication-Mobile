import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { RatingCard } from '@/features/ratings/components/RatingCard';
import { useUserRatings } from '@/features/ratings/hooks';
import { es } from '@/i18n/es-MX';
import { spacing } from '@/theme';

const t = es.ratings.reputation;

/** Lista paginada de comentarios recibidos (RF-03). «Ver más» pide la página siguiente. */
export function RatingsList({ userId }: { userId: string }) {
  const query = useUserRatings(userId);

  if (query.isPending) {
    return (
      <View accessible accessibilityLabel={es.common.loading} style={styles.root}>
        <Skeleton width="100%" />
        <Skeleton width="80%" />
      </View>
    );
  }

  if (query.isError) {
    return (
      <View style={styles.root}>
        <AppText color="muted">{t.loadFailed}</AppText>
        <Button label={es.common.retry} variant="outline" onPress={() => void query.refetch()} />
      </View>
    );
  }

  const ratings = query.data.pages.flatMap((page) => page.items);
  if (ratings.length === 0) return null;

  return (
    <View style={styles.root}>
      <AppText variant="subheading" accessibilityRole="header">
        {t.listTitle}
      </AppText>
      {ratings.map((rating) => (
        <RatingCard key={rating.id} rating={rating} />
      ))}
      {query.hasNextPage ? (
        <Button
          label={t.more}
          variant="outline"
          loading={query.isFetchingNextPage}
          onPress={() => void query.fetchNextPage()}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({ root: { gap: spacing.smd } });
