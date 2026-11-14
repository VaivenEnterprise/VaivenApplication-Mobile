import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { hrefOrCenter } from '@/features/notifications/routing';

/** Clave estable de un toque, para no abrir dos veces la misma push (arranque en frío + oyente). */
function responseKey(response: Notifications.NotificationResponse): string {
  return `${response.notification.request.identifier}:${response.actionIdentifier}`;
}

/**
 * Abre el destino de una push al tocarla (RF-05, CA-02, plan P-04): con la app abierta o en segundo
 * plano por el oyente; con la app cerrada, leyendo el último toque al montar. Si `data` no trae un
 * destino válido se abre el centro de avisos. Solo se monta con sesión iniciada.
 */
export function useNotificationResponse(): void {
  const router = useRouter();
  const handled = useRef(new Set<string>());

  useEffect(() => {
    const open = (response: Notifications.NotificationResponse) => {
      const key = responseKey(response);
      if (handled.current.has(key)) return;
      handled.current.add(key);
      router.push(hrefOrCenter(response.notification.request.content.data));
      Notifications.clearLastNotificationResponse();
    };
    const last = Notifications.getLastNotificationResponse();
    if (last !== null) open(last);
    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    return () => subscription.remove();
  }, [router]);
}
