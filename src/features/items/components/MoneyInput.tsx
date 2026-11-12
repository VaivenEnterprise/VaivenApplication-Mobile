import { useState } from 'react';
import { TextField, type TextFieldProps } from '@/components/TextField';
import type { IconName } from '@/components/ui/AppIcon';
import { fromCents, toCents } from '@/lib/format/money';

const MAX_WHOLE_DIGITS = 9;

type MoneyInputProps = Pick<TextFieldProps, 'label' | 'error' | 'hint' | 'disabled' | 'testID'> & {
  /** Importe en centavos enteros; `null` cuando el campo está vacío. */
  value: number | null;
  onChange: (cents: number | null) => void;
  onBlur?: () => void;
  placeholder?: string;
  icon?: IconName;
};

/** Deja solo dígitos y un punto con hasta 2 decimales; rechaza lo demás conservando lo anterior. */
function sanitize(text: string, previous: string): string {
  const clean = text.replace(/,/g, '').replace(/\s/g, '');
  if (clean === '') return '';
  if (!/^\d*\.?\d{0,2}$/.test(clean)) return previous;
  const whole = clean.split('.')[0] ?? '';
  return whole.length > MAX_WHOLE_DIGITS ? previous : clean;
}

/**
 * Campo de dinero (plan P-01): la persona escribe pesos y el formulario recibe centavos enteros.
 * Acepta hasta 2 decimales (lo demás no se escribe) y reformatea al salir del campo.
 */
export function MoneyInput({
  value,
  onChange,
  onBlur,
  placeholder,
  icon = 'cash',
  ...field
}: MoneyInputProps) {
  // Mientras se escribe se conserva el texto tal cual («12.» o «12.0»); si el valor cambia por
  // fuera (p. ej. «Usar sugerido»), el texto deja de coincidir y se muestra el valor nuevo.
  const [draft, setDraft] = useState<string | null>(null);
  const typing = draft !== null && toCents(draft) === value;
  const shown = typing ? draft : value === null ? '' : fromCents(value);

  return (
    <TextField
      {...field}
      value={shown}
      placeholder={placeholder}
      keyboardType="decimal-pad"
      autoComplete="off"
      autoCorrect={false}
      icon={icon}
      onChangeText={(text) => {
        const next = sanitize(text, shown);
        setDraft(next);
        onChange(next === '' ? null : toCents(next));
      }}
      onBlur={() => {
        setDraft(null);
        onBlur?.();
      }}
    />
  );
}
