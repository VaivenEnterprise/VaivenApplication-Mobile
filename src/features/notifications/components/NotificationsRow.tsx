import { useRouter } from 'expo-router';
import { IconBadge } from '@/components/ui/IconBadge';
import { ListRow } from '@/components/ui/ListRow';
import { UnreadBadge } from '@/features/notifications/components/UnreadBadge';
import { useUnreadNotifications } from '@/features/notifications/hooks';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';

/** Fila «Avisos» del perfil (`renderExtraRows` de 003, spec 011 RF-01, RF-02) con la insignia de no leídos. */
export function NotificationsRow() {
  const router = useRouter();
  const unread = useUnreadNotifications();
  return (
    <ListRow
      title={es.notifications.profileRow}
      leading={<IconBadge icon="bell" />}
      trailing={unread > 0 ? <UnreadBadge count={unread} /> : undefined}
      onPress={() => router.push(routes.notifications)}
    />
  );
}
