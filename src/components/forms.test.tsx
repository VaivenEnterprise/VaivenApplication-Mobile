import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';
import { Checkbox } from '@/components/Checkbox';
import { EmptyState } from '@/components/EmptyState';
import { FormField } from '@/components/FormField';
import { PasswordField } from '@/components/PasswordField';
import { SlotPlaceholder } from '@/components/SlotPlaceholder';
import { TextField } from '@/components/TextField';
import { es } from '@/i18n/es-MX';
import { colors, sizes } from '@/theme';

function borderOf(testID: string) {
  // El primer ancestro con borde es la caja del campo.
  let node = screen.getByTestId(testID).parent;
  while (node !== null) {
    const style = StyleSheet.flatten(node.props.style as never) as
      { borderColor?: string; borderWidth?: number } | undefined;
    if (style?.borderColor !== undefined && style.borderColor !== 'transparent') return style;
    node = node.parent;
  }
  throw new Error('sin borde');
}

describe('FormField', () => {
  it('muestra etiqueta, pista y, si hay error, solo el error', async () => {
    const { rerender } = await render(
      <FormField label="Nombre" hint="Pista">
        <Text>control</Text>
      </FormField>,
    );
    expect(screen.getByText('Nombre')).toBeTruthy();
    expect(screen.getByText('Pista')).toBeTruthy();

    await rerender(
      <FormField label="Nombre" hint="Pista" error="Falta el nombre">
        <Text>control</Text>
      </FormField>,
    );
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Falta el nombre')).toBeTruthy();
    expect(screen.queryByText('Pista')).toBeNull();
  });
});

describe('TextField', () => {
  it('tiene la etiqueta accesible y propaga el texto escrito', async () => {
    const onChangeText = jest.fn();
    await render(<TextField label="Correo" value="" onChangeText={onChangeText} testID="email" />);
    await fireEvent.changeText(screen.getByLabelText('Correo'), 'ana@example.com');
    expect(onChangeText).toHaveBeenCalledWith('ana@example.com');
  });

  it('reposo: borde fino; foco: borde primario más grueso; error: borde de error', async () => {
    const { rerender } = await render(<TextField label="Correo" value="" testID="email" />);
    expect(borderOf('email')).toMatchObject({
      borderColor: colors.fieldBorder,
      borderWidth: sizes.field.border,
    });

    await fireEvent(screen.getByTestId('email'), 'focus');
    expect(borderOf('email')).toMatchObject({
      borderColor: colors.primary,
      borderWidth: sizes.field.borderFocus,
    });

    await fireEvent(screen.getByTestId('email'), 'blur');
    await rerender(<TextField label="Correo" value="" testID="email" error="Correo inválido" />);
    expect(borderOf('email')).toMatchObject({ borderColor: colors.danger });
    expect(screen.getByText('Correo inválido')).toBeTruthy();
  });

  it('llama a onBlur al perder el foco', async () => {
    const onBlur = jest.fn();
    await render(<TextField label="Correo" value="" onBlur={onBlur} testID="email" />);
    await fireEvent(screen.getByTestId('email'), 'focus');
    await fireEvent(screen.getByTestId('email'), 'blur');
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('deshabilitado: no es editable y lo anuncia', async () => {
    await render(<TextField label="Correo" value="" disabled testID="email" />);
    expect(screen.getByTestId('email').props.editable).toBe(false);
    expect(screen.getByLabelText('Correo')).toBeDisabled();
  });
});

describe('PasswordField', () => {
  it('oculta la contraseña y el ojo la muestra y la vuelve a ocultar', async () => {
    await render(<PasswordField label="Contraseña" value="secreto" testID="pwd" />);
    expect(screen.getByTestId('pwd').props.secureTextEntry).toBe(true);

    await fireEvent.press(screen.getByRole('button', { name: es.auth.showPassword }));
    expect(screen.getByTestId('pwd').props.secureTextEntry).toBe(false);

    await fireEvent.press(screen.getByRole('button', { name: es.auth.hidePassword }));
    expect(screen.getByTestId('pwd').props.secureTextEntry).toBe(true);
  });

  it('el ojo mide al menos 44 pt', async () => {
    await render(<PasswordField label="Contraseña" value="" />);
    const style = StyleSheet.flatten(
      screen.getByRole('button', { name: es.auth.showPassword }).props.style as never,
    ) as { width: number; height: number };
    expect(style.width).toBeGreaterThanOrEqual(44);
    expect(style.height).toBeGreaterThanOrEqual(44);
  });
});

describe('Checkbox', () => {
  it('alterna con el toque y anuncia su estado', async () => {
    const onChange = jest.fn();
    const { rerender } = await render(
      <Checkbox checked={false} onChange={onChange} accessibilityLabel="Soy mayor de edad">
        Soy mayor de edad
      </Checkbox>,
    );
    const box = screen.getByRole('checkbox', { name: 'Soy mayor de edad' });
    expect(box).not.toBeChecked();
    await fireEvent.press(box);
    expect(onChange).toHaveBeenCalledWith(true);

    await rerender(
      <Checkbox checked onChange={onChange} accessibilityLabel="Soy mayor de edad">
        Soy mayor de edad
      </Checkbox>,
    );
    expect(screen.getByRole('checkbox', { name: 'Soy mayor de edad' })).toBeChecked();
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Soy mayor de edad' }));
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it('muestra el error y tiene área táctil de 44 pt', async () => {
    await render(
      <Checkbox
        checked={false}
        onChange={jest.fn()}
        accessibilityLabel="Acepto"
        error="Obligatorio"
      >
        Acepto
      </Checkbox>,
    );
    expect(screen.getByText('Obligatorio')).toBeTruthy();
    const style = StyleSheet.flatten(screen.getByRole('checkbox').props.style as never) as {
      width: number;
      height: number;
    };
    expect(style.width).toBeGreaterThanOrEqual(44);
    expect(style.height).toBeGreaterThanOrEqual(44);
  });
});

describe('EmptyState', () => {
  it('muestra título y texto, y ejecuta la acción', async () => {
    const onAction = jest.fn();
    await render(
      <EmptyState
        icon="home"
        title="Sin objetos"
        description="Nada por aquí"
        actionLabel="Publicar"
        onAction={onAction}
      />,
    );
    expect(screen.getByText('Sin objetos')).toBeTruthy();
    expect(screen.getByText('Nada por aquí')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Publicar' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('sin acción no muestra botón; la variante compacta se renderiza', async () => {
    await render(<EmptyState icon="home" title="Vacío" compact />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Vacío')).toBeTruthy();
  });
});

describe('SlotPlaceholder', () => {
  it('sin pista anuncia solo el título', async () => {
    await render(<SlotPlaceholder title="Pronto" />);
    expect(screen.getByLabelText('Pronto')).toBeTruthy();
  });

  it.each(['warm', 'green'] as const)('anuncia título y pista en el tono %s', async (tone) => {
    await render(<SlotPlaceholder title="Kit" hint="Pronto" tone={tone} />);
    expect(screen.getByLabelText('Kit. Pronto')).toBeTruthy();
  });
});
