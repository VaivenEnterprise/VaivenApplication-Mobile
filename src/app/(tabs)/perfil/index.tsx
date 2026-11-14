import { IncidentsRow } from '@/features/incidents';
import { ProfileScreen } from '@/features/profile/screens/ProfileScreen';
import { ReputationSection } from '@/features/ratings';

/** Perfil propio. La spec 010 aporta la reputación y «Mis incidencias»; 011 y 015 sumarán filas. */
export default function ProfileRoute() {
  return (
    <ProfileScreen
      renderReputation={(user) => <ReputationSection user={user} />}
      renderExtraRows={() => <IncidentsRow />}
    />
  );
}
