import { loadConfig, tryLoadConfig } from '@/lib/config';

// Spec 016 · S-07 (OWASP M5 comunicación insegura): en producción solo hay tráfico cifrado.

describe('S-07 · M5 · HTTPS obligatorio fuera de desarrollo', () => {
  it('S-07a una URL http se rechaza con EXPO_PUBLIC_APP_ENV=production', () => {
    const result = tryLoadConfig({
      EXPO_PUBLIC_API_URL: 'http://api.vaiven.mx',
      EXPO_PUBLIC_APP_ENV: 'production',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.issues.join(' ')).toMatch(/https/);
  });

  it('S-07b la misma URL con https se acepta en producción', () => {
    const config = loadConfig({
      EXPO_PUBLIC_API_URL: 'https://api.vaiven.mx/',
      EXPO_PUBLIC_APP_ENV: 'production',
    });
    expect(config.apiBaseUrl).toBe('https://api.vaiven.mx');
    expect(config.appEnv).toBe('production');
  });

  it('S-07c http solo se tolera en desarrollo', () => {
    const config = loadConfig({
      EXPO_PUBLIC_API_URL: 'http://10.0.2.2:8080',
      EXPO_PUBLIC_APP_ENV: 'development',
    });
    expect(config.appEnv).toBe('development');
  });

  it('S-07d sin entorno declarado la app asume desarrollo, nunca producción', () => {
    const config = loadConfig({ EXPO_PUBLIC_API_URL: 'http://10.0.2.2:8080' });
    expect(config.appEnv).toBe('development');
  });

  it('S-07e una URL con esquema distinto de http(s) se rechaza', () => {
    expect(tryLoadConfig({ EXPO_PUBLIC_API_URL: 'ftp://api.vaiven.mx' }).ok).toBe(false);
    expect(tryLoadConfig({ EXPO_PUBLIC_API_URL: 'javascript:alert(1)' }).ok).toBe(false);
  });
});
