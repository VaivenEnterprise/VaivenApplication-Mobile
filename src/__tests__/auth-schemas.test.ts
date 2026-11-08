import { esMX as t } from '@/i18n/es-MX';
import { loginSchema, registerSchema } from '@/utils/schemas';

type ParseResult = {
  success: boolean;
  error?: { issues: { message: string }[] };
};

function issueMessages(result: ParseResult): string[] {
  return result.success ? [] : (result.error?.issues.map((issue) => issue.message) ?? []);
}

describe('esquemas de autenticación', () => {
  it('sanitiza correo y nombre en login y registro válidos', () => {
    const login = loginSchema.parse({
      email: '  MARIANA@VAIVEN.MX ',
      password: 'Segura1!',
    });

    expect(login.email).toBe('mariana@vaiven.mx');

    const register = registerSchema.parse({
      fullName: '  Mariana   López ',
      email: '  MARIANA@VAIVEN.MX ',
      phone: ' 5512345678 ',
      password: 'Segura1!',
      terms: true,
    });

    expect(register).toEqual({
      fullName: 'Mariana López',
      email: 'mariana@vaiven.mx',
      phone: '5512345678',
      password: 'Segura1!',
      terms: true,
    });
  });

  it('rechaza correos vacíos o con formato inválido', () => {
    expect(issueMessages(loginSchema.safeParse({ email: '', password: 'Segura1!' }))).toEqual([
      t.auth.validation.emailRequired,
    ]);
    expect(
      issueMessages(loginSchema.safeParse({ email: 'mariana', password: 'Segura1!' })),
    ).toEqual([t.auth.validation.emailInvalid]);
  });

  it.each([
    ['', t.auth.validation.passwordRequired],
    ['Sec1!', t.auth.validation.passwordMin],
    ['segura1!', t.auth.validation.passwordUppercase],
    ['Segura!!', t.auth.validation.passwordNumber],
    ['Segura11', t.auth.validation.passwordSpecial],
  ])('rechaza la contraseña %p', (password, message) => {
    expect(issueMessages(loginSchema.safeParse({ email: 'mariana@vaiven.mx', password }))).toEqual([
      message,
    ]);
  });

  it('valida nombre, teléfono y términos del registro', () => {
    const valid = {
      fullName: 'Mariana López',
      email: 'mariana@vaiven.mx',
      phone: '5512345678',
      password: 'Segura1!',
      terms: true,
    };

    expect(issueMessages(registerSchema.safeParse({ ...valid, fullName: '' }))).toEqual([
      t.auth.validation.nameRequired,
    ]);
    expect(issueMessages(registerSchema.safeParse({ ...valid, fullName: 'Al' }))).toEqual([
      t.auth.validation.nameMin,
    ]);
    expect(issueMessages(registerSchema.safeParse({ ...valid, fullName: 'Mariana 123' }))).toEqual([
      t.auth.validation.nameInvalid,
    ]);
    expect(issueMessages(registerSchema.safeParse({ ...valid, phone: '' }))).toEqual([
      t.auth.validation.phoneRequired,
    ]);
    expect(issueMessages(registerSchema.safeParse({ ...valid, phone: '551234567' }))).toEqual([
      t.auth.validation.phoneInvalid,
    ]);
    expect(issueMessages(registerSchema.safeParse({ ...valid, terms: false }))).toEqual([
      t.auth.validation.termsRequired,
    ]);
    expect(registerSchema.safeParse({ ...valid, fullName: 'José Pérez' }).success).toBe(true);
  });

  it('reúne todos los errores requeridos del registro vacío', () => {
    expect(
      issueMessages(
        registerSchema.safeParse({
          fullName: '',
          email: '',
          phone: '',
          password: '',
          terms: false,
        }),
      ),
    ).toEqual([
      t.auth.validation.nameRequired,
      t.auth.validation.emailRequired,
      t.auth.validation.phoneRequired,
      t.auth.validation.passwordRequired,
      t.auth.validation.termsRequired,
    ]);
  });
});
