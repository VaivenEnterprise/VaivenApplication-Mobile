import { StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Divider } from '@/components/ui/Divider';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { useDiagnostics } from '@/features/diagnostics/hooks/useDiagnostics';
import { es } from '@/i18n/es-MX';
import { getConfig } from '@/lib/config';
import { formatDateTime } from '@/lib/format/date';
import { colors, radius, sizes, spacing } from '@/theme';

type Status = 'ok' | 'error';

function Row({ label, value, status }: { label: string; value: string; status?: Status }) {
  return (
    <View style={styles.row}>
      <AppText variant="label" color="muted">
        {label}
      </AppText>
      <View style={styles.value}>
        {status === undefined ? null : (
          <View style={[styles.dot, status === 'ok' ? styles.ok : styles.error]} />
        )}
        <AppText variant="bodyStrong" style={styles.valueText} selectable>
          {value}
        </AppText>
      </View>
    </View>
  );
}

export default function DiagnosticsScreen() {
  const { meta, health, readiness, error, isPending, refetch } = useDiagnostics();
  const { apiBaseUrl } = getConfig();

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title" accessibilityRole="header">
          {es.diagnostics.title}
        </AppText>
        <Chip label={es.diagnostics.badge} variant="warning" />
      </View>

      {isPending ? <LoadingState variant="card" /> : null}
      {error ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}
      {meta && health && readiness ? (
        <Card style={styles.card}>
          <Row label={es.diagnostics.url} value={apiBaseUrl} />
          <Divider />
          <Row label={es.diagnostics.name} value={meta.name} status="ok" />
          <Divider />
          <Row label={es.diagnostics.version} value={meta.version} />
          <Divider />
          <Row label={es.diagnostics.environment} value={meta.environment} />
          <Divider />
          <Row label={es.diagnostics.serverTime} value={formatDateTime(meta.serverTime)} />
          <Divider />
          <Row label={es.diagnostics.health} value={es.diagnostics.responding} status="ok" />
          <Divider />
          <Row
            label={es.diagnostics.readiness}
            value={readiness.ready ? es.diagnostics.ready : es.diagnostics.notReady}
            status={readiness.ready ? 'ok' : 'error'}
          />
          {readiness.redis === null ? null : (
            <>
              <Divider />
              <Row label={es.diagnostics.redis} value={readiness.redis} />
            </>
          )}
        </Card>
      ) : null}

      <View style={styles.note}>
        <AppIcon name="info" size="sm" color="muted" />
        <AppText variant="caption" color="muted">
          {es.diagnostics.devOnly}
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: { paddingVertical: spacing.sm },
  row: {
    minHeight: sizes.control.height,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  value: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  valueText: { textAlign: 'right', flexShrink: 1 },
  dot: { width: spacing.sm, height: spacing.sm, borderRadius: radius.pill },
  ok: { backgroundColor: colors.success },
  error: { backgroundColor: colors.danger },
  note: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
