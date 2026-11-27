import fs from 'node:fs';
import path from 'node:path';
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

// Spec 021 · T002 (RF-02, CA-02): una sola versión y una sola URL de API en todos lados.
const ROOT = path.resolve(__dirname, '..');
const read = (rel: string): string => fs.readFileSync(path.join(ROOT, rel), 'utf8');

type EasProfile = { env?: Record<string, string> };

/** Devuelve los motivos por los que las versiones o las URLs de API no coinciden (vacío = coherente). */
export function incoherencias(input: {
  appVersion: string | undefined;
  pkgVersion: string;
  lockVersion: string | undefined;
  apiUrls: Record<string, string | undefined>;
}): string[] {
  const out: string[] = [];
  if (input.appVersion !== input.pkgVersion) {
    out.push(`version: app.config.ts=${input.appVersion} package.json=${input.pkgVersion}`);
  }
  if (input.lockVersion !== input.pkgVersion) {
    out.push(`version: package-lock.json=${input.lockVersion} package.json=${input.pkgVersion}`);
  }
  const distintas = new Set(Object.values(input.apiUrls));
  if (distintas.size !== 1 || distintas.has(undefined)) {
    out.push(`URL de API distinta o ausente: ${JSON.stringify(input.apiUrls)}`);
  }
  return out;
}

describe('coherencia de versión y URL de API (RF-02, CA-02)', () => {
  const pkg = JSON.parse(read('package.json')) as { version: string };
  const lock = JSON.parse(read('package-lock.json')) as {
    version?: string;
    packages?: Record<string, { version?: string }>;
  };
  const eas = JSON.parse(read('eas.json')) as { build: Record<string, EasProfile> };
  const urlEn = (texto: string): string[] =>
    texto.match(/https:\/\/vaiven-staging[\w.-]*(?::\d+)?/g) ?? [];
  const apiEas = (perfil: string) => eas.build[perfil]?.env?.EXPO_PUBLIC_API_URL;

  it('app.config.ts, package.json y package-lock.json declaran la misma versión', () => {
    expect(config.version).toBe(pkg.version);
    expect(lock.version).toBe(pkg.version);
    expect(lock.packages?.['']?.version).toBe(pkg.version);
  });

  it('eas.json (preview y production) usa la misma URL de API, https y con puerto', () => {
    expect(apiEas('preview')).toBeDefined();
    expect(apiEas('preview')).toBe(apiEas('production'));
    expect(apiEas('production')).toMatch(/^https:\/\/[\w.-]+:\d+$/);
  });

  it('.env.example y la documentación citan la misma URL de API que eas.json', () => {
    const esperada = apiEas('production') as string;
    for (const archivo of [
      '.env.example',
      'docs/calidad/dispositivo.md',
      'docs/play/solicitud-produccion.md',
    ]) {
      const urls = urlEn(read(archivo));
      expect(urls.length).toBeGreaterThan(0);
      expect({ archivo, urls: [...new Set(urls)] }).toEqual({ archivo, urls: [esperada] });
    }
  });

  it('caso negativo: detecta versiones o URLs que difieren', () => {
    const ok = {
      appVersion: '1.1.2',
      pkgVersion: '1.1.2',
      lockVersion: '1.1.2',
      apiUrls: { preview: 'https://a.example:8443', production: 'https://a.example:8443' },
    };
    expect(incoherencias(ok)).toEqual([]);
    expect(incoherencias({ ...ok, pkgVersion: '1.0.0' })).toHaveLength(2);
    expect(
      incoherencias({
        ...ok,
        apiUrls: { preview: 'https://a.example', production: ok.apiUrls.production },
      }),
    ).toHaveLength(1);
    expect(incoherencias({ ...ok, apiUrls: { preview: undefined } })).toHaveLength(1);
  });
});
