import { Stack, useLocalSearchParams } from 'expo-router';
import { RequestScreen } from '@/features/bookings/screens/RequestScreen';

/** Hoja «Solicitar» sobre el detalle del objeto (spec 007 §7.3). */
export default function Screen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  return (
    <>
      <Stack.Screen options={{ presentation: 'transparentModal', animation: 'fade' }} />
      <RequestScreen itemId={itemId} />
    </>
  );
}
