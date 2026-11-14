import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import {
  DISABLED_KEY,
  PRIMER_SEEN_KEY,
  getPermission,
  getRegisteredToken,
  isPushSupported,
  readFlag,
  registerDevice,
  requestPermission,
  unregisterDevice,
  writeFlag,
  type PushPermission,
} from '@/features/notifications/push';

// Estado y acciones de los avisos push (spec 011 RF-03, RF-09). El estado vive en la caché de
// consultas para que el interruptor del centro de avisos y la pantalla previa lo compartan.

export const pushKeys = {
  status: ['push', 'status'] as const,
  primer: ['push', 'primer'] as const,
};

/**
 * - `unavailable`: emulador o dispositivo sin push (P-08); la app sigue sin avisos del teléfono.
 * - `denied`: la persona negó el permiso del sistema (CA-03).
 * - `undetermined`: aún no se ha pedido el permiso.
 * - `off`: permiso concedido pero la persona apagó el interruptor.
 * - `on`: permiso concedido y token registrado (o por registrarse).
 */
export type PushStatus = 'unavailable' | 'denied' | 'undetermined' | 'off' | 'on';

async function loadStatus(): Promise<PushStatus> {
  if (!isPushSupported()) return 'unavailable';
  const permission: PushPermission = await getPermission();
  if (permission === 'denied') return 'denied';
  if (permission === 'undetermined') return 'undetermined';
  return (await readFlag(DISABLED_KEY)) ? 'off' : 'on';
}

export type PushControls = {
  status: PushStatus | null;
  /** Pide el permiso si hace falta y registra el token. `true` si quedó activado. */
  enable: () => Promise<boolean>;
  /** Da de baja el token y recuerda que la persona apagó los avisos. */
  disable: () => Promise<void>;
  busy: boolean;
  /** `true` si el último intento de activar falló por algo distinto a negar el permiso. */
  failed: boolean;
};

export function usePush(): PushControls {
  const client = useQueryClient();
  const status = useQuery({ queryKey: pushKeys.status, queryFn: loadStatus, staleTime: Infinity });

  // El permiso puede cambiar desde los ajustes del teléfono: se relee al volver a la app.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void client.invalidateQueries({ queryKey: pushKeys.status });
    });
    return () => subscription.remove();
  }, [client]);

  const enableMutation = useMutation({
    mutationFn: async (): Promise<PushStatus> => {
      if (!isPushSupported()) return 'unavailable';
      const permission = await requestPermission();
      await writeFlag(PRIMER_SEEN_KEY, true);
      if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'undetermined';
      if (!(await registerDevice())) throw new Error('push_token_unavailable');
      await writeFlag(DISABLED_KEY, false);
      return 'on';
    },
    onSuccess: (next) => {
      client.setQueryData(pushKeys.status, next);
      client.setQueryData(pushKeys.primer, true);
    },
  });

  const disableMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      await unregisterDevice();
      await writeFlag(DISABLED_KEY, true);
    },
    onSuccess: () => {
      client.setQueryData(pushKeys.status, 'off' satisfies PushStatus);
    },
  });

  const { mutateAsync: enableAsync } = enableMutation;
  const { mutateAsync: disableAsync } = disableMutation;

  const enable = useCallback(async () => {
    try {
      return (await enableAsync()) === 'on';
    } catch {
      return false;
    }
  }, [enableAsync]);
  const disable = useCallback(async () => {
    try {
      await disableAsync();
    } catch {
      // El interruptor queda como estaba; la persona puede intentarlo de nuevo.
    }
  }, [disableAsync]);

  return {
    status: status.data ?? null,
    enable,
    disable,
    busy: enableMutation.isPending || disableMutation.isPending,
    failed: enableMutation.isError,
  };
}

/**
 * Pantalla previa de permiso (RF-03, P-03): se muestra una sola vez, tras iniciar sesión, mientras
 * el permiso del sistema esté sin decidir. `dismiss` la recuerda como vista para no insistir.
 */
export function usePushPrimer(status: PushStatus | null): {
  visible: boolean;
  dismiss: () => void;
} {
  const client = useQueryClient();
  const seen = useQuery({
    queryKey: pushKeys.primer,
    queryFn: () => readFlag(PRIMER_SEEN_KEY),
    staleTime: Infinity,
  });
  const dismiss = useCallback(() => {
    client.setQueryData(pushKeys.primer, true);
    void writeFlag(PRIMER_SEEN_KEY, true);
  }, [client]);
  return { visible: status === 'undetermined' && seen.data === false, dismiss };
}

/**
 * Registra el token en el servidor una vez por sesión cuando los avisos están activados (permiso
 * concedido y no apagados). Un fallo no interrumpe nada: la app funciona sin push (RF-03).
 */
export function useRegisterWhenOn(status: PushStatus | null): void {
  useEffect(() => {
    if (status !== 'on' || getRegisteredToken() !== null) return;
    void registerDevice().catch(() => undefined);
  }, [status]);
}
