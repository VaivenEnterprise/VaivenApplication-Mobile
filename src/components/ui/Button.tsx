import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { colors, gradients, motion, radius, shadows, sizes, spacing } from '@/theme';
import { AppIcon, type IconName } from './AppIcon';
import { AppText, type ColorToken } from './AppText';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'link';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** Ícono al final del texto (p. ej. una flecha). */
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
};

const TEXT_COLOR: Record<ButtonVariant, ColorToken> = {
  primary: 'onPrimary',
  secondary: 'onPrimary',
  danger: 'onPrimary',
  outline: 'primaryInk',
  link: 'primaryInk',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  accessibilityLabel,
}: ButtonProps) {
  const inactive = disabled || loading;
  const textColor: ColorToken = disabled ? 'muted' : TEXT_COLOR[variant];
  const gradient =
    variant === 'primary'
      ? gradients.primaryButton
      : variant === 'secondary'
        ? gradients.secondaryButton
        : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'danger' && !disabled && styles.danger,
        variant === 'outline' && !disabled && styles.outline,
        disabled && styles.disabled,
        variant === 'primary' && !disabled && shadows.button,
        pressed && !inactive && { transform: [{ scale: motion.pressScale }] },
      ]}
    >
      {gradient !== null && !disabled ? (
        <LinearGradient
          colors={gradient.colors}
          start={gradient.start}
          end={gradient.end}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <AppText variant="button" color={textColor}>
        {label}
      </AppText>
      {/* Hueco fijo: el indicador reemplaza al ícono sin cambiar el ancho del botón. */}
      {icon === undefined && !loading ? null : (
        <View style={styles.slot}>
          {loading ? (
            <ActivityIndicator color={colors[textColor]} />
          ) : icon === undefined ? null : (
            <AppIcon name={icon} size="sm" color={textColor} />
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: sizes.control.height,
    minWidth: sizes.touch.minSize,
    borderRadius: radius.lg,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  danger: { backgroundColor: colors.danger },
  outline: { borderWidth: sizes.control.border, borderColor: colors.primary },
  disabled: { backgroundColor: colors.border },
  slot: { width: spacing.lg, alignItems: 'center', justifyContent: 'center' },
});
