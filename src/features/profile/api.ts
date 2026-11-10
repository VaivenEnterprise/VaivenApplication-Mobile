import { z } from 'zod';
import { userSchema, type User } from '@/features/auth/schemas';
import { request } from '@/lib/api/client';
import { publicUserSchema, type PublicUser, type UpdateMeRequest } from './schemas';

// Cuenta propia (`/me`) y perfil público (`/users/{id}`).

export function getMe(): Promise<User> {
  return request('/me', userSchema);
}

export function updateMe(body: UpdateMeRequest): Promise<User> {
  return request('/me', userSchema, { method: 'PATCH', body: JSON.stringify(body) });
}

/** Responde 204. Un 403 significa contraseña incorrecta y un 409, reservas activas. */
export async function deleteMe(password: string): Promise<void> {
  await request('/me', z.null(), { method: 'DELETE', body: JSON.stringify({ password }) });
}

export function getUser(id: string): Promise<PublicUser> {
  return request(`/users/${encodeURIComponent(id)}`, publicUserSchema);
}
