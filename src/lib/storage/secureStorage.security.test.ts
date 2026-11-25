import * as SecureStore from 'expo-secure-store';
import { secureStorage } from '@/lib/storage/secureStorage';

// Spec 016 · S-01 (OWASP M9 almacenamiento inseguro, M1 uso indebido de credenciales):
// los secretos viajan solo al almacén seguro del dispositivo.

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const store = jest.mocked(SecureStore);

beforeEach(() => {
  store.getItemAsync.mockReset();
  store.setItemAsync.mockReset();
  store.deleteItemAsync.mockReset();
});

describe('S-01 · M9 · almacén seguro', () => {
  it('S-01a guarda, lee y borra únicamente con expo-secure-store', async () => {
    store.getItemAsync.mockResolvedValue('secreto');
    expect(await secureStorage.set('k', 'secreto')).toBe(true);
    expect(await secureStorage.get('k')).toBe('secreto');
    expect(await secureStorage.remove('k')).toBe(true);
    expect(store.setItemAsync).toHaveBeenCalledWith('k', 'secreto');
    expect(store.getItemAsync).toHaveBeenCalledWith('k');
    expect(store.deleteItemAsync).toHaveBeenCalledWith('k');
  });

  it('S-01b un fallo del almacén no lanza ni devuelve el valor', async () => {
    store.getItemAsync.mockRejectedValue(new Error('keystore roto: secreto'));
    store.setItemAsync.mockRejectedValue(new Error('keystore roto'));
    store.deleteItemAsync.mockRejectedValue(new Error('keystore roto'));
    expect(await secureStorage.get('k')).toBeNull();
    expect(await secureStorage.set('k', 'secreto')).toBe(false);
    expect(await secureStorage.remove('k')).toBe(false);
  });

  it('S-01c no escribe claves ni valores en la consola', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) =>
      jest.spyOn(console, m).mockImplementation(() => undefined),
    );
    store.setItemAsync.mockRejectedValue(new Error('fallo'));
    await secureStorage.set('vaiven.refreshToken', 'valor-secreto');
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    for (const spy of spies) spy.mockRestore();
  });
});
