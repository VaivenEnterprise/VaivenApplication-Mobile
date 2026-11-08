import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { borders, colors, radius, shadows, spacing } from '@/theme';

type Props = PropsWithChildren<{
  onPress?: () => void;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

export function Card({ children, onPress, padded = true, style }: Props) {
  const content = <View style={[styles.base, padded && styles.padded, style]}>{children}</View>;

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    ...shadows.card,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: borders.width,
  },
  padded: {
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.92,
  },
});
