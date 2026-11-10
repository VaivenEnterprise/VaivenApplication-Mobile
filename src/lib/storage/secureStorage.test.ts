import * as SecureStore from 'expo-secure-store';
import { secureStorage } from '@/lib/storage/secureStorage';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mocked = jest.mocked(SecureStore);

afterEach(() => {
  jest.resetAllMocks();
});

describe('secureStorage.get', () => {
  it('devuelve el valor guardado', async () => {
    mocked.getItemAsync.mockResolvedValue('token-123');
    await expect(secureStorage.get('session.token')).resolves.toBe('token-123');
    expect(mocked.getItemAsync).toHaveBeenCalledWith('session.token');
  });

  it('devuelve null si la clave no existe', async () => {
    mocked.getItemAsync.mockResolvedValue(null);
    await expect(secureStorage.get('missing')).resolves.toBeNull();
  });

  it('devuelve null sin lanzar si el módulo falla', async () => {
    mocked.getItemAsync.mockRejectedValue(new Error('keystore no disponible'));
    await expect(secureStorage.get('session.token')).resolves.toBeNull();
  });
});

describe('secureStorage.set', () => {
  it('guarda el valor y devuelve true', async () => {
    mocked.setItemAsync.mockResolvedValue(undefined);
    await expect(secureStorage.set('session.token', 'abc')).resolves.toBe(true);
    expect(mocked.setItemAsync).toHaveBeenCalledWith('session.token', 'abc');
  });

  it('devuelve false sin lanzar si el módulo falla', async () => {
    mocked.setItemAsync.mockRejectedValue(new Error('clave inválida'));
    await expect(secureStorage.set('clave inválida!', 'abc')).resolves.toBe(false);
  });
});

describe('secureStorage.remove', () => {
  it('borra el valor y devuelve true', async () => {
    mocked.deleteItemAsync.mockResolvedValue(undefined);
    await expect(secureStorage.remove('session.token')).resolves.toBe(true);
    expect(mocked.deleteItemAsync).toHaveBeenCalledWith('session.token');
  });

  it('devuelve false sin lanzar si el módulo falla', async () => {
    mocked.deleteItemAsync.mockRejectedValue(new Error('fallo'));
    await expect(secureStorage.remove('session.token')).resolves.toBe(false);
  });
});

describe('privacidad', () => {
  it('no escribe claves ni valores en la consola al fallar', async () => {
    const spies = (['log', 'warn', 'error'] as const).map((method) =>
      jest.spyOn(console, method).mockImplementation(() => undefined),
    );
    mocked.getItemAsync.mockRejectedValue(new Error('fallo'));
    mocked.setItemAsync.mockRejectedValue(new Error('fallo'));
    mocked.deleteItemAsync.mockRejectedValue(new Error('fallo'));

    await secureStorage.get('session.token');
    await secureStorage.set('session.token', 'secreto');
    await secureStorage.remove('session.token');

    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    jest.restoreAllMocks();
  });
});
