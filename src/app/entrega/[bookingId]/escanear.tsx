import { useLocalSearchParams } from 'expo-router';
import { ScanScreen } from '@/features/handover/screens/ScanScreen';
import { parseStageName } from '@/features/handover/types';

/** Escanear el QR de entrega o devolución (spec 009 §7.4). */
export default function Screen() {
  const { bookingId, stage } = useLocalSearchParams<{ bookingId: string; stage: string }>();
  return <ScanScreen bookingId={bookingId} stage={parseStageName(stage)} />;
}
