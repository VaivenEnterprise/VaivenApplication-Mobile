import type { ReactNode } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ItemCard, type ItemCardData } from '@/features/items';
import { es } from '@/i18n/es-MX';
import { colors, spacing } from '@/theme';

const t = es.search.state;
const COLUMNS = 2;
const SKELETON_CARDS = 6;
const FILLER = '__filler__';

type Row = ItemCardData | { id: typeof FILLER };

type ResultsListProps = {
  items: ItemCardData[];
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  onRetry: () => void;
  /** Hay texto o filtros: el vacío ofrece «Limpiar filtros» (CA-06). */
  searching: boolean;
  onClear: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  /** Falló la carga de la página siguiente (ya hay resultados en pantalla). */
  nextPageFailed: boolean;
  onEndReached: () => void;
  onSelect: (item: ItemCardData) => void;
  /** Contenido sobre las tarjetas: *slot* de recomendados, proyectos y títulos de sección. */
  header?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
};

function Cell({ row, onSelect }: { row: Row; onSelect: (item: ItemCardData) => void }) {
  if (row.id === FILLER) return <View style={styles.cell} />;
  return (
    <View style={styles.cell}>
      <ItemCard item={row as ItemCardData} onPress={onSelect} />
    </View>
  );
}

function SkeletonGrid() {
  return (
    <View testID="search-skeleton" accessibilityLabel={t.loading} style={styles.skeletons}>
      {Array.from({ length: SKELETON_CARDS }, (_, index) => (
        <View key={index} style={styles.skeletonCell}>
          <Skeleton shape="card" width="100%" />
        </View>
      ))}
    </View>
  );
}

/**
 * Cuadrícula de resultados de 2 columnas (spec 006 §7.1, RF-06, RNF-01): esqueleto de carga,
 * vacío con «Limpiar filtros», error con reintento y «cargando más» al final.
 */
export function ResultsList({
  items,
  isPending,
  isError,
  error,
  onRetry,
  searching,
  onClear,
  hasNextPage,
  isFetchingNextPage,
  nextPageFailed,
  onEndReached,
  onSelect,
  header,
  refreshing = false,
  onRefresh,
}: ResultsListProps) {
  const rows: Row[] = items.length % COLUMNS === 0 ? items : [...items, { id: FILLER }];

  const empty = (() => {
    if (isPending) return <SkeletonGrid />;
    if (isError) return <ErrorState error={error} onRetry={onRetry} />;
    return searching ? (
      <EmptyState
        icon="search"
        title={t.emptyTitle}
        description={t.emptyDescription}
        actionLabel={t.clearFilters}
        onAction={onClear}
      />
    ) : (
      <EmptyState icon="cube" title={t.emptyHomeTitle} description={t.emptyHomeDescription} />
    );
  })();

  const footer = (() => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.footer} testID="search-loading-more">
          <ActivityIndicator color={colors.primary} accessibilityLabel={t.loadingMore} />
        </View>
      );
    }
    if (nextPageFailed) {
      return (
        <View style={styles.footer}>
          <AppText color="muted">{t.loadMoreFailed}</AppText>
          <Button label={es.common.retry} variant="outline" onPress={onEndReached} />
        </View>
      );
    }
    return null;
  })();

  return (
    <FlatList
      testID="search-results"
      data={rows}
      numColumns={COLUMNS}
      keyExtractor={(row) => row.id}
      renderItem={({ item }) => <Cell row={item} onSelect={onSelect} />}
      columnWrapperStyle={styles.columns}
      ItemSeparatorComponent={Separator}
      ListHeaderComponent={
        header === undefined ? undefined : <View style={styles.header}>{header}</View>
      }
      ListEmptyComponent={empty}
      ListFooterComponent={footer ?? undefined}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage && !nextPageFailed) onEndReached();
      }}
      onEndReachedThreshold={0.5}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={styles.content}
      refreshControl={
        onRefresh === undefined ? undefined : (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        )
      }
    />
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.gutter, paddingBottom: spacing.xl },
  header: { gap: spacing.lg, paddingBottom: spacing.md },
  columns: { gap: spacing.smd },
  cell: { flex: 1 },
  separator: { height: spacing.md },
  skeletons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.smd },
  skeletonCell: { flexBasis: '47%', flexGrow: 1 },
  footer: { paddingVertical: spacing.md, alignItems: 'center', gap: spacing.sm },
});
