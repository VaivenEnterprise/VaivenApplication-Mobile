import { useLocalSearchParams } from 'expo-router';
import { BookingDetailScreen } from '@/features/bookings/screens/BookingDetailScreen';

/** Detalle de una solicitud o reserva (spec 007 §7.5). */
export default function Screen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <BookingDetailScreen id={id} />;
}
