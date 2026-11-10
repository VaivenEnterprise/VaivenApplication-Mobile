import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { authKeys } from '@/features/auth/keys';
import { useSession } from '@/features/auth/useSession';
import { deleteMe, getMe, getUser, updateMe } from './api';
import { profileKeys } from './keys';
import type { UpdateMeRequest } from './schemas';

/**
 * `GET /me`: refresca la cuenta propia y deja al usuario de la sesión al día. Mientras llega la
 * respuesta, `user` (de la sesión) permite mostrar el nombre al instante.
 */
export function useMe() {
  const { status, user, setUser } = useSession();
  const query = useQuery({
    queryKey: authKeys.me,
    queryFn: getMe,
    enabled: status === 'signedIn',
  });
  const fresh = query.data;
  useEffect(() => {
    if (fresh !== undefined) setUser(fresh);
  }, [fresh, setUser]);
  return { ...query, user: fresh ?? user };
}

/** `PATCH /me`: guarda nombre y teléfono y actualiza sesión y caché con la respuesta. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { setUser } = useSession();
  return useMutation({
    mutationFn: (body: UpdateMeRequest) => updateMe(body),
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(authKeys.me, user);
    },
  });
}

/** `DELETE /me`: da de baja la cuenta con la contraseña y cierra la sesión del dispositivo. */
export function useDeleteAccount() {
  const { signOut } = useSession();
  return useMutation({
    mutationFn: (password: string) => deleteMe(password),
    onSuccess: () => signOut(),
  });
}

/** `GET /users/{id}`: perfil público de otra persona. */
export function usePublicUser(id: string) {
  const { status } = useSession();
  return useQuery({
    queryKey: profileKeys.user(id),
    queryFn: () => getUser(id),
    enabled: status === 'signedIn',
  });
}
