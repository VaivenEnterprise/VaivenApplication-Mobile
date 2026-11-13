import { useLocalSearchParams } from 'expo-router';
import { QrScreen } from '@/features/handover/screens/QrScreen';
import { parseStageName } from '@/features/handover/types';

/** Mostrar el QR de entrega o devolución (spec 009 §7.3). */
export default function Screen() {
  const { bookingId, stage } = useLocalSearchParams<{ bookingId: string; stage: string }>();
  return <QrScreen bookingId={bookingId} stage={parseStageName(stage)} />;
}
