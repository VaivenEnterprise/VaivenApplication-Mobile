import { z } from 'zod';

// Configuración de la app: se lee solo de variables públicas de Expo (Art. VIII:
// jamás secretos) y se valida en un único lugar.

export type AppEnv = 'development' | 'production';

export type Config = {
  /** URL base del backend, sin «/» final (p. ej. http://10.0.2.2:8080). */
  readonly apiBaseUrl: string;
  readonly appEnv: AppEnv;
  /** URL base del sitio público (términos y privacidad), sin «/» final. Opcional. */
  readonly legalBaseUrl?: string;
};

export type RawEnv = {
  EXPO_PUBLIC_API_URL?: string | undefined;
  EXPO_PUBLIC_APP_ENV?: string | undefined;
  EXPO_PUBLIC_LEGAL_URL?: string | undefined;
};

export class ConfigError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Configuración inválida: ${issues.join(' ')}`);
    this.name = 'ConfigError';
    this.issues = issues;
  }
}

export type ConfigResult =
  | { readonly ok: true; readonly config: Config }
  | { readonly ok: false; readonly error: ConfigError };

const API_URL_HELP = 'Usa una URL http(s) como http://10.0.2.2:8080 en el archivo .env.';
const MAX_PORT = 65535;

const HTTP_URL = /^https?:\/\/(?:[A-Za-z0-9.-]+|\[[0-9A-Fa-f:]+\])(?::(\d{1,5}))?(?:\/[^\s?#]*)?$/;

function isHttpUrl(value: string): boolean {
  const match = HTTP_URL.exec(value);
  if (!match) return false;
  const port = match[1];
  return port === undefined || Number(port) <= MAX_PORT;
}

// Una variable vacía (p. ej. `EXPO_PUBLIC_APP_ENV=`) se trata como no definida.
const emptyToUndefined = (value: unknown): unknown =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const envSchema = z
  .object({
    EXPO_PUBLIC_API_URL: z
      .string({ error: `Falta EXPO_PUBLIC_API_URL. ${API_URL_HELP}` })
      .trim()
      .refine(isHttpUrl, { error: `EXPO_PUBLIC_API_URL no es una URL válida. ${API_URL_HELP}` }),
    EXPO_PUBLIC_LEGAL_URL: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .trim()
        .refine(isHttpUrl, {
          error:
            'EXPO_PUBLIC_LEGAL_URL no es una URL válida. Usa una URL https:// del sitio público.',
        })
        .optional(),
    ),
    EXPO_PUBLIC_APP_ENV: z.preprocess(
      emptyToUndefined,
      z
        .enum(['development', 'production'], {
          error: 'EXPO_PUBLIC_APP_ENV debe ser «development» o «production».',
        })
        .default('development'),
    ),
  })
  .superRefine((env, ctx) => {
    // Art. VIII: en producción solo se permite tráfico cifrado.
    if (
      env.EXPO_PUBLIC_APP_ENV === 'production' &&
      isHttpUrl(env.EXPO_PUBLIC_API_URL) &&
      !env.EXPO_PUBLIC_API_URL.toLowerCase().startsWith('https://')
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['EXPO_PUBLIC_API_URL'],
        message: 'En producción EXPO_PUBLIC_API_URL debe usar https.',
      });
    }
  });

/** Valida el entorno y devuelve el resultado sin lanzar excepciones. */
export function tryLoadConfig(env: RawEnv): ConfigResult {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.message);
    return { ok: false, error: new ConfigError(issues) };
  }
  const legalUrl = parsed.data.EXPO_PUBLIC_LEGAL_URL;
  return {
    ok: true,
    config: {
      apiBaseUrl: parsed.data.EXPO_PUBLIC_API_URL.replace(/\/+$/, ''),
      appEnv: parsed.data.EXPO_PUBLIC_APP_ENV,
      ...(legalUrl === undefined ? {} : { legalBaseUrl: legalUrl.replace(/\/+$/, '') }),
    },
  };
}

/** Valida el entorno; lanza `ConfigError` con un mensaje claro si es inválido. */
export function loadConfig(env: RawEnv): Config {
  const result = tryLoadConfig(env);
  if (!result.ok) throw result.error;
  return result.config;
}

// Expo solo sustituye `process.env.EXPO_PUBLIC_*` cuando se accede a cada variable
// por su nombre completo; por eso no se pasa `process.env` entero.
const runtimeEnv: RawEnv = {
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
  EXPO_PUBLIC_LEGAL_URL: process.env.EXPO_PUBLIC_LEGAL_URL,
};

/** Resultado de validar el entorno al iniciar; `_layout.tsx` muestra el error si es inválido. */
export const configResult: ConfigResult = tryLoadConfig(runtimeEnv);

/** Configuración válida; lanza `ConfigError` si el entorno no lo es. */
export function getConfig(): Config {
  if (!configResult.ok) throw configResult.error;
  return configResult.config;
}
