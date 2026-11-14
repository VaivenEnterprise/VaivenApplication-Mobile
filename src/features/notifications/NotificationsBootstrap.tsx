import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { usePathname, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { registerBeforeSignOut } from '@/features/auth/signOutHooks';
import { useSession } from '@/features/auth/useSession';
import { InAppBanner, type BannerContent } from '@/features/notifications/components/InAppBanner';
import { PushPrimer } from '@/features/notifications/components/PushPrimer';
import { notificationsKeys } from '@/features/notifications/keys';
import { configureForegroundHandler, unregisterDevice } from '@/features/notifications/push';
import { hrefOrCenter } from '@/features/notifications/routing';
import { useNotificationResponse } from '@/features/notifications/useNotificationResponse';
import {
  usePush,
  usePushPrimer,
  useRegisterWhenOn,
} from '@/features/notifications/usePushRegistration';

/** Cuánto permanece visible el aviso flotante (spec 011 §7.3). */
export const BANNER_VISIBLE_MS = 4_000;

/** Pantalla de escaneo de QR: ahí no se interrumpe con avisos (RF-04). */
const SCANNING_PATH = '/escanear';

type Shown = BannerContent & { data: unknown };

function toShown(notification: Notifications.Notification): Shown {
  const { title, body, data } = notification.request.content;
  return { title: title ?? '', body: body ?? '', data };
}

// Un solo manejador para toda la app (sin aviso del sistema con la app abierta).
configureForegroundHandler();

function SignedInBootstrap() {
  const router = useRouter();
  const pathname = usePathname();
  const client = useQueryClient();
  const push = usePush();
  const primer = usePushPrimer(push.status);
  const [shown, setShown] = useState<Shown | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanning = pathname.includes(SCANNING_PATH);

  useNotificationResponse();
  useRegisterWhenOn(push.status);

  // CA-06: al cerrar sesión el token se elimina del servidor antes de borrar la sesión local.
  useEffect(() => registerBeforeSignOut(unregisterDevice), []);

  const hide = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    setShown(null);
  }, []);

  // Con la app abierta llega un aviso: se refresca la lista y el conteo, y se muestra el banner.
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      void client.invalidateQueries({ queryKey: notificationsKeys.all });
      if (scanning) return;
      if (timer.current !== null) clearTimeout(timer.current);
      setShown(toShown(notification));
      timer.current = setTimeout(hide, BANNER_VISIBLE_MS);
    });
    return () => {
      subscription.remove();
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, [client, scanning, hide]);

  return (
    <>
      <PushPrimer
        visible={primer.visible}
        loading={push.busy}
        onEnable={() => {
          void push.enable();
        }}
        onLater={primer.dismiss}
      />
      {shown === null || scanning ? null : (
        <InAppBanner
          content={shown}
          onDismiss={hide}
          onPress={() => {
            router.push(hrefOrCenter(shown.data));
            hide();
          }}
        />
      )}
    </>
  );
}

/**
 * Punto único de conexión de las notificaciones con la app (plan §1): permiso y registro del token,
 * toques sobre una push, aviso flotante y baja del token al cerrar sesión. Se monta una sola vez
 * en el proveedor raíz y solo actúa con sesión iniciada.
 */
export function NotificationsBootstrap() {
  const { status } = useSession();
  return status === 'signedIn' ? <SignedInBootstrap /> : null;
}
