import { renderTopSections } from '@/features/recommendations';
import { ExploreScreen } from '@/features/search/screens/ExploreScreen';

/** Pestaña Explorar (spec 006): la pantalla vive en `features/search`; la 015 aporta «Recomendado para ti». */
export default function Screen() {
  return <ExploreScreen renderTopSections={renderTopSections} />;
}
