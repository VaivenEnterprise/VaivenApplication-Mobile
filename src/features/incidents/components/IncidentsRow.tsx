import { useRouter } from 'expo-router';
import { IconBadge } from '@/components/ui/IconBadge';
import { ListRow } from '@/components/ui/ListRow';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';

/** Fila «Mis incidencias» del perfil (`renderExtraRows` de 003, spec 010 RF-07). */
export function IncidentsRow() {
  const router = useRouter();
  return (
    <ListRow
      title={es.incidents.profileRow}
      leading={<IconBadge icon="danger" tone="warning" />}
      onPress={() => router.push(routes.incidents)}
    />
  );
}
