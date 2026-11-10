import { StyleSheet, View } from 'react-native';
import { colors, sizes, spacing } from '@/theme';
import { AppIcon, type IconName } from './AppIcon';
import { AppText, type ColorToken } from './AppText';

export type BannerVariant = 'info' | 'success' | 'warning' | 'danger' | 'offline';

const VARIANTS: Record<BannerVariant, { background: ColorToken; ink: ColorToken; icon: IconName }> =
  {
    info: { background: 'primarySoft', ink: 'primaryInk', icon: 'info' },
    success: { background: 'secondary', ink: 'onPrimary', icon: 'success' },
    warning: { background: 'warningSoft', ink: 'warning', icon: 'warning' },
    danger: { background: 'dangerSoft', ink: 'danger', icon: 'danger' },
    offline: { background: 'ink', ink: 'onPrimary', icon: 'cloudOffline' },
  };

type BannerProps = {
  variant?: BannerVariant;
  /** Una sola línea. */
  message: string;
};

/** Aviso global de ancho completo con ícono y una línea de texto. */
export function Banner({ variant = 'info', message }: BannerProps) {
  const palette = VARIANTS[variant];
  const urgent = variant === 'danger' || variant === 'offline';
  return (
    <View
      accessible
      accessibilityRole={urgent ? 'alert' : undefined}
      accessibilityLiveRegion={urgent ? 'assertive' : 'polite'}
      style={[styles.bar, { backgroundColor: colors[palette.background] }]}
    >
      <AppIcon name={palette.icon} size="sm" color={palette.ink} />
      <AppText variant="caption" color={palette.ink} numberOfLines={1} style={styles.text}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: sizes.banner,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.gutter,
  },
  text: { flex: 1 },
});
