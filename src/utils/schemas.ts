import { z } from 'zod';
import { esMX as t } from '@/i18n/es-MX';

const emailFormat = z.email();

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .superRefine((value, ctx) => {
    if (!value) {
      ctx.addIssue({ code: 'custom', message: t.auth.validation.emailRequired });
      return;
    }

    if (!emailFormat.safeParse(value).success) {
      ctx.addIssue({ code: 'custom', message: t.auth.validation.emailInvalid });
    }
  });

export const passwordSchema = z.string().superRefine((value, ctx) => {
  if (!value) {
    ctx.addIssue({ code: 'custom', message: t.auth.validation.passwordRequired });
    return;
  }

  if (value.length < 8) {
    ctx.addIssue({ code: 'custom', message: t.auth.validation.passwordMin });
    return;
  }

  if (!/[A-Z]/.test(value)) {
    ctx.addIssue({ code: 'custom', message: t.auth.validation.passwordUppercase });
    return;
  }

  if (!/[0-9]/.test(value)) {
    ctx.addIssue({ code: 'custom', message: t.auth.validation.passwordNumber });
    return;
  }

  if (!/[^A-Za-z0-9]/.test(value)) {
    ctx.addIssue({ code: 'custom', message: t.auth.validation.passwordSpecial });
  }
});

export const phoneSchema = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    if (!value) {
      ctx.addIssue({ code: 'custom', message: t.auth.validation.phoneRequired });
      return;
    }

    if (!/^\d{10}$/.test(value)) {
      ctx.addIssue({ code: 'custom', message: t.auth.validation.phoneInvalid });
    }
  });

export const fullNameSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/\s+/g, ' '))
  .superRefine((value, ctx) => {
    if (!value) {
      ctx.addIssue({ code: 'custom', message: t.auth.validation.nameRequired });
      return;
    }

    if (value.length < 3) {
      ctx.addIssue({ code: 'custom', message: t.auth.validation.nameMin });
      return;
    }

    if (!/^[\p{L} ]+$/u.test(value)) {
      ctx.addIssue({ code: 'custom', message: t.auth.validation.nameInvalid });
    }
  });

export const termsSchema = z.boolean().refine((value) => value, t.auth.validation.termsRequired);

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  terms: termsSchema,
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
