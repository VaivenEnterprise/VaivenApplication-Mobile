import { useState, type ComponentRef, type ReactNode, type Ref } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { FormField } from '@/components/FormField';
import type { IconName } from '@/components/ui/AppIcon';
import { IconBadge } from '@/components/ui/IconBadge';
import { colors, fontFamily, radius, sizes, spacing, typography } from '@/theme';

/** Instancia nativa del campo; sirve para llevar el foco al primer error. */
export type TextFieldInstance = ComponentRef<typeof TextInput>;

export type TextFieldProps = Pick<
  TextInputProps,
  | 'value'
  | 'onChangeText'
  | 'onBlur'
  | 'placeholder'
  | 'keyboardType'
  | 'autoCapitalize'
  | 'autoComplete'
  | 'autoCorrect'
  | 'textContentType'
  | 'returnKeyType'
  | 'onSubmitEditing'
  | 'secureTextEntry'
  | 'maxLength'
> & {
  label: string;
  /** Ícono decorativo a la izquierda (dentro de un `IconBadge`). */
  icon?: IconName;
  error?: string | undefined;
  hint?: string | undefined;
  disabled?: boolean;
  /** Elemento al final (p. ej. el ojo de la contraseña). */
  trailing?: ReactNode;
  inputRef?: Ref<TextFieldInstance>;
  testID?: string;
};

/** Campo de texto con estados de reposo, foco, error y deshabilitado (spec 003 §7.5). */
export function TextField({
  label,
  icon,
  error,
  hint,
  disabled = false,
  trailing,
  inputRef,
  testID,
  onBlur,
  ...input
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const invalid = error !== undefined;

  return (
    <FormField label={label} error={error} hint={hint}>
      <View style={[styles.halo, focused && !invalid && styles.haloFocus]}>
        <View
          style={[
            styles.box,
            focused && styles.boxFocus,
            invalid && styles.boxError,
            disabled && styles.boxDisabled,
          ]}
        >
          {icon === undefined ? null : <IconBadge icon={icon} />}
          <TextInput
            ref={inputRef}
            testID={testID}
            accessibilityLabel={label}
            accessibilityState={{ disabled }}
            editable={!disabled}
            placeholderTextColor={colors.placeholder}
            style={[styles.input, disabled && styles.inputDisabled]}
            onFocus={() => setFocused(true)}
            onBlur={(event) => {
              setFocused(false);
              onBlur?.(event);
            }}
            {...input}
          />
          {trailing}
        </View>
      </View>
    </FormField>
  );
}

const styles = StyleSheet.create({
  // El halo reserva siempre su espacio para que el campo no salte al enfocarse.
  halo: {
    borderWidth: sizes.field.halo,
    borderColor: 'transparent',
    borderRadius: radius.lg + sizes.field.halo,
  },
  haloFocus: { borderColor: colors.primarySoft },
  box: {
    minHeight: sizes.control.height,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smd,
    paddingHorizontal: spacing.smd,
    borderRadius: radius.lg,
    borderWidth: sizes.field.border,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  boxFocus: { borderWidth: sizes.field.borderFocus, borderColor: colors.primary },
  boxError: { borderWidth: sizes.field.borderFocus, borderColor: colors.danger },
  boxDisabled: { backgroundColor: colors.surfaceMuted },
  input: {
    flex: 1,
    minHeight: sizes.touch.minSize,
    color: colors.ink,
    fontFamily: fontFamily.regular,
    fontSize: typography.body.fontSize,
  },
  inputDisabled: { color: colors.placeholder },
});
