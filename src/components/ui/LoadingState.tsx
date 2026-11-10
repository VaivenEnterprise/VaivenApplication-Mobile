import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { es } from '@/i18n/es-MX';
import { colors, radius, sizes, spacing } from '@/theme';
import { AppText } from './AppText';
import { Card } from './Card';

export type LoadingVariant = 'spinner' | 'card';

type LoadingStateProps = {
  /** Texto que anuncian los lectores de pantalla. */
  label?: string;
  /** `card` muestra bloques con la forma de una tarjeta (spec §9.1). */
  variant?: LoadingVariant;
};

function Block({
  width,
  height,
  circle = false,
}: {
  width: number | `${number}%`;
  height: number;
  circle?: boolean;
}) {
  return (
    <View
      style={[styles.block, { width, height, borderRadius: circle ? radius.pill : radius.sm }]}
    />
  );
}

export function LoadingState({
  label = es.common.loading,
  variant = 'spinner',
}: LoadingStateProps) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      style={styles.root}
    >
      {variant === 'card' ? (
        <Card style={styles.card}>
          <View style={styles.header}>
            <Block width={sizes.thumb} height={sizes.thumb} circle />
            <View style={styles.lines}>
              <Block width="70%" height={spacing.md} />
              <Block width="45%" height={spacing.smd} />
            </View>
          </View>
          <Block width="100%" height={spacing.smd} />
          <Block width="82%" height={spacing.smd} />
        </Card>
      ) : null}
      <View style={styles.indicator}>
        <ActivityIndicator color={colors.primary} />
        <AppText variant="label" color="muted">
          {label}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md, paddingVertical: spacing.sm },
  card: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.smd },
  lines: { flex: 1, gap: spacing.sm },
  block: { backgroundColor: colors.surfaceMuted },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.smd,
  },
});
