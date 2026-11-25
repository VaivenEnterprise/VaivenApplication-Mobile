import { Divider } from '@/components/ui/Divider';
import { IncidentsRow } from '@/features/incidents';
import { NotificationsRow } from '@/features/notifications';
import { ClearHistoryRow } from '@/features/recommendations';
import { ProfileScreen } from '@/features/profile/screens/ProfileScreen';
import { ReputationSection } from '@/features/ratings';

/** Perfil propio. La spec 010 aporta la reputación y «Mis incidencias»; la 011, «Avisos»; la 015, «Borrar historial de recomendaciones». */
export default function ProfileRoute() {
  return (
    <ProfileScreen
      renderReputation={(user) => <ReputationSection user={user} />}
      renderExtraRows={() => (
        <>
          <NotificationsRow />
          <Divider />
          <IncidentsRow />
          <Divider />
          <ClearHistoryRow />
        </>
      )}
    />
  );
}
