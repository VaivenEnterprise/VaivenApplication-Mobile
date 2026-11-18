import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { getHealth } from '@/features/diagnostics/api/getHealth';
import { ApiError } from '@/lib/api/errors';

// Conexión sin librerías nuevas (spec 012 RF-02, plan P-01): una falla de red del cliente de API
// marca «sin conexión»; mientras tanto se pregunta a `/healthz` con *backoff* y al volver a primer
// plano. Cualquier respuesta del servidor (incluso 5xx) significa que hay red.

export type ConnectionStatus = 'online' | 'offline' | 'recovered';

/** Espera entre sondeos mientras no hay conexión; el último valor se repite. */
export const PROBE_BACKOFF_MS = [2_000, 4_000, 8_000, 16_000, 30_000] as const;
/** Cuánto se muestra «De vuelta en línea». */
export const RECOVERED_VISIBLE_MS = 2_000;

function isNetworkFailure(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'network_error';
}

/** `true` si el servidor contestó algo (aunque sea un error), es decir, hay red. */
async function reachServer(): Promise<boolean> {
  try {
    await getHealth();
    return true;
  } catch (error) {
    return !(
      error instanceof ApiError &&
      (error.code === 'network_error' || error.code === 'timeout')
    );
  }
}

/**
 * Estado de la conexión: `offline` tras una falla de red de cualquier consulta o mutación,
 * `recovered` durante 2 s al volver (y se recargan las consultas activas), `online` el resto.
 */
export function useOnline(): ConnectionStatus {
  const client = useQueryClient();
  const [status, setStatus] = useState<ConnectionStatus>('online');
  const offline = useRef(false);
  const attempt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recoveredTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);
  const probeRef = useRef<() => Promise<void>>(async () => undefined);

  const clearProbe = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const probe = useCallback(async () => {
    clearProbe();
    const reached = await reachServer();
    if (!alive.current || !offline.current) return;
    if (reached) {
      offline.current = false;
      attempt.current = 0;
      setStatus('recovered');
      void client.invalidateQueries();
      if (recoveredTimer.current !== null) clearTimeout(recoveredTimer.current);
      recoveredTimer.current = setTimeout(() => setStatus('online'), RECOVERED_VISIBLE_MS);
      return;
    }
    const delay = PROBE_BACKOFF_MS[Math.min(attempt.current, PROBE_BACKOFF_MS.length - 1)];
    attempt.current += 1;
    timer.current = setTimeout(() => void probeRef.current(), delay);
  }, [client, clearProbe]);

  useEffect(() => {
    probeRef.current = probe;
  }, [probe]);

  const goOffline = useCallback(() => {
    if (offline.current) return;
    offline.current = true;
    // El primer sondeo usa la primera espera; el siguiente, la segunda.
    attempt.current = 1;
    if (recoveredTimer.current !== null) clearTimeout(recoveredTimer.current);
    setStatus('offline');
    timer.current = setTimeout(() => void probe(), PROBE_BACKOFF_MS[0]);
  }, [probe]);

  // Falla de red en cualquier consulta o mutación.
  useEffect(() => {
    const onEvent = (event: { type: string; action?: { type?: string; error?: unknown } }) => {
      if (event.type === 'updated' && event.action?.type === 'error') {
        if (isNetworkFailure(event.action.error)) goOffline();
      }
    };
    const unsubscribeQueries = client.getQueryCache().subscribe(onEvent);
    const unsubscribeMutations = client.getMutationCache().subscribe(onEvent);
    return () => {
      unsubscribeQueries();
      unsubscribeMutations();
    };
  }, [client, goOffline]);

  // Al volver a primer plano sin conexión se sondea de inmediato.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && offline.current) void probe();
    });
    return () => subscription.remove();
  }, [probe]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      clearProbe();
      if (recoveredTimer.current !== null) clearTimeout(recoveredTimer.current);
    };
  }, [clearProbe]);

  return status;
}
