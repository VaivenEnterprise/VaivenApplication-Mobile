import { useLocalSearchParams } from 'expo-router';
import { IncidentDetailScreen } from '@/features/incidents/screens/IncidentDetailScreen';

/** Detalle de una incidencia (spec 010 §7.4). */
export default function IncidentDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <IncidentDetailScreen id={id} />;
}
