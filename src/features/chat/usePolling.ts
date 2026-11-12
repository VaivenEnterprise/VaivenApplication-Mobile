import { useIsFocused } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

/**
 * La app consulta salvo que esté en segundo plano o inactiva. Un estado desconocido (al arrancar,
 * antes del primer evento) cuenta como activo: la persona la está abriendo.
 */
function isForeground(state: unknown): boolean {
  return state !== 'background' && state !== 'inactive';
}

type PollingOptions = {
  /** Con `false` no consulta (p. ej. mientras la consulta principal aún no tiene datos). */
  enabled?: boolean;
  /**
   * Con `false` no consulta al montar la pantalla (la consulta principal ya lo hace); sí consulta
   * al volver al primer plano o al enfocar de nuevo la pantalla.
   */
  runOnMount?: boolean;
};

/**
 * Consulta periódica consciente del estado de la app (RF-04, plan P-03): llama a `tick` cada
 * `intervalMs` solo con la app en primer plano **y** la pantalla enfocada; al volver a estar
 * activa consulta de inmediato. Nunca hay dos consultas a la vez: si la anterior no terminó, el
 * ciclo se salta. Un fallo no interrumpe el ciclo ni se registra (Art. VIII.3): la siguiente
 * vuelta reintenta. No hay *websockets* ni consultas en segundo plano (CA-03).
 */
export function usePolling(
  tick: () => unknown,
  intervalMs: number,
  { enabled = true, runOnMount = true }: PollingOptions = {},
): void {
  const focused = useIsFocused();
  const [appActive, setAppActive] = useState(isForeground(AppState.currentState));
  const tickRef = useRef(tick);
  const busy = useRef(false);
  const firstActivation = useRef(true);

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      setAppActive(isForeground(state));
    });
    return () => subscription.remove();
  }, []);

  const active = enabled && focused && appActive;
  useEffect(() => {
    if (!active) return undefined;
    const run = async () => {
      if (busy.current) return;
      busy.current = true;
      try {
        await tickRef.current();
      } catch {
        // El siguiente ciclo reintenta.
      } finally {
        busy.current = false;
      }
    };
    if (runOnMount || !firstActivation.current) void run();
    firstActivation.current = false;
    const timer = setInterval(() => void run(), intervalMs);
    return () => clearInterval(timer);
  }, [active, intervalMs, runOnMount]);
}
