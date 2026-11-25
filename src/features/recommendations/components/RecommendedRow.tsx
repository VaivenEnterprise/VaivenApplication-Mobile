import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Skeleton } from '@/components/ui/Skeleton';
import { RecommendedCard } from '@/features/recommendations/components/RecommendedCard';
import { useRecommendations } from '@/features/recommendations/hooks';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { sizes, spacing } from '@/theme';

const SKELETON_CARDS = 3;
const t = es.recommendations;

/**
 * «Recomendado para ti» en Explorar (spec 015 §7.1, RF-01, RF-02, RF-05): título y fila horizontal
 * de tarjetas. Carga con tres *skeletons*; sin resultados, con la función apagada o ante un error
 * no se muestra nada, así Explorar nunca se bloquea por las recomendaciones.
 */
export function RecommendedRow() {
  const router = useRouter();
  const { status, items } = useRecommendations();
  if (status === 'hidden') return null;

  return (
    <View style={styles.section}>
      <AppText variant="subheading" accessibilityRole="header">
        {t.title}
      </AppText>
      {status === 'loading' ? (
        <View
          testID="recommended-loading"
          accessible
          accessibilityLabel={t.rowLoading}
          style={styles.row}
        >
          {Array.from({ length: SKELETON_CARDS }, (_, index) => (
            <Skeleton key={index} shape="card" width={sizes.homeTile} />
          ))}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {items.map((recommendation) => (
            <RecommendedCard
              key={recommendation.item.id}
              recommendation={recommendation}
              onPress={(id) => router.push(routes.item(id))}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.smd },
  row: { flexDirection: 'row', gap: spacing.smd },
});
