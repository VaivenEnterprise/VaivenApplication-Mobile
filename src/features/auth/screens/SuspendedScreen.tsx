import { StyleSheet } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { IconBadge } from '@/components/ui/IconBadge';
import { Screen } from '@/components/ui/Screen';
import { es } from '@/i18n/es-MX';
import { formatDate } from '@/lib/format/date';
import { spacing } from '@/theme';

type SuspendedScreenProps = {
  /** Fecha de fin (ISO), si el servidor la informa. */
  until: string | null;
  onDismiss: () => void;
};

const t = es.auth.suspended;

/** Cuenta suspendida (spec 003 §7.12, RF-10). */
export function SuspendedScreen({ until, onDismiss }: SuspendedScreenProps) {
  const date = until === null ? '' : formatDate(until);
  return (
    <Screen background="auth" scroll={false} contentStyle={styles.center}>
      <IconBadge icon="lock" tone="danger" size="lg" />
      <AppText variant="title" accessibilityRole="header" style={styles.centered}>
        {t.title}
      </AppText>
      <AppText color="muted" style={styles.centered}>
        {t.description}
      </AppText>
      {date === '' ? null : (
        <AppText variant="bodyStrong" style={styles.centered}>
          {`${t.untilPrefix} ${date}`}
        </AppText>
      )}
      <Button label={t.action} variant="outline" onPress={onDismiss} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'stretch', justifyContent: 'center', gap: spacing.md },
  centered: { textAlign: 'center' },
});
