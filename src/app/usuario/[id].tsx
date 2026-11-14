import { useLocalSearchParams } from 'expo-router';
import { PublicProfileScreen } from '@/features/profile/screens/PublicProfileScreen';
import { ReputationSection } from '@/features/ratings';
import { ReportUserAction } from '@/features/reports';

/** Perfil público. La spec 010 aporta la reputación; la 011, el botón «Reportar» del encabezado. */
export default function PublicProfileRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <PublicProfileScreen
      id={id}
      renderReputation={(user) => <ReputationSection user={user} />}
      renderHeaderAction={(user) => <ReportUserAction userId={user.id} />}
    />
  );
}
