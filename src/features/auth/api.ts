import { z } from 'zod';
import { request } from '@/lib/api/client';
import {
  authResultSchema,
  refreshResultSchema,
  type AuthResult,
  type LoginInput,
  type RegisterRequest,
  type Tokens,
} from './schemas';

// Rutas de autenticación del contrato (`backend/api/paths/auth.yaml`). Ninguna
// registra cuerpos ni tokens (RNNF-01): el cliente de API tampoco lo hace.

export function register(body: RegisterRequest): Promise<AuthResult> {
  return request('/auth/register', authResultSchema, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function login(input: LoginInput): Promise<AuthResult> {
  return request('/auth/login', authResultSchema, {
    method: 'POST',
    body: JSON.stringify({ email: input.email, password: input.password }),
  });
}

export async function refreshTokens(refreshToken: string): Promise<Tokens> {
  const result = await request('/auth/refresh', refreshResultSchema, {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
  return result.tokens;
}

/** Responde 204; el cuerpo vacío llega como `null`. */
export async function logout(refreshToken: string): Promise<void> {
  await request('/auth/logout', z.null(), {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}
