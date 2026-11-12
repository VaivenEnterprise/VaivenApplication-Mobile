import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Divider } from '@/components/ui/Divider';
import { daysLabel } from '@/features/bookings/dates';
import type { PaymentMode } from '@/features/bookings/types';
import { es } from '@/i18n/es-MX';
import { formatMXN } from '@/lib/format/money';
import { spacing } from '@/theme';

type QuoteSummaryProps = {
  days: number;
  pricePerDayCents: number;
  totalCents: number;
  paymentMode: PaymentMode;
  payments: readonly { stage: 'delivery' | 'return'; amountCents: number }[];
};

function Line({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <View style={styles.line} accessible accessibilityLabel={`${label}: ${value}`}>
      <AppText variant={strong ? 'bodyStrong' : 'body'} color={strong ? 'ink' : 'muted'}>
        {label}
      </AppText>
      <AppText variant={strong ? 'subheading' : 'bodyStrong'}>{value}</AppText>
    </View>
  );
}

/**
 * Desglose de precio (spec 007 §7.3): días × tarifa, total y, si son dos pagos, cada uno. Un
 * préstamo (total 0) muestra «Gratis». Los importes vienen del servidor en centavos (Art. V).
 */
export function QuoteSummary({
  days,
  pricePerDayCents,
  totalCents,
  paymentMode,
  payments,
}: QuoteSummaryProps) {
  const free = totalCents === 0;
  return (
    <View style={styles.box}>
      {free ? null : (
        <Line
          label={`${daysLabel(days)} × ${formatMXN(pricePerDayCents)}`}
          value={formatMXN(totalCents)}
        />
      )}
      <Divider />
      <Line
        label={es.bookings.request.total}
        value={free ? es.bookings.free : formatMXN(totalCents)}
        strong
      />
      {free || paymentMode !== 'split_50_50'
        ? null
        : payments.map((payment) => (
            <Line
              key={payment.stage}
              label={es.bookings.stage[payment.stage]}
              value={formatMXN(payment.amountCents)}
            />
          ))}
      {free ? null : (
        <AppText variant="caption" color="muted">
          {es.bookings.request.payInPerson}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: spacing.sm },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
});
