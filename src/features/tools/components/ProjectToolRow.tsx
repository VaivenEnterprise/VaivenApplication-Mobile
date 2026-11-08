import { StyleSheet, View } from 'react-native';
import { AppText, Badge, Button, Card, ToolIcon } from '@/components/ui';
import { esMX as t } from '@/i18n/es-MX';
import type { Tool } from '@/lib/domain/models';
import { spacing } from '@/theme';

type Props = {
  name: string;
  tool?: Tool;
  requested: boolean;
  onRequest: () => void;
};

export function ProjectToolRow({ name, tool, requested, onRequest }: Props) {
  const isLent = tool?.status === 'lent';
  const displayName = tool?.name ?? name;

  return (
    <Card>
      <View style={styles.row}>
        <ToolIcon category={tool?.category} name={displayName} />
        <View style={styles.info}>
          <AppText variant="bodyBold">{displayName}</AppText>
          {tool ? (
            <>
              <AppText variant="caption" color="muted">
                {t.tools.owner(tool.ownerName)}
              </AppText>
              <AppText variant="caption" color="muted">
                {t.tools.distance(tool.distanceBlocks)}
              </AppText>
            </>
          ) : null}
        </View>
        <View style={styles.action}>
          {isLent ? (
            <Badge label={t.tools.status.lent} tone="warning" />
          ) : requested ? (
            <Badge label={t.tools.requested} tone="success" />
          ) : (
            <Button label={t.tools.request} variant="terracotta" onPress={onRequest} />
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  action: {
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
});
