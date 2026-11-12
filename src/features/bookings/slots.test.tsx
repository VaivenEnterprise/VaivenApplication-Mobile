import { Text } from 'react-native';
import { SLOT_ORDER, slots } from '@/features/bookings/slots';

afterEach(() => slots.clear());

describe('slots del detalle', () => {
  it('sin registros no hay secciones', () => {
    expect(slots.registered()).toEqual([]);
  });

  it('devuelve las registradas en el orden del detalle, sin importar cuándo se registraron', () => {
    const A = () => <Text>a</Text>;
    const B = () => <Text>b</Text>;
    slots.register('ratingsAndIncidents', B);
    slots.register('chat', A);
    expect(slots.registered().map((s) => s.name)).toEqual(['chat', 'ratingsAndIncidents']);
    expect(SLOT_ORDER).toEqual(['chat', 'deliveryAndPayments', 'ratingsAndIncidents']);
  });

  it('registrar de nuevo reemplaza el componente', () => {
    const A = () => <Text>a</Text>;
    const B = () => <Text>b</Text>;
    slots.register('chat', A);
    slots.register('chat', B);
    expect(slots.registered()).toHaveLength(1);
    expect(slots.registered()[0]?.Component).toBe(B);
  });
});
