import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { AppText } from '@/components/ui/AppText';
import { ErrorState } from '@/components/ui/ErrorState';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { LoadingState } from '@/components/ui/LoadingState';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Skeleton } from '@/components/ui/Skeleton';
import { BookingCard } from '@/features/bookings/components/BookingCard';
import { useMyBookings } from '@/features/bookings/hooks';
import { statusGroup, type StatusGroup } from '@/features/bookings/rules';
import type { Booking, ListRole } from '@/features/bookings/types';
import { ChoiceChip } from '@/features/items';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { colors, spacing } from '@/theme';

const t = es.bookings.activity;

type Filter = 'all' | StatusGroup;

const ROLES = [
  { value: 'requester', label: t.requester },
  { value: 'owner', label: t.owner },
] as const;

const FILTERS: readonly { value: Filter; label: string }[] = [
  { value: 'all', label: t.filterAll },
  { value: 'inProgress', label: t.filterInProgress },
  { value: 'pending', label: t.filterPending },
  { value: 'done', label: t.filterDone },
];

/** Con un filtro activo, mientras no haya coincidencias se sigue pidiendo páginas. */
const matches = (booking: Booking, filter: Filter) =>
  filter === 'all' || statusGroup(booking.status) === filter;

/**
 * Actividad (spec 007 §7.4, RF-10, CA-04): lo que pido («Solicito») y lo que presto («Presto»),
 * con filtro por grupo de estado, paginación por cursor, vacíos y error con reintento. El filtro
 * se aplica en el cliente porque «En curso» agrupa dos estados del servidor (plan P-08).
 */
export function ActivityScreen() {
  const router = useRouter();
  const [role, setRole] = useState<ListRole>('requester');
  const [filter, setFilter] = useState<Filter>('all');
  const query = useMyBookings(role);
  const all = query.data?.pages.flatMap((page) => page.items) ?? [];
  const items = all.filter((booking) => matches(booking, filter));

  const { hasNextPage, isFetchingNextPage, isError, fetchNextPage } = query;
  useEffect(() => {
    if (filter !== 'all' && items.length === 0 && hasNextPage && !isFetchingNextPage && !isError) {
      void fetchNextPage();
    }
  }, [filter, items.length, hasNextPage, isFetchingNextPage, isError, fetchNextPage]);

  const open = (booking: Booking) => router.push(routes.booking(booking.id));

  const empty = (() => {
    if (query.isPending || (filter !== 'all' && hasNextPage && !isError)) {
      return (
        <View style={styles.skeletons} testID="activity-skeleton">
          <Skeleton shape="card" width="100%" />
          <Skeleton shape="card" width="100%" />
          <Skeleton shape="card" width="100%" />
        </View>
      );
    }
    if (query.isError) {
      return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
    }
    if (filter !== 'all') {
      return (
        <EmptyState
          icon="swap"
          title={t.emptyFilteredTitle}
          description={t.emptyFilteredDescription}
        />
      );
    }
    return role === 'requester' ? (
      <EmptyState
        icon="swap"
        title={t.emptyRequesterTitle}
        description={t.emptyRequesterDescription}
        actionLabel={t.emptyRequesterAction}
        onAction={() => router.push(routes.explore)}
      />
    ) : (
      <EmptyState icon="swap" title={t.emptyOwnerTitle} description={t.emptyOwnerDescription} />
    );
  })();

  const changeRole = (next: ListRole) => {
    setRole(next);
    setFilter('all');
  };

  return (
    <GradientBackground variant="plain">
      <SafeAreaView style={styles.fill}>
        <FlatList
          testID="activity-list"
          data={items}
          keyExtractor={(booking) => booking.id}
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
              <AppText variant="title" accessibilityRole="header">
                {t.title}
              </AppText>
              <SegmentedControl options={ROLES} value={role} onChange={changeRole} />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                accessibilityLabel={t.filterLabel}
                contentContainerStyle={styles.filters}
              >
                {FILTERS.map(({ value, label }) => (
                  <ChoiceChip
                    key={value}
                    label={label}
                    selected={filter === value}
                    onPress={() => setFilter(value)}
                  />
                ))}
              </ScrollView>
            </View>
          }
          renderItem={({ item }) => <BookingCard booking={item} onPress={open} />}
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
  content: { paddingHorizontal: spacing.gutter, paddingBottom: spacing.xl },
  header: { gap: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.md },
  filters: { gap: spacing.sm },
  separator: { height: spacing.smd },
  skeletons: { gap: spacing.smd },
});
