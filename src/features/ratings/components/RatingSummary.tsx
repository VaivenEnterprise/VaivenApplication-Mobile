import { StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { es } from '@/i18n/es-MX';
import { spacing } from '@/theme';

const t = es.ratings.summary;

type RatingSummaryProps = {
  /** Promedio de 1 a 5; `null` si aún no hay calificaciones. */
  average: number | null;
  count: number;
};

/** Texto del promedio con un decimal («4.9»). */
export const formatAverage = (average: number): string => average.toFixed(1);

/**
 * Resumen compacto «★ 4.9 · 18» para tarjetas, listas y encabezados (P-03, P-05). Sin
 * calificaciones dice «Sin calificaciones», nunca «0».
 */
export function RatingSummary({ average, count }: RatingSummaryProps) {
  if (average === null || count <= 0) {
    return (
      <AppText variant="caption" color="muted">
        {t.none}
      </AppText>
    );
  }
  const label = `${t.a11y} ${formatAverage(average)} ${t.outOf}, ${count} ${count === 1 ? t.countOne : t.count}`;
  return (
    <View accessible accessibilityLabel={label} style={styles.row}>
      <AppIcon name="star" size="sm" color="warning" />
      <AppText variant="caption" color="muted">
        {`${formatAverage(average)} · ${count}`}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
