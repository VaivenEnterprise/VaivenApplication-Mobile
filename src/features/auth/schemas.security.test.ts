import { loginSchema, registerSchema } from '@/features/auth/schemas';

// Spec 016 · S-09 (OWASP M4 validación insuficiente de entradas): lo inválido se rechaza
// en el dispositivo antes de salir a la red.

const valid = {
  displayName: 'Ana López',
  email: 'ana@example.com',
  password: '12345678',
  confirmPassword: '12345678',
  isAdult: true,
  acceptTerms: true,
};

describe('S-09 · M4 · validación de entradas de autenticación', () => {
  it('S-09a el registro válido pasa', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ['correo sin arroba', { email: 'ana.example.com' }],
    ['correo vacío', { email: '   ' }],
    ['correo de 255 caracteres', { email: `${'a'.repeat(250)}@x.com` }],
    ['contraseña corta', { password: '1234567', confirmPassword: '1234567' }],
    ['contraseña de 73 caracteres', { password: 'a'.repeat(73), confirmPassword: 'a'.repeat(73) }],
    ['confirmación distinta', { confirmPassword: 'otra-cosa' }],
    ['nombre de un carácter', { displayName: 'A' }],
    ['nombre de 41 caracteres', { displayName: 'A'.repeat(41) }],
    ['sin declarar mayoría de edad', { isAdult: false }],
    ['sin aceptar términos', { acceptTerms: false }],
  ])('S-09b el registro rechaza %s', (_caso, cambio) => {
    expect(registerSchema.safeParse({ ...valid, ...cambio }).success).toBe(false);
  });

  it.each([
    ['sin correo', { email: '', password: '12345678' }],
    ['correo inválido', { email: 'no-es-correo', password: '12345678' }],
    ['contraseña vacía', { email: 'ana@example.com', password: '' }],
    ['contraseña de 73 caracteres', { email: 'ana@example.com', password: 'a'.repeat(73) }],
  ])('S-09c el inicio de sesión rechaza %s', (_caso, entrada) => {
    expect(loginSchema.safeParse(entrada).success).toBe(false);
  });

  it('S-09d entradas con marcado o comillas no rompen la validación (solo se rechazan por formato)', () => {
    const r = registerSchema.safeParse({ ...valid, displayName: "<script>alert('x')</script>" });
    expect(typeof r.success).toBe('boolean');
    expect(
      loginSchema.safeParse({ email: "a'; DROP TABLE users;--@x.com", password: '12345678' })
        .success,
    ).toBe(false);
  });
});
