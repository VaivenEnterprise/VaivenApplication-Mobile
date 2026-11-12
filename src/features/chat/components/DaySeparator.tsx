import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { dayLabel } from '@/features/chat/format';
import { colors, radius, spacing } from '@/theme';

type DaySeparatorProps = { iso: string; now?: Date };

/** Separador de día: píldora centrada «Hoy», «Ayer» o «12 nov» (spec 008 §7.2). */
export function DaySeparator({ iso, now }: DaySeparatorProps) {
  const label = dayLabel(iso, now);
  return (
    <View style={styles.row}>
      <View accessible accessibilityRole="header" style={styles.pill}>
        <AppText variant="caption" color="muted">
          {label}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', paddingVertical: spacing.sm },
  pill: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.smd,
    paddingVertical: spacing.xs,
  },
});
