import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { AppIcon, type IconName } from './AppIcon';
import { AppText, type ColorToken } from './AppText';

export type ChipVariant = 'neutral' | 'success' | 'warning';

const VARIANTS: Record<ChipVariant, { background: ColorToken; ink: ColorToken }> = {
  neutral: { background: 'primarySoft', ink: 'primaryInk' },
  success: { background: 'secondarySoft', ink: 'secondaryPressed' },
  warning: { background: 'warningSoft', ink: 'warning' },
};

type ChipProps = {
  label: string;
  variant?: ChipVariant;
  icon?: IconName;
};

/** Píldora con texto corto y, si se quiere, un ícono. */
export function Chip({ label, variant = 'neutral', icon }: ChipProps) {
  const palette = VARIANTS[variant];
  return (
    <View style={[styles.pill, { backgroundColor: colors[palette.background] }]}>
      {icon === undefined ? null : <AppIcon name={icon} size="sm" color={palette.ink} />}
      <AppText variant="eyebrow" color={palette.ink}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.smd,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
});
