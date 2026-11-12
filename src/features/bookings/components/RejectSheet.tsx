import { StyleSheet, View } from 'react-native';
import { FormNotice } from '@/components/FormNotice';
import { AppText } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { actionErrorMessage } from '@/features/bookings/errors';
import { useRejectBooking } from '@/features/bookings/hooks';
import { es } from '@/i18n/es-MX';
import { spacing } from '@/theme';

const t = es.bookings.rejectSheet;

type RejectSheetProps = { bookingId: string; visible: boolean; onClose: () => void };

/** Rechazar una solicitud pendiente: confirmación con aviso, sin motivo obligatorio. */
export function RejectSheet({ bookingId, visible, onClose }: RejectSheetProps) {
  const reject = useRejectBooking(bookingId);
  const close = () => {
    reject.reset();
    onClose();
  };
  return (
    <BottomSheet
      visible={visible}
      onClose={close}
      title={t.title}
      footer={
        <Button
          label={t.confirm}
          variant="danger"
          loading={reject.isPending}
          onPress={() => reject.mutate(undefined, { onSuccess: close })}
        />
      }
    >
      <View style={styles.body}>
        <AppText color="muted">{t.body}</AppText>
        {reject.isError ? <FormNotice message={actionErrorMessage(reject.error)} /> : null}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({ body: { gap: spacing.md } });
