import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, gradients } from '@/theme';

export type BackgroundVariant = 'auth' | 'plain';

type GradientBackgroundProps = {
  variant?: BackgroundVariant;
  children?: ReactNode;
};

/** Fondo de pantalla: `auth` usa el degradado de bienvenida; `plain`, el color liso. */
export function GradientBackground({ variant = 'plain', children }: GradientBackgroundProps) {
  if (variant === 'auth') {
    const { colors: stops, start, end } = gradients.authBackground;
    return (
      <LinearGradient colors={stops} start={start} end={end} style={styles.fill}>
        {children}
      </LinearGradient>
    );
  }
  return <View style={[styles.fill, styles.plain]}>{children}</View>;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  plain: { backgroundColor: colors.background },
});
