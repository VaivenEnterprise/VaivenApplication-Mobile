import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { ErrorState } from '@/components/ui/ErrorState';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { LoadingState } from '@/components/ui/LoadingState';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Skeleton } from '@/components/ui/Skeleton';
import { ItemCard } from '@/features/items/components/ItemCard';
import { toCardData, type ItemCardData } from '@/features/items/format';
import { useMyItems } from '@/features/items/hooks';
import type { MyItemsFilter } from '@/features/items/types';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { colors, radius, shadows, sizes, spacing } from '@/theme';

const t = es.items.list;
type Filter = 'all' | MyItemsFilter;

const OPTIONS = [
  { value: 'all', label: t.filterAll },
  { value: 'active', label: t.filterActive },
  { value: 'paused', label: t.filterPaused },
] as const;

function RowSkeleton() {
  return (
    <View style={styles.skeletonRow} testID="my-items-skeleton">
      <Skeleton shape="line" width={sizes.thumbLg} />
      <View style={styles.skeletonTexts}>
        <Skeleton shape="line" width="70%" />
        <Skeleton shape="line" width="40%" />
      </View>
    </View>
  );
}

/** Mis objetos (spec 005 §7.1, RF-01): lista paginada con filtro por estado y acción para publicar. */
export function MyItemsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const query = useMyItems(filter === 'all' ? undefined : filter);
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];

  const open = (item: ItemCardData) => router.push(routes.item(item.id));
  const publish = () => router.push(routes.newItem);

  const empty = (() => {
    if (query.isPending) {
      return (
        <View style={styles.skeletons}>
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </View>
      );
    }
    if (query.isError) {
      return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
    }
    if (filter !== 'all') {
      return (
        <EmptyState
          icon="cube"
          title={t.emptyFilteredTitle}
          description={t.emptyFilteredDescription}
        />
      );
    }
    return (
      <EmptyState
        icon="cube"
        title={t.emptyTitle}
        description={t.emptyDescription}
        actionLabel={t.emptyAction}
        onAction={publish}
      />
    );
  })();

  return (
    <GradientBackground variant="plain">
      <SafeAreaView style={styles.fill}>
        <FlatList
          testID="my-items-list"
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          ItemSeparatorComponent={Separator}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !query.isFetchingNextPage}
              onRefresh={() => void query.refetch()}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <AppText variant="title" accessibilityRole="header" style={styles.title}>
                  {t.title}
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.publish}
                  onPress={publish}
                  style={styles.add}
                >
                  <AppIcon name="add" size="lg" color="onPrimary" />
                </Pressable>
              </View>
              <SegmentedControl options={OPTIONS} value={filter} onChange={setFilter} />
            </View>
          }
          renderItem={({ item }) => (
            <ItemCard item={toCardData(item)} variant="row" onPress={open} />
          )}
          ListEmptyComponent={empty}
          ListFooterComponent={
            query.isFetchingNextPage ? <LoadingState label={t.loadingMore} /> : undefined
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
        />
      </SafeAreaView>
    </GradientBackground>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: spacing.gutter, paddingBottom: spacing.xl, flexGrow: 1 },
  header: { gap: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { flex: 1 },
  add: {
    width: sizes.roundButton,
    height: sizes.roundButton,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  separator: { height: spacing.smd },
  skeletons: { gap: spacing.smd },
  skeletonRow: {
    flexDirection: 'row',
    gap: spacing.smd,
    padding: spacing.smd,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  skeletonTexts: { flex: 1, gap: spacing.sm },
});
