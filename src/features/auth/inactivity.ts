import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/**
 * Spec 021-T015 (RF-14): tiempo sin uso tras el que se cierra (o se bloquea) la sesión. Único lugar
 * donde se configura; lo aprobó la persona responsable (15 minutos, D-245).
 */
export const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

/**
 * Llama a `onExpire` (una vez) cuando pasan `timeoutMs` desde la última actividad mientras
 * `active` es `true`. Cuenta el tiempo en primer plano y en segundo plano: al volver a primer plano
 * se compara con la última actividad, porque los temporizadores de JS se detienen en segundo
 * plano. Devuelve `markActivity`, que reinicia la cuenta (un toque en cualquier parte de la app).
 */
export function useInactivityTimeout(
  active: boolean,
  timeoutMs: number,
  onExpire: () => void,
): () => void {
  const lastActivity = useRef(0);
  const expireRef = useRef(onExpire);

  useEffect(() => {
    expireRef.current = onExpire;
  }, [onExpire]);

  const markActivity = useCallback(() => {
    lastActivity.current = Date.now();
  }, []);

  useEffect(() => {
    if (!active) return undefined;
    lastActivity.current = Date.now();
    let timer: ReturnType<typeof setTimeout> | null = null;
    let finished = false;

    const stopTimer = () => {
      if (timer !== null) clearTimeout(timer);
      timer = null;
    };
    const check = () => {
      if (finished) return;
      const idle = Date.now() - lastActivity.current;
      if (idle >= timeoutMs) {
        finished = true;
        stopTimer();
        expireRef.current();
        return;
      }
      stopTimer();
      timer = setTimeout(check, timeoutMs - idle);
    };

    timer = setTimeout(check, timeoutMs);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => {
      finished = true;
      stopTimer();
      subscription.remove();
    };
  }, [active, timeoutMs]);

  return markActivity;
}
