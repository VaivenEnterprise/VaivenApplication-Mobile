import { z } from 'zod';
import { es } from '@/i18n/es-MX';
import { NAME_MAX, NAME_MIN } from '@/features/auth/schemas';

const v = es.auth.validation;

/** `GET /users/{id}`: nunca trae correo ni teléfono (Art. VI.4). */
export const publicUserSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  ratingAverage: z.number().nullable(),
  ratingCount: z.number().int().min(0),
  memberSince: z.string(),
});

export type PublicUser = z.infer<typeof publicUserSchema>;

export const PHONE_PATTERN = /^\+?[0-9]{10,15}$/;

/** Quita espacios, guiones y paréntesis que la gente escribe al capturar un teléfono. */
export const normalizePhone = (value: string): string => value.replace(/[\s()-]/g, '');

/** Formulario de «Editar perfil»: el teléfono vacío significa «sin teléfono». */
export const editProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, v.nameRequired)
    .min(NAME_MIN, v.nameTooShort)
    .max(NAME_MAX, v.nameTooLong),
  phone: z
    .string()
    .transform(normalizePhone)
    .refine((value) => value === '' || PHONE_PATTERN.test(value), es.profile.edit.phoneInvalid),
});

export type EditProfileInput = z.infer<typeof editProfileSchema>;

/** Cuerpo de `PATCH /me`: solo los campos enviados; `phone: null` borra el teléfono. */
export type UpdateMeRequest = { displayName?: string; phone?: string | null };
