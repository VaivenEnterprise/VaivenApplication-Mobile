import { allowScreenCaptureAsync, preventScreenCaptureAsync } from 'expo-screen-capture';
import { useEffect, useId } from 'react';

/**
 * Spec 021-T015 (RF-14, S-14a): bloquea capturas y grabación de pantalla mientras la pantalla está
 * montada (Android `FLAG_SECURE`; en iOS, grabación y capturas). Cada pantalla usa su propia
 * etiqueta: con una sola compartida (la de `usePreventScreenCapture`), al cerrar una pantalla
 * sensible se volverían a permitir las capturas aunque otra siga abierta debajo en la pila.
 * Si el dispositivo no lo admite, la pantalla sigue funcionando y no se registra nada (S-12c).
 */
export function useSensitiveScreen(): void {
  const key = useId();
  useEffect(() => {
    preventScreenCaptureAsync(key).catch(() => undefined);
    return () => {
      allowScreenCaptureAsync(key).catch(() => undefined);
    };
  }, [key]);
}
