import { useLocalSearchParams } from 'expo-router';
import { PublicProfileScreen } from '@/features/profile/screens/PublicProfileScreen';

/** Perfil público. Las specs 010 y 011 pasan aquí la reputación y el menú «⋯» (`render…`). */
export default function PublicProfileRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PublicProfileScreen id={id} />;
}
