import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { colors, spacing } from '@/theme';
import type { ColorToken } from './AppText';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/** Conjunto cerrado de íconos. Cambiar de librería solo toca este mapa (plan §4.5.1). */
const ICONS = {
  arrowForward: 'arrow-forward',
  compass: 'compass-outline',
  warning: 'warning-outline',
  cloudOffline: 'cloud-offline-outline',
  info: 'information-circle-outline',
  close: 'close',
  search: 'search',
  clearCircle: 'close-circle',
  chevronForward: 'chevron-forward',
  star: 'star',
  starOutline: 'star-outline',
  success: 'checkmark-circle-outline',
  danger: 'alert-circle-outline',
  options: 'options-outline',
} as const satisfies Record<string, IoniconName>;

export type IconName = keyof typeof ICONS;
export type IconSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZES = {
  sm: spacing.md,
  md: spacing.lg,
  lg: spacing.xl,
  xl: spacing.xxl,
} as const;

type AppIconProps = {
  name: IconName;
  size?: IconSize;
  color?: ColorToken;
  /** Si se omite, el ícono es decorativo y lo ignoran los lectores de pantalla. */
  accessibilityLabel?: string;
};

export function AppIcon({ name, size = 'md', color = 'ink', accessibilityLabel }: AppIconProps) {
  const decorative = accessibilityLabel === undefined;
  return (
    <Ionicons
      name={ICONS[name]}
      size={SIZES[size]}
      color={colors[color]}
      accessible={!decorative}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'yes'}
    />
  );
}
