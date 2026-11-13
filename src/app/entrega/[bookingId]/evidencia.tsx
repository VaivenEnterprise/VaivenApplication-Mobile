import { useLocalSearchParams } from 'expo-router';
import { parseStageName } from '@/features/handover/types';
import { EvidenceScreen } from '@/features/handover/screens/EvidenceScreen';

/** Evidencia del estado del objeto antes de mostrar el QR (spec 009 §7.2). */
export default function Screen() {
  const { bookingId, stage } = useLocalSearchParams<{ bookingId: string; stage: string }>();
  return <EvidenceScreen bookingId={bookingId} stage={parseStageName(stage)} />;
}
