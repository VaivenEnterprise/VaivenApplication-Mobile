import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/features/auth/useSession';
import type { Item } from '@/features/items';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';

type RequestButtonProps = { item: Pick<Item, 'id' | 'status' | 'owner'> };

/**
 * «Solicitar» del detalle del objeto (spec 007 §7.2). No aparece si el objeto es de quien lo mira
 * ni si no está activo: el servidor lo rechazaría (403 / 409) y la persona no ganaría nada.
 */
export function RequestButton({ item }: RequestButtonProps) {
  const router = useRouter();
  const { user } = useSession();
  if (item.status !== 'active' || (user !== null && item.owner.id === user.id)) return null;
  return (
    <Button
      label={es.bookings.request.button}
      onPress={() => router.push(routes.request(item.id))}
    />
  );
}
