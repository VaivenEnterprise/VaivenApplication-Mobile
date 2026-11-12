import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FormNotice } from '@/components/FormNotice';
import { TextField } from '@/components/TextField';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { actionErrorMessage } from '@/features/bookings/errors';
import { useAcceptBooking } from '@/features/bookings/hooks';
import { MEETING_POINT_MAX, MEETING_POINT_MIN } from '@/features/bookings/rules';
import { es } from '@/i18n/es-MX';
import { spacing } from '@/theme';

const t = es.bookings.acceptSheet;

type AcceptSheetProps = { bookingId: string; visible: boolean; onClose: () => void };

/** Aceptar una solicitud (CA-05, CA-06); el punto de encuentro es opcional. */
export function AcceptSheet({ bookingId, visible, onClose }: AcceptSheetProps) {
  const accept = useAcceptBooking(bookingId);
  const [place, setPlace] = useState('');
  const trimmed = place.trim();
  const invalid =
    trimmed !== '' && (trimmed.length < MEETING_POINT_MIN || trimmed.length > MEETING_POINT_MAX);

  const close = () => {
    accept.reset();
    onClose();
  };
  const confirm = () => accept.mutate(trimmed === '' ? undefined : trimmed, { onSuccess: close });

  return (
    <BottomSheet
      visible={visible}
      onClose={close}
      title={t.title}
      footer={
        <Button label={t.confirm} onPress={confirm} disabled={invalid} loading={accept.isPending} />
      }
    >
      <View style={styles.body}>
        <TextField
          label={t.where}
          placeholder={t.placeholder}
          hint={t.hint}
          value={place}
          onChangeText={setPlace}
          maxLength={MEETING_POINT_MAX}
          error={invalid ? es.bookings.meetingSheet.tooShort : undefined}
        />
        {accept.isError ? <FormNotice message={actionErrorMessage(accept.error)} /> : null}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({ body: { gap: spacing.md } });
