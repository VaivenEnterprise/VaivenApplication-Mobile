import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors, radius, spacing } from '@/theme';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'primary';

type Props = {
  label: string;
  tone?: Tone;
};

const toneStyles: Record<
  Tone,
  {
    backgroundColor: string;
    color: 'muted' | 'primary' | 'danger' | 'success' | 'warning';
  }
> = {
  neutral: { backgroundColor: colors.background, color: 'muted' },
  success: { backgroundColor: colors.successSoft, color: 'success' },
  warning: { backgroundColor: colors.warningSoft, color: 'warning' },
  danger: { backgroundColor: colors.dangerSoft, color: 'danger' },
  primary: { backgroundColor: colors.primarySoft, color: 'primary' },
};

export function Badge({ label, tone = 'neutral' }: Props) {
  const toneStyle = toneStyles[tone] ?? toneStyles.neutral;

  return (
    <View style={[styles.base, { backgroundColor: toneStyle.backgroundColor }]}>
      <AppText variant="caption" color={toneStyle.color}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
