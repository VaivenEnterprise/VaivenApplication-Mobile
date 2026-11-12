import { useLocalSearchParams } from 'expo-router';
import { ProjectScreen } from '@/features/project-guide';

/** Proyecto guiado: herramientas, mapa del vecindario y paso a paso (spec 007 §7.1). */
export default function Screen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProjectScreen id={id} />;
}
