import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FormNotice } from '@/components/FormNotice';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip, type ChipVariant } from '@/components/ui/Chip';
import type { Booking, BookingPayment, PaymentStatus } from '@/features/bookings';
import { useConfirmPayment, useReportPayment } from '@/features/handover/hooks';
import { HANDOVER_STATUSES } from '@/features/handover/components/StageSection';
import type { StageName } from '@/features/handover/types';
import { es } from '@/i18n/es-MX';
import { formatMXN } from '@/lib/format/money';
import { spacing } from '@/theme';

const t = es.handover.payments;

const PILL: Record<PaymentStatus, { label: string; variant: ChipVariant }> = {
  pending: { label: t.pending, variant: 'warning' },
  reported: { label: t.reported, variant: 'neutral' },
  confirmed: { label: t.confirmed, variant: 'success' },
};

type PaymentAction = 'report' | 'confirm' | null;

/**
 * Quién puede mover el pago (RF-07, estados `pending → reported → confirmed`): el solicitante
 * reporta lo pendiente y el propietario confirma lo reportado. El servidor sigue decidiendo.
 */
export function paymentAction(role: Booking['viewerRole'], status: PaymentStatus): PaymentAction {
  if (role === 'requester' && status === 'pending') return 'report';
  if (role === 'owner' && status === 'reported') return 'confirm';
  return null;
}

type RowProps = {
  payment: BookingPayment;
  role: Booking['viewerRole'];
  busy: boolean;
  onAction: (stage: StageName, action: Exclude<PaymentAction, null>) => void;
};

function PaymentRow({ payment, role, busy, onAction }: RowProps) {
  const status = payment.status ?? 'pending';
  const action = paymentAction(role, status);
  const pill = PILL[status];
  const label = `${t[payment.stage]} ${formatMXN(payment.amountCents)}`;
  return (
    <View accessible={false} style={styles.row}>
      <AppIcon name="cash" color="primaryInk" />
      <View style={styles.rowBody}>
        <AppText variant="bodyStrong" accessibilityLabel={`${t.rowA11y}: ${label}`}>
          {label}
        </AppText>
        <Chip label={pill.label} variant={pill.variant} />
      </View>
      {action === null ? null : (
        <Button
          label={action === 'report' ? t.report : t.confirm}
          variant="outline"
          loading={busy}
          onPress={() => onAction(payment.stage, action)}
        />
      )}
    </View>
  );
}

/**
 * Pagos por etapa (spec 009 §7.1, RF-07, CA-06): monto y estado de cada uno, la acción que le toca
 * a esta persona y la aclaración de que Vaivén no procesa pagos.
 */
export function PaymentsSection({ booking }: { booking: Booking }) {
  const report = useReportPayment(booking.id);
  const confirm = useConfirmPayment(booking.id);
  const [pending, setPending] = useState<StageName | null>(null);
  const [failed, setFailed] = useState(false);

  if (!HANDOVER_STATUSES.includes(booking.status) || booking.payments.length === 0) return null;

  const act = async (stage: StageName, action: Exclude<PaymentAction, null>) => {
    setPending(stage);
    setFailed(false);
    try {
      await (action === 'report' ? report : confirm).mutateAsync(stage);
    } catch {
      setFailed(true);
    } finally {
      setPending(null);
    }
  };

  return (
    <Card style={styles.card}>
      <AppText variant="heading" accessibilityRole="header">
        {t.title}
      </AppText>
      {booking.payments.map((payment) => (
        <PaymentRow
          key={payment.stage}
          payment={payment}
          role={booking.viewerRole}
          busy={pending === payment.stage}
          onAction={(stage, action) => void act(stage, action)}
        />
      ))}
      {failed ? <FormNotice message={t.failed} /> : null}
      <AppText variant="caption" color="muted">
        {t.notice}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowBody: { flex: 1, gap: spacing.xs },
});
