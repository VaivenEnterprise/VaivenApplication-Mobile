import { StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { es } from '@/i18n/es-MX';
import { spacing } from '@/theme';

type MeetingPointCardProps = {
  description: string | null;
  /** Solo el propietario lo pasa: ofrece «Proponer» o «Cambiar». */
  onEdit?: () => void;
};

/** Punto de encuentro de la reserva; lo ven solo las dos partes (spec 007 §7.5). */
export function MeetingPointCard({ description, onEdit }: MeetingPointCardProps) {
  const t = es.bookings.detail;
  return (
    <Card variant="muted" style={styles.card}>
      <View style={styles.head}>
        <AppIcon name="pin" color="primaryInk" />
        <AppText variant="label" color="muted">
          {t.meetingPoint}
        </AppText>
      </View>
      <AppText variant="bodyStrong">{description ?? t.meetingPointNone}</AppText>
      {onEdit === undefined ? null : (
        <Button
          label={description === null ? t.propose : t.change}
          variant="secondary"
          onPress={onEdit}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
