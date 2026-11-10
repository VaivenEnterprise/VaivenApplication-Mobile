import { StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Divider } from '@/components/ui/Divider';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { useMeta } from '@/features/diagnostics/hooks/useMeta';
import { es } from '@/i18n/es-MX';
import { formatDateTime } from '@/lib/format/date';
import { colors, radius, sizes, spacing } from '@/theme';

function Row({ label, value, ok = false }: { label: string; value: string; ok?: boolean }) {
  return (
    <View style={styles.row}>
      <AppText variant="label" color="muted">
        {label}
      </AppText>
      <View style={styles.value}>
        {ok ? <View style={styles.dot} /> : null}
        <AppText variant="bodyStrong" style={styles.valueText}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

export default function DiagnosticsScreen() {
  const { data, error, isPending, refetch } = useMeta();

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
      {data ? (
        <Card style={styles.card}>
          <Row label={es.diagnostics.name} value={data.name} ok />
          <Divider />
          <Row label={es.diagnostics.version} value={data.version} />
          <Divider />
          <Row label={es.diagnostics.environment} value={data.environment} />
          <Divider />
          <Row label={es.diagnostics.serverTime} value={formatDateTime(data.serverTime)} />
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
  dot: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
  },
  note: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
