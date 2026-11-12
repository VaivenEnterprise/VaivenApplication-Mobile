import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';
import { MoneyInput } from '@/features/items/components/MoneyInput';

function Harness({
  initial = null,
  onValue,
}: {
  initial?: number | null;
  onValue?: (v: number | null) => void;
}) {
  const [value, setValue] = useState<number | null>(initial);
  return (
    <MoneyInput
      label="Precio"
      value={value}
      onChange={(next) => {
        setValue(next);
        onValue?.(next);
      }}
    />
  );
}

const input = () => screen.getByLabelText('Precio');

describe('MoneyInput', () => {
  it('convierte los pesos escritos a centavos enteros', async () => {
    const onValue = jest.fn();
    await render(<Harness onValue={onValue} />);
    await fireEvent.changeText(input(), '90');
    expect(onValue).toHaveBeenLastCalledWith(9000);
    await fireEvent.changeText(input(), '90.5');
    expect(onValue).toHaveBeenLastCalledWith(9050);
    await fireEvent.changeText(input(), '1,234.56');
    expect(onValue).toHaveBeenLastCalledWith(123_456);
  });

  it('no deja escribir más de 2 decimales ni caracteres que no son importe', async () => {
    const onValue = jest.fn();
    await render(<Harness onValue={onValue} />);
    await fireEvent.changeText(input(), '12.34');
    await fireEvent.changeText(input(), '12.345');
    expect(input().props.value).toBe('12.34');
    expect(onValue).toHaveBeenLastCalledWith(1234);
    await fireEvent.changeText(input(), '12.3a');
    expect(input().props.value).toBe('12.34');
    await fireEvent.changeText(input(), '-5');
    expect(input().props.value).toBe('12.34');
  });

  it('limita a 9 dígitos enteros', async () => {
    await render(<Harness />);
    await fireEvent.changeText(input(), '123456789');
    await fireEvent.changeText(input(), '1234567890');
    expect(input().props.value).toBe('123456789');
  });

  it('conserva el texto mientras se escribe y reformatea al salir', async () => {
    await render(<Harness />);
    await fireEvent.changeText(input(), '12.');
    expect(input().props.value).toBe('12.');
    await fireEvent.changeText(input(), '12.5');
    await fireEvent(input(), 'blur');
    expect(input().props.value).toBe('12.50');
  });

  it('vaciar el campo da null', async () => {
    const onValue = jest.fn();
    await render(<Harness initial={500} onValue={onValue} />);
    expect(input().props.value).toBe('5');
    await fireEvent.changeText(input(), '');
    expect(onValue).toHaveBeenLastCalledWith(null);
    expect(input().props.value).toBe('');
  });

  it('muestra un valor que cambia desde fuera', async () => {
    const { rerender } = await render(
      <MoneyInput label="Precio" value={1000} onChange={jest.fn()} />,
    );
    expect(input().props.value).toBe('10');
    await rerender(<MoneyInput label="Precio" value={3050} onChange={jest.fn()} />);
    expect(input().props.value).toBe('30.50');
  });

  it('usa teclado decimal y respeta disabled y error', async () => {
    await render(<MoneyInput label="Precio" value={0} onChange={jest.fn()} disabled error="Mal" />);
    expect(input().props.keyboardType).toBe('decimal-pad');
    expect(input().props.editable).toBe(false);
    expect(screen.getByText('Mal')).toBeTruthy();
  });
});
