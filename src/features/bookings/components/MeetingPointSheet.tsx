import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FormNotice } from '@/components/FormNotice';
import { TextField } from '@/components/TextField';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { actionErrorMessage } from '@/features/bookings/errors';
import { useSetMeetingPoint } from '@/features/bookings/hooks';
import { MEETING_POINT_MAX, MEETING_POINT_MIN } from '@/features/bookings/rules';
import { es } from '@/i18n/es-MX';
import { spacing } from '@/theme';

const t = es.bookings.meetingSheet;

type MeetingPointSheetProps = {
  bookingId: string;
  initial: string | null;
  visible: boolean;
  onClose: () => void;
};

/** Proponer o cambiar el punto de encuentro (propietario; RF-09). De 3 a 200 caracteres. */
export function MeetingPointSheet({
  bookingId,
  initial,
  visible,
  onClose,
}: MeetingPointSheetProps) {
  const save = useSetMeetingPoint(bookingId);
  const [text, setText] = useState(initial ?? '');
  const trimmed = text.trim();
  const valid = trimmed.length >= MEETING_POINT_MIN && trimmed.length <= MEETING_POINT_MAX;

  const close = () => {
    save.reset();
    onClose();
  };
  return (
    <BottomSheet
      visible={visible}
      onClose={close}
      title={t.title}
      footer={
        <Button
          label={t.save}
          disabled={!valid}
          loading={save.isPending}
          onPress={() => save.mutate(trimmed, { onSuccess: close })}
        />
      }
    >
      <View style={styles.body}>
        <TextField
          label={t.label}
          placeholder={t.placeholder}
          hint={t.hint}
          value={text}
          onChangeText={setText}
          maxLength={MEETING_POINT_MAX}
          error={text !== '' && !valid ? t.tooShort : undefined}
        />
        {save.isError ? <FormNotice message={actionErrorMessage(save.error)} /> : null}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({ body: { gap: spacing.md } });
