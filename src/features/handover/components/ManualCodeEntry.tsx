import { useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/TextField';
import { es } from '@/i18n/es-MX';

const t = es.handover.scan;

type ManualCodeEntryProps = {
  visible: boolean;
  onClose: () => void;
  /** Devuelve `true` si el código se aceptó (la hoja se cierra) o `false` si no es válido. */
  onSubmit: (code: string) => boolean | Promise<boolean>;
  busy?: boolean;
};

/** Hoja para escribir el código a mano cuando la cámara no está disponible (CA-07). */
export function ManualCodeEntry({
  visible,
  onClose,
  onSubmit,
  busy = false,
}: ManualCodeEntryProps) {
  const [code, setCode] = useState('');
  const [invalid, setInvalid] = useState(false);

  const submit = async () => {
    const accepted = await onSubmit(code);
    setInvalid(!accepted);
    if (accepted) setCode('');
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t.manualTitle}
      footer={
        <Button
          label={busy ? t.confirming : t.confirm}
          loading={busy}
          disabled={code.trim() === ''}
          onPress={() => void submit()}
        />
      }
    >
      <TextField
        label={t.manualLabel}
        hint={t.manualHint}
        error={invalid ? t.manualInvalid : undefined}
        value={code}
        onChangeText={(text) => {
          setCode(text);
          setInvalid(false);
        }}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={() => {
          if (code.trim() !== '') void submit();
        }}
      />
    </BottomSheet>
  );
}
