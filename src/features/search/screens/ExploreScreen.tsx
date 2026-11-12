import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useEffectEvent, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { type ItemCardData } from '@/features/items';
import { PopularProjects, ProjectCard, matchProjects, type Project } from '@/features/projects';
import { flattenPages } from '@/features/search/cards';
import { CategoryChips } from '@/features/search/components/CategoryChips';
import { FilterSheet } from '@/features/search/components/FilterSheet';
import { ResultsList } from '@/features/search/components/ResultsList';
import { ExploreSearchBar } from '@/features/search/components/SearchBar';
import {
  activeFilterCount,
  clearAll,
  effectiveText,
  filtersToParams,
  type FilterParams,
  isSearching,
  paramsToFilters,
  toQueryString,
} from '@/features/search/filters';
import { useDebouncedValue, useSearchItems } from '@/features/search/hooks';
import type { SearchFilters } from '@/features/search/types';
import { useLocation } from '@/features/search/useLocation';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { spacing } from '@/theme';

const t = es.search;

type RouteParams = { setParams: (params: FilterParams) => void };

type ExploreScreenProps = {
  /** *Slot* sobre la lista del inicio de Explorar: «Recomendado para ti» (spec 015). */
  renderTopSections?: () => ReactNode;
};

/**
 * Explorar (spec 006 §7.1): barra de búsqueda, chips de categoría y cuadrícula de resultados.
 * Los filtros viven en los *search params* de la ruta (RF-05, plan P-01); así, al volver del
 * detalle se conservan el texto, los filtros y la posición de la lista (CA-05).
 */
export function ExploreScreen({ renderTopSections }: ExploreScreenProps) {
  const router = useRouter();
  // `setParams` de esta ruta (no del `router`): una escritura tardía del texto no cae en el detalle.
  const navigation = useNavigation() as unknown as RouteParams;
  const params = useLocalSearchParams();
  const filters = paramsToFilters(params);

  const update = (patch: Partial<SearchFilters>) =>
    navigation.setParams(filtersToParams({ ...filters, ...patch }));

  // El texto se escribe sin demora; a la ruta (y a la consulta) llega tras 400 ms sin teclear (CA-02).
  const [text, setText] = useState(filters.q);
  const debounced = useDebouncedValue(text);
  const syncText = useEffectEvent((value: string) => {
    if (value !== filters.q) update({ q: value });
  });
  useEffect(() => {
    syncText(debounced);
  }, [debounced]);

  const [filtersOpen, setFiltersOpen] = useState(false);

  // Distancia (RF-04): la posición vive solo en memoria y viaja redondeada en la consulta.
  const location = useLocation();
  const { availability, coords, locating, locate } = location;
  const waitingForPosition = filters.radiusKm !== null && coords === null;
  const resolveRadius = useEffectEvent(() => {
    if (filters.radiusKm === null || coords !== null) return;
    if (availability === 'unavailable') update({ radiusKm: null });
    else if (availability === 'available' && !locating) void locate();
  });
  useEffect(() => {
    resolveRadius();
  }, [availability, coords, locating, filters.radiusKm]);

  const search = useSearchItems(toQueryString(filters, coords), { enabled: !waitingForPosition });
  const items = flattenPages(search.data?.pages);
  const searching = isSearching(filters);
  const projects = searching ? matchProjects(effectiveText(filters.q)) : [];

  const clear = () => {
    setText('');
    navigation.setParams(filtersToParams(clearAll()));
  };
  const openItem = (item: ItemCardData) => router.push(routes.item(item.id));
  const openProject = (project: Project) => router.push(routes.project(project.id));

  const header = searching ? (
    projects.length === 0 ? undefined : (
      <View style={styles.projects}>
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} variant="wide" onPress={openProject} />
        ))}
      </View>
    )
  ) : (
    <>
      {renderTopSections?.()}
      <Section title={t.popularProjects}>
        <PopularProjects onSelect={openProject} />
      </Section>
      <AppText variant="subheading" accessibilityRole="header">
        {t.nearYou}
      </AppText>
    </>
  );

  return (
    <GradientBackground variant="plain">
      <SafeAreaView style={styles.fill}>
        <View style={styles.fixed}>
          <ExploreSearchBar
            value={text}
            onChangeText={setText}
            onOpenFilters={() => setFiltersOpen(true)}
            activeFilters={activeFilterCount(filters)}
          />
          <CategoryChips value={filters.category} onChange={(category) => update({ category })} />
        </View>
        <ResultsList
          items={items}
          isPending={search.isPending || waitingForPosition}
          isError={search.isError && !search.isFetchNextPageError}
          error={search.error}
          onRetry={() => void search.refetch()}
          searching={searching}
          onClear={clear}
          hasNextPage={search.hasNextPage}
          isFetchingNextPage={search.isFetchingNextPage}
          nextPageFailed={search.isFetchNextPageError}
          onEndReached={() => void search.fetchNextPage()}
          onSelect={openItem}
          header={header}
          refreshing={search.isRefetching && !search.isFetchingNextPage}
          onRefresh={() => void search.refetch()}
        />
        <FilterSheet
          visible={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          filters={filters}
          onApply={(applied) => update({ ...applied, q: filters.q })}
          location={location}
        />
      </SafeAreaView>
    </GradientBackground>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="subheading" accessibilityRole="header">
        {title}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  fixed: {
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.smd,
  },
  projects: { gap: spacing.smd },
  section: { gap: spacing.smd },
});
