import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';

const PERCENT = 100;

type ProgressBarProps = {
  /** Avance de 0 a 1; fuera de rango se ajusta. */
  value: number;
  accessibilityLabel?: string;
};

/** Barra de avance con valor accesible en porcentaje. */
export function ProgressBar({ value, accessibilityLabel }: ProgressBarProps) {
  const clamped = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  const now = Math.round(clamped * PERCENT);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: PERCENT, now }}
      style={styles.track}
    >
      <View style={[styles.fill, { width: `${now}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.secondary },
});
