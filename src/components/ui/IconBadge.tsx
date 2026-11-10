import { StyleSheet, View } from 'react-native';
import { colors, radius, sizes } from '@/theme';
import { AppIcon, type IconName } from './AppIcon';
import type { ColorToken } from './AppText';

export type IconBadgeTone = 'primary' | 'secondary' | 'danger' | 'warning';
export type IconBadgeSize = 'md' | 'lg';

const TONES: Record<IconBadgeTone, { background: ColorToken; icon: ColorToken }> = {
  primary: { background: 'primarySoft', icon: 'primaryInk' },
  secondary: { background: 'secondarySoft', icon: 'secondaryPressed' },
  danger: { background: 'dangerSoft', icon: 'danger' },
  warning: { background: 'warningSoft', icon: 'warning' },
};

const BADGE = { md: sizes.control.iconBadge, lg: sizes.thumbLg } as const;
const GLYPH = { md: 'md', lg: 'lg' } as const;

type IconBadgeProps = {
  icon: IconName;
  tone?: IconBadgeTone;
  size?: IconBadgeSize;
};

/** Ícono decorativo dentro de un círculo de color suave. */
export function IconBadge({ icon, tone = 'primary', size = 'md' }: IconBadgeProps) {
  const palette = TONES[tone];
  return (
    <View
      style={[
        styles.circle,
        { width: BADGE[size], height: BADGE[size], backgroundColor: colors[palette.background] },
      ]}
    >
      <AppIcon name={icon} size={GLYPH[size]} color={palette.icon} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
