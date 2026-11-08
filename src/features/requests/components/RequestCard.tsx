import { StyleSheet, View } from 'react-native';
import { AppText, Badge, Button, Card } from '@/components/ui';
import { esMX as t } from '@/i18n/es-MX';
import type { RequestStatus, ToolRequest } from '@/lib/domain/models';
import { spacing } from '@/theme';

type Props = {
  request: ToolRequest;
  onAccept: () => void;
  onReject: () => void;
};

const statusTone: Record<RequestStatus, 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'danger',
};

export function RequestCard({ request, onAccept, onReject }: Props) {
  const when =
    request.day === 'today'
      ? t.requests.todayAt(request.time)
      : t.requests.yesterdayAt(request.time);

  return (
    <Card>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.info}>
            <AppText variant="bodyBold">{request.requesterName}</AppText>
            <AppText color="muted">{t.requests.wantsTool(request.toolName)}</AppText>
            <AppText variant="caption" color="muted">
              {when}
            </AppText>
          </View>
          <Badge label={t.requests.status[request.status]} tone={statusTone[request.status]} />
        </View>
        {request.status === 'pending' ? (
          <View style={styles.actions}>
            <Button label={t.requests.reject} variant="secondary" onPress={onReject} />
            <Button label={t.requests.accept} onPress={onAccept} />
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  content: {
    gap: spacing.md,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
});
