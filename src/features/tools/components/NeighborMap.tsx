import { StyleSheet, View, type ViewStyle } from 'react-native';
import { AppText } from '@/components/ui';
import { esMX as t } from '@/i18n/es-MX';
import { borders, colors, radius, sizes, spacing } from '@/theme';

export type Neighbor = {
  id: string;
  number: number;
  name: string;
  distanceBlocks: number;
};

type Props = {
  neighbors: readonly Neighbor[];
};

const pinPositions: readonly ViewStyle[] = [
  { left: '14%', top: '16%' },
  { right: '12%', top: '38%' },
  { bottom: '14%', left: '40%' },
];

export function NeighborMap({ neighbors }: Props) {
  return (
    <View accessibilityLabel={t.tools.mapLabel} style={styles.map}>
      <View style={styles.roadHorizontal} />
      <View style={styles.roadVertical} />
      {neighbors.length === 0 ? (
        <AppText align="center" color="muted">
          {t.tools.noNeighbors}
        </AppText>
      ) : (
        neighbors.map((neighbor, index) => (
          <View key={neighbor.id} style={[styles.pin, pinPositions[index] ?? pinPositions[0]]}>
            <View style={styles.pinCircle}>
              <AppText variant="label" color="onPrimary">
                {neighbor.number}
              </AppText>
            </View>
            <View style={styles.pinLabel}>
              <AppText variant="caption">{neighbor.name}</AppText>
              <AppText variant="caption" color="muted">
                {t.tools.distance(neighbor.distanceBlocks)}
              </AppText>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: borders.width,
    height: sizes.mapHeight,
    justifyContent: 'center',
    overflow: 'hidden',
    padding: spacing.md,
  },
  pin: {
    alignItems: 'center',
    gap: spacing.xs,
    position: 'absolute',
  },
  pinCircle: {
    alignItems: 'center',
    backgroundColor: colors.terracotta,
    borderColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: borders.width,
    height: sizes.pin,
    justifyContent: 'center',
    width: sizes.pin,
  },
  pinLabel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: borders.width,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  roadHorizontal: {
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderTopWidth: borders.width,
    left: 0,
    position: 'absolute',
    right: 0,
    top: '48%',
  },
  roadVertical: {
    borderColor: colors.border,
    borderLeftWidth: borders.width,
    borderStyle: 'dashed',
    bottom: 0,
    left: '50%',
    position: 'absolute',
    top: 0,
  },
});
