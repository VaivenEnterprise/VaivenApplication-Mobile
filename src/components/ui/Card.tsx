import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, shadows, spacing } from '@/theme';

export type CardVariant = 'elevated' | 'muted';

type CardProps = {
  children: ReactNode;
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
};

/** Superficie con esquinas grandes. `muted` va sin sombra. */
export function Card({ children, variant = 'elevated', style }: CardProps) {
  return (
    <View style={[styles.base, variant === 'muted' ? styles.muted : styles.elevated, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.xl, padding: spacing.lg },
  elevated: { backgroundColor: colors.surface, ...shadows.card },
  muted: { backgroundColor: colors.surfaceMuted },
});
