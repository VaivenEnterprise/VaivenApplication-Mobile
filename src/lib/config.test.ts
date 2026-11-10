import { ConfigError, loadConfig, tryLoadConfig, type RawEnv } from '@/lib/config';

describe('loadConfig', () => {
  it.each<[string, RawEnv, { apiBaseUrl: string; appEnv: string }]>([
    [
      'emulador Android con entorno por defecto',
      { EXPO_PUBLIC_API_URL: 'http://10.0.2.2:8080' },
      { apiBaseUrl: 'http://10.0.2.2:8080', appEnv: 'development' },
    ],
    [
      'entorno vacío se trata como no definido',
      { EXPO_PUBLIC_API_URL: 'http://localhost:8080', EXPO_PUBLIC_APP_ENV: '' },
      { apiBaseUrl: 'http://localhost:8080', appEnv: 'development' },
    ],
    [
      'quita espacios y barras finales',
      { EXPO_PUBLIC_API_URL: '  http://192.168.1.20:8080//  ', EXPO_PUBLIC_APP_ENV: 'development' },
      { apiBaseUrl: 'http://192.168.1.20:8080', appEnv: 'development' },
    ],
    [
      'producción con https',
      { EXPO_PUBLIC_API_URL: 'https://api.vaiven.mx', EXPO_PUBLIC_APP_ENV: 'production' },
      { apiBaseUrl: 'https://api.vaiven.mx', appEnv: 'production' },
    ],
    [
      'staging con puerto y https',
      { EXPO_PUBLIC_API_URL: 'https://vaiven.example.com:8443' },
      { apiBaseUrl: 'https://vaiven.example.com:8443', appEnv: 'development' },
    ],
  ])('acepta %s', (_name, env, expected) => {
    expect(loadConfig(env)).toEqual(expected);
  });

  it.each<[string, RawEnv, string]>([
    ['URL faltante', {}, 'Falta EXPO_PUBLIC_API_URL'],
    ['URL indefinida', { EXPO_PUBLIC_API_URL: undefined }, 'Falta EXPO_PUBLIC_API_URL'],
    ['URL vacía', { EXPO_PUBLIC_API_URL: '' }, 'no es una URL válida'],
    ['texto que no es URL', { EXPO_PUBLIC_API_URL: 'no-es-url' }, 'no es una URL válida'],
    ['esquema no http', { EXPO_PUBLIC_API_URL: 'ftp://10.0.2.2' }, 'no es una URL válida'],
    ['sin host', { EXPO_PUBLIC_API_URL: 'http://' }, 'no es una URL válida'],
    ['con espacios', { EXPO_PUBLIC_API_URL: 'http://10.0.2.2: 8080' }, 'no es una URL válida'],
    [
      'puerto fuera de rango',
      { EXPO_PUBLIC_API_URL: 'http://10.0.2.2:99999' },
      'no es una URL válida',
    ],
    [
      'entorno desconocido',
      { EXPO_PUBLIC_API_URL: 'http://10.0.2.2:8080', EXPO_PUBLIC_APP_ENV: 'staging' },
      'development',
    ],
    [
      'producción con http',
      { EXPO_PUBLIC_API_URL: 'http://api.vaiven.mx', EXPO_PUBLIC_APP_ENV: 'production' },
      'debe usar https',
    ],
  ])('rechaza %s con un mensaje claro', (_name, env, fragment) => {
    expect(() => loadConfig(env)).toThrow(ConfigError);
    expect(() => loadConfig(env)).toThrow(fragment);
  });

  it('no deja pasar secretos ni otras variables al resultado', () => {
    const config = loadConfig({
      EXPO_PUBLIC_API_URL: 'http://10.0.2.2:8080',
      SECRET: 'x',
    } as RawEnv);
    expect(Object.keys(config).sort()).toEqual(['apiBaseUrl', 'appEnv']);
  });
});

describe('tryLoadConfig', () => {
  it('devuelve ok con la configuración válida', () => {
    const result = tryLoadConfig({ EXPO_PUBLIC_API_URL: 'http://10.0.2.2:8080' });
    expect(result.ok).toBe(true);
  });

  it('devuelve el error con todos los problemas sin lanzar', () => {
    const result = tryLoadConfig({ EXPO_PUBLIC_APP_ENV: 'otro' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(ConfigError);
      expect(result.error.issues).toHaveLength(2);
    }
  });
});

describe('configuración de ejecución', () => {
  const originalUrl = process.env.EXPO_PUBLIC_API_URL;

  afterEach(() => {
    if (originalUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = originalUrl;
  });

  it('getConfig lanza si el entorno no define la URL', () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    jest.isolateModules(() => {
      const fresh = jest.requireActual<typeof import('@/lib/config')>('@/lib/config');
      expect(fresh.configResult.ok).toBe(false);
      expect(() => fresh.getConfig()).toThrow(fresh.ConfigError);
    });
  });

  it('getConfig devuelve la configuración leída de process.env', () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://10.0.2.2:8080/';
    jest.isolateModules(() => {
      const fresh = jest.requireActual<typeof import('@/lib/config')>('@/lib/config');
      expect(fresh.getConfig()).toEqual({
        apiBaseUrl: 'http://10.0.2.2:8080',
        appEnv: 'development',
      });
    });
  });
});
