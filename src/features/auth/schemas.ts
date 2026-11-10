import { z } from 'zod';
import { es } from '@/i18n/es-MX';

// Esquemas del contrato de autenticación (`backend/api/paths/auth.yaml`) y de los
// formularios de inicio de sesión y registro. Los mensajes salen de `i18n/auth.ts`.

const v = es.auth.validation;

// --- Respuestas del servidor ---------------------------------------------------

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  displayName: z.string(),
  phone: z.string().nullable(),
  role: z.enum(['user', 'admin']),
  ratingAverage: z.number().nullable(),
  ratingCount: z.number().int().min(0),
  createdAt: z.string(),
});

export const tokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
});

export const authResultSchema = z.object({ user: userSchema, tokens: tokensSchema });
export const refreshResultSchema = z.object({ tokens: tokensSchema });

export type User = z.infer<typeof userSchema>;
export type Tokens = z.infer<typeof tokensSchema>;
export type AuthResult = z.infer<typeof authResultSchema>;

// --- Formularios ---------------------------------------------------------------

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;
export const NAME_MIN = 2;
export const NAME_MAX = 40;
export const EMAIL_MAX = 254;

const emailField = z
  .string()
  .trim()
  .min(1, v.emailRequired)
  .max(EMAIL_MAX, v.emailInvalid)
  .pipe(z.email(v.emailInvalid));

const passwordField = z
  .string()
  .min(1, v.passwordRequired)
  .min(PASSWORD_MIN, v.passwordTooShort)
  .max(PASSWORD_MAX, v.passwordTooLong);

export const loginSchema = z.object({ email: emailField, password: passwordField });

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, v.nameRequired)
      .min(NAME_MIN, v.nameTooShort)
      .max(NAME_MAX, v.nameTooLong),
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, v.confirmRequired),
    isAdult: z.boolean().refine((value) => value, v.adultRequired),
    acceptTerms: z.boolean().refine((value) => value, v.termsRequired),
  })
  .refine((data) => data.confirmPassword === '' || data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    error: v.confirmMismatch,
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

/** Cuerpo de `POST /auth/register`: sin la confirmación, que no viaja al servidor. */
export type RegisterRequest = {
  email: string;
  password: string;
  displayName: string;
  acceptTerms: true;
  isAdult: true;
};

export function toRegisterRequest(input: RegisterInput): RegisterRequest {
  return {
    email: input.email,
    password: input.password,
    displayName: input.displayName,
    acceptTerms: true,
    isAdult: true,
  };
}
