import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FormNotice } from '@/components/FormNotice';
import { TextField } from '@/components/TextField';
import { AppText } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { actionErrorMessage } from '@/features/bookings/errors';
import { useCancelBooking } from '@/features/bookings/hooks';
import { CANCEL_REASON_MAX, CANCEL_REASON_MIN, cancelNeedsReason } from '@/features/bookings/rules';
import type { BookingStatus } from '@/features/bookings/types';
import { ChoiceChip } from '@/features/items';
import { es } from '@/i18n/es-MX';
import { spacing } from '@/theme';

const t = es.bookings.cancelSheet;
const OTHER = 'other';

type CancelSheetProps = {
  bookingId: string;
  status: BookingStatus;
  visible: boolean;
  onClose: () => void;
};

/**
 * Cancelar (CA-07): una reserva aceptada exige motivo (3 a 200 caracteres), una solicitud
 * pendiente no. Siempre hay confirmación explícita y se explica la consecuencia (POL-09).
 */
export function CancelSheet({ bookingId, status, visible, onClose }: CancelSheetProps) {
  const cancel = useCancelBooking(bookingId);
  const [choice, setChoice] = useState<string | null>(null);
  const [other, setOther] = useState('');

  const reason = choice === OTHER ? other.trim() : (choice ?? '');
  const required = cancelNeedsReason(status);
  const reasonValid =
    reason === ''
      ? !required
      : reason.length >= CANCEL_REASON_MIN && reason.length <= CANCEL_REASON_MAX;

  const close = () => {
    cancel.reset();
    onClose();
  };
  const confirm = () => cancel.mutate(reason === '' ? undefined : reason, { onSuccess: close });

  return (
    <BottomSheet
      visible={visible}
      onClose={close}
      title={t.title}
      footer={
        <View style={styles.footer}>
          <Button
            label={t.confirm}
            variant="danger"
            disabled={!reasonValid}
            loading={cancel.isPending}
            onPress={confirm}
          />
          <Button label={t.back} variant="outline" onPress={close} />
        </View>
      }
    >
      <View style={styles.body}>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={t.reasonLabel}
          style={styles.chips}
        >
          {[...t.reasons, t.other].map((label, index) => {
            const value = index < t.reasons.length ? label : OTHER;
            return (
              <ChoiceChip
                key={value}
                label={label}
                selected={choice === value}
                onPress={() => setChoice(value)}
              />
            );
          })}
        </View>
        {choice === OTHER ? (
          <TextField
            label={t.otherLabel}
            placeholder={t.otherPlaceholder}
            value={other}
            onChangeText={setOther}
            maxLength={CANCEL_REASON_MAX}
            multiline
          />
        ) : null}
        <AppText variant="caption" color="muted">
          {t.consequence}
        </AppText>
        {cancel.isError ? <FormNotice message={actionErrorMessage(cancel.error)} /> : null}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  footer: { gap: spacing.sm },
});
