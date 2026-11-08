import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { AppText } from './AppText';
import { borders, colors, radius, spacing, touch } from '@/theme';

type Variant = 'primary' | 'terracotta' | 'secondary' | 'secondaryGreen' | 'ghost' | 'danger';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: Variant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

const background: Record<Variant, string> = {
  primary: colors.primary,
  terracotta: colors.terracotta,
  secondary: colors.surface,
  secondaryGreen: colors.primarySoft,
  ghost: 'transparent',
  danger: colors.dangerSoft,
};

const border: Record<Variant, string> = {
  primary: colors.primary,
  terracotta: colors.terracotta,
  secondary: colors.border,
  secondaryGreen: colors.primary,
  ghost: 'transparent',
  danger: colors.dangerSoft,
};

const labelColor: Record<Variant, 'onPrimary' | 'ink' | 'primary' | 'danger'> = {
  primary: 'onPrimary',
  terracotta: 'onPrimary',
  secondary: 'ink',
  secondaryGreen: 'primary',
  ghost: 'primary',
  danger: 'danger',
};

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...rest
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: background[variant], borderColor: border[variant] },
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary' || variant === 'terracotta' ? colors.onPrimary : colors.primary
          }
        />
      ) : (
        <AppText variant="bodyBold" color={labelColor[variant]}>
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: borders.width,
    justifyContent: 'center',
    minHeight: touch.minSize,
    paddingHorizontal: spacing.lg,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});
