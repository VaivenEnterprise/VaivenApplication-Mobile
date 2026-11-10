import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { TextField, type TextFieldProps } from '@/components/TextField';
import { AppIcon } from '@/components/ui/AppIcon';
import { es } from '@/i18n/es-MX';
import { sizes } from '@/theme';

type PasswordFieldProps = Omit<TextFieldProps, 'secureTextEntry' | 'trailing' | 'keyboardType'>;

/** Campo de contraseña con ojo para mostrarla u ocultarla (etiqueta accesible incluida). */
export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const label = visible ? es.auth.hidePassword : es.auth.showPassword;

  return (
    <TextField
      icon="lock"
      autoCapitalize="none"
      autoCorrect={false}
      {...props}
      secureTextEntry={!visible}
      trailing={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ checked: visible }}
          disabled={props.disabled}
          hitSlop={4}
          onPress={() => setVisible((value) => !value)}
          style={styles.eye}
        >
          <AppIcon name={visible ? 'eyeOff' : 'eye'} color="muted" />
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
  eye: {
    width: sizes.touch.minSize,
    height: sizes.touch.minSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
