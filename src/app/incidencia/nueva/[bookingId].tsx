import { useLocalSearchParams } from 'expo-router';
import { ReportIncidentScreen } from '@/features/incidents/screens/ReportIncidentScreen';

/** Reportar una incidencia de una reserva (spec 010 §7.3). */
export default function ReportIncidentRoute() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  return <ReportIncidentScreen bookingId={bookingId} />;
}
