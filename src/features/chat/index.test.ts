import { slots } from '@/features/bookings';
import { OpenChatButton } from '@/features/chat';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

describe('registro del slot de chat (P-07)', () => {
  it('importar la feature registra la sección «chat» del detalle de la reserva', () => {
    const registered = slots.registered();
    expect(registered.map((slot) => slot.name)).toEqual(['chat']);
    expect(registered[0]?.Component).toBe(OpenChatButton);
  });
});
