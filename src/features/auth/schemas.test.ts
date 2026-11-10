import { es } from '@/i18n/es-MX';
import {
  authResultSchema,
  loginSchema,
  refreshResultSchema,
  registerSchema,
  toRegisterRequest,
} from '@/features/auth/schemas';

const user = {
  id: '6730f1c2a9b3e4d5f6a7b8c9',
  email: 'ana@example.com',
  displayName: 'Ana',
  phone: null,
  role: 'user',
  ratingAverage: null,
  ratingCount: 0,
  createdAt: '2026-11-06T18:00:00Z',
};
const tokens = { accessToken: 'a', refreshToken: 'r', expiresIn: 900 };

const validRegister = {
  displayName: 'Ana López',
  email: ' Ana@Example.com ',
  password: 'una-contrasena-larga',
  confirmPassword: 'una-contrasena-larga',
  isAdult: true,
  acceptTerms: true,
};

function messages(result: {
  success: boolean;
  error?: { issues: { message: string; path: PropertyKey[] }[] };
}) {
  return (result.error?.issues ?? []).map((issue) => `${String(issue.path[0])}: ${issue.message}`);
}

describe('respuestas del servidor', () => {
  it('acepta la sesión del contrato', () => {
    expect(authResultSchema.safeParse({ user, tokens }).success).toBe(true);
    expect(refreshResultSchema.safeParse({ tokens }).success).toBe(true);
  });

  it('rechaza una sesión sin tokens o con un rol desconocido', () => {
    expect(authResultSchema.safeParse({ user }).success).toBe(false);
    expect(authResultSchema.safeParse({ user: { ...user, role: 'root' }, tokens }).success).toBe(
      false,
    );
  });
});

describe('loginSchema', () => {
  it('acepta correo y contraseña válidos y recorta el correo', () => {
    const result = loginSchema.safeParse({ email: ' ana@example.com ', password: '12345678' });
    expect(result.success && result.data.email).toBe('ana@example.com');
  });

  it.each([
    [{ email: '', password: '12345678' }, `email: ${es.auth.validation.emailRequired}`],
    [{ email: 'no-es-correo', password: '12345678' }, `email: ${es.auth.validation.emailInvalid}`],
    [
      { email: 'ana@example.com', password: '' },
      `password: ${es.auth.validation.passwordRequired}`,
    ],
    [
      { email: 'ana@example.com', password: '1234567' },
      `password: ${es.auth.validation.passwordTooShort}`,
    ],
    [
      { email: 'ana@example.com', password: 'x'.repeat(73) },
      `password: ${es.auth.validation.passwordTooLong}`,
    ],
  ])('rechaza %j', (input, expected) => {
    expect(messages(loginSchema.safeParse(input))).toContain(expected);
  });
});

describe('registerSchema', () => {
  it('acepta un registro válido', () => {
    expect(registerSchema.safeParse(validRegister).success).toBe(true);
  });

  it('marca la confirmación cuando las contraseñas no coinciden', () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      confirmPassword: 'otra-contrasena',
    });
    expect(messages(result)).toEqual([`confirmPassword: ${es.auth.validation.confirmMismatch}`]);
  });

  it('pide confirmar la contraseña cuando está vacía', () => {
    const result = registerSchema.safeParse({ ...validRegister, confirmPassword: '' });
    expect(messages(result)).toEqual([`confirmPassword: ${es.auth.validation.confirmRequired}`]);
  });

  it.each([
    [{ displayName: '' }, es.auth.validation.nameRequired],
    [{ displayName: 'A' }, es.auth.validation.nameTooShort],
    [{ displayName: 'A'.repeat(41) }, es.auth.validation.nameTooLong],
    [{ password: 'corta', confirmPassword: 'corta' }, es.auth.validation.passwordTooShort],
    [{ isAdult: false }, es.auth.validation.adultRequired],
    [{ acceptTerms: false }, es.auth.validation.termsRequired],
  ])('rechaza %j', (patch, expected) => {
    const result = registerSchema.safeParse({ ...validRegister, ...patch });
    expect(messages(result).join('|')).toContain(expected);
  });

  it('arma el cuerpo de la petición sin la confirmación', () => {
    const parsed = registerSchema.parse(validRegister);
    expect(toRegisterRequest(parsed)).toEqual({
      email: 'Ana@Example.com',
      password: 'una-contrasena-larga',
      displayName: 'Ana López',
      acceptTerms: true,
      isAdult: true,
    });
  });
});
