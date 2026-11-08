import { StyleSheet, View } from 'react-native';
import { AppText, Badge, Card, ToolIcon } from '@/components/ui';
import { esMX as t } from '@/i18n/es-MX';
import type { Tool } from '@/lib/domain/models';
import { spacing } from '@/theme';

type Props = {
  tool: Tool;
  onPress?: () => void;
};

export function ToolCard({ tool, onPress }: Props) {
  const isAvailable = tool.status === 'available';
  const statusLabel = isAvailable ? t.tools.status.available : t.tools.status.lent;

  return (
    <Card onPress={onPress}>
      <View style={styles.content}>
        <ToolIcon category={tool.category} name={tool.name} />
        <View style={styles.info}>
          <AppText variant="bodyBold">{tool.name}</AppText>
          <AppText variant="caption" color="muted">
            {t.tools.owner(tool.ownerName)}
          </AppText>
          <AppText variant="caption" color="muted">
            {t.tools.distance(tool.distanceBlocks)}
          </AppText>
        </View>
        <View style={styles.status}>
          <Badge label={statusLabel} tone={isAvailable ? 'success' : 'warning'} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  status: {
    justifyContent: 'center',
  },
});
