import { useLocalSearchParams } from 'expo-router';
import { PublicProfileScreen } from '@/features/profile/screens/PublicProfileScreen';
import { ReputationSection } from '@/features/ratings';

/** Perfil público. La spec 010 aporta la reputación; la 011 sumará el menú «⋯» (`renderHeaderAction`). */
export default function PublicProfileRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <PublicProfileScreen id={id} renderReputation={(user) => <ReputationSection user={user} />} />
  );
}
