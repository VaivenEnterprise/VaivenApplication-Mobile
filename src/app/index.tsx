import { Redirect } from 'expo-router';
import { useSession } from '@/features/auth/useSession';
import { routes } from '@/lib/routes';

/** Raíz «/»: envía a las pestañas con sesión o a inicio de sesión sin ella. */
export default function Index() {
  const { status } = useSession();
  return <Redirect href={status === 'signedIn' ? routes.home : routes.login} />;
}
