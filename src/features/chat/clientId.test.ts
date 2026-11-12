import { newClientId } from '@/features/chat/clientId';

const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('newClientId', () => {
  it('tiene formato UUID v4 y cabe en los 64 caracteres del contrato', () => {
    for (let i = 0; i < 50; i += 1) {
      const id = newClientId();
      expect(id).toMatch(V4);
      expect(id.length).toBeLessThanOrEqual(64);
    }
  });

  it('no repite identificadores', () => {
    const ids = new Set(Array.from({ length: 500 }, () => newClientId()));
    expect(ids.size).toBe(500);
  });

  it('funciona aunque el motor no ofrezca crypto.getRandomValues', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
    Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });
    try {
      expect(newClientId()).toMatch(V4);
    } finally {
      if (original) Object.defineProperty(globalThis, 'crypto', original);
      else delete (globalThis as { crypto?: unknown }).crypto;
    }
  });

  it('usa crypto.getRandomValues cuando existe', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
    const getRandomValues = jest.fn((array: Uint8Array) => {
      array.fill(0xff);
      return array;
    });
    Object.defineProperty(globalThis, 'crypto', { value: { getRandomValues }, configurable: true });
    try {
      expect(newClientId()).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');
      expect(getRandomValues).toHaveBeenCalled();
    } finally {
      if (original) Object.defineProperty(globalThis, 'crypto', original);
      else delete (globalThis as { crypto?: unknown }).crypto;
    }
  });
});
