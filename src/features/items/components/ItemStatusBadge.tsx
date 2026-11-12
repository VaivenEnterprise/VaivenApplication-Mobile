import { StyleSheet, View } from 'react-native';
import { AppText, type ColorToken } from '@/components/ui/AppText';
import type { ItemStatus } from '@/features/items/types';
import { es } from '@/i18n/es-MX';
import { colors, radius, spacing } from '@/theme';

const PALETTE: Record<ItemStatus, { background: ColorToken; ink: ColorToken }> = {
  active: { background: 'secondarySoft', ink: 'secondaryPressed' },
  paused: { background: 'warningSoft', ink: 'warning' },
  blocked: { background: 'dangerSoft', ink: 'danger' },
  removed: { background: 'surfaceMuted', ink: 'muted' },
};

type ItemStatusBadgeProps = { status: ItemStatus };

/** Píldora del estado de un objeto (spec 005 §7.1): el texto, no solo el color, dice el estado. */
export function ItemStatusBadge({ status }: ItemStatusBadgeProps) {
  const palette = PALETTE[status];
  return (
    <View style={[styles.pill, { backgroundColor: colors[palette.background] }]}>
      <AppText variant="eyebrow" color={palette.ink}>
        {es.items.status[status]}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.smd,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
});
