import type { ExpoConfig } from 'expo/config';
import config from '../app.config';

type Plugin = string | [string, Record<string, unknown>];

function pluginOptions(name: string): Record<string, unknown> {
  const plugin = (config.plugins as Plugin[]).find((p) => (Array.isArray(p) ? p[0] : p) === name);
  if (!Array.isArray(plugin)) throw new Error(`El plugin ${name} no tiene opciones`);
  return plugin[1];
}

describe('app.config (RF-S1)', () => {
  it('define nombre, slug y esquema', () => {
    expect(config).toMatchObject({ name: 'Vaivén', slug: 'vaiven', scheme: 'vaiven' });
  });

  it('usa el identificador de paquete provisional en Android e iOS', () => {
    expect(config.android?.package).toBe('mx.vaiven.app');
    expect(config.ios?.bundleIdentifier).toBe('mx.vaiven.app');
  });

  it('declara los plugins de cámara, ubicación, fotos y notificaciones', () => {
    const names = (config.plugins as Plugin[]).map((p) => (Array.isArray(p) ? p[0] : p));
    expect(names).toEqual(
      expect.arrayContaining([
        'expo-router',
        'expo-camera',
        'expo-location',
        'expo-image-picker',
        'expo-notifications',
      ]),
    );
  });

  it('explica cada permiso en español', () => {
    const texts = [
      pluginOptions('expo-camera').cameraPermission,
      pluginOptions('expo-location').locationWhenInUsePermission,
      pluginOptions('expo-image-picker').photosPermission,
      pluginOptions('expo-image-picker').cameraPermission,
    ];
    for (const text of texts) {
      expect(typeof text).toBe('string');
      expect(text as string).toMatch(/^Vaivén /);
      expect((text as string).length).toBeGreaterThan(20);
    }
  });

  it('pide solo ubicación aproximada y no usa micrófono', () => {
    expect(config.android?.blockedPermissions).toContain('android.permission.ACCESS_FINE_LOCATION');
    expect(pluginOptions('expo-camera').recordAudioAndroid).toBe(false);
    expect(pluginOptions('expo-image-picker').microphonePermission).toBe(false);
  });

  it('no incluye secretos ni credenciales', () => {
    const text = JSON.stringify(config satisfies ExpoConfig).toLowerCase();
    for (const word of ['secret', 'token', 'password', 'apikey', 'api_key']) {
      expect(text).not.toContain(word);
    }
  });
});
