import { useRouter } from 'expo-router';
import { useMemo, type ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { SlotPlaceholder } from '@/components/SlotPlaceholder';
import { MessagesButton } from '@/components/navigation/MessagesButton';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { HomeItemTile } from '@/features/home/components/HomeItemTile';
import { useHome } from '@/features/home/hooks/useHomeRefresh';
import type { HomeItem } from '@/features/home/schemas';
import { PopularProjects } from '@/features/projects';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { colors, sizes, spacing } from '@/theme';

const t = es.inicio;
const SKELETON_TILES = 3;

type HomeScreenProps = {
  /** Kit sugerido (spec 007). Por defecto, un marcador. */
  renderKit?: () => ReactNode;
  /** Historial «Mis trabajos realizados» (spec 009). Por defecto, un marcador. */
  renderHistory?: () => ReactNode;
  /** Contenido extra bajo el saludo (p. ej. accesos de otras specs). */
  renderHeaderExtra?: () => ReactNode;
  /** Mensajes sin leer (spec 008). */
  unreadCount?: number;
};

function firstName(displayName: string): string {
  return displayName.trim().split(/\s+/)[0] ?? '';
}

/** Inicio (spec 003 §7.3): saludo, proyectos populares y objetos recién publicados. */
export function HomeScreen({
  renderKit,
  renderHistory,
  renderHeaderExtra,
  unreadCount = 0,
}: HomeScreenProps) {
  const router = useRouter();
  const { user, recent, refreshing, refresh } = useHome();
  const name = useMemo(() => (user === null ? '' : firstName(user.displayName)), [user]);
  const items: HomeItem[] = recent.data?.items ?? [];

  return (
    <Screen
      background="plain"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.profileA11y}
          onPress={() => router.push(routes.profile)}
        >
          <Avatar name={user?.displayName ?? ''} size="md" />
        </Pressable>
        <View style={styles.greeting}>
          <AppText variant="title" accessibilityRole="header" numberOfLines={1}>
            {`${t.greeting} ${name}`.trim()}
          </AppText>
          <AppText color="muted">{t.question}</AppText>
        </View>
        <MessagesButton badgeCount={unreadCount} />
      </View>

      {renderHeaderExtra?.()}

      {renderKit === undefined ? (
        <SlotPlaceholder title={t.kitTitle} hint={t.kitHint} icon="hammer" tone="warm" />
      ) : (
        renderKit()
      )}

      <Section title={t.popularProjects}>
        <PopularProjects />
      </Section>

      <Section
        title={t.recent}
        action={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t.seeAll} ${t.recent}`}
            onPress={() => router.push(routes.explore)}
            style={styles.seeAll}
          >
            <AppText variant="label" color="primaryInk">{`${t.seeAll} ›`}</AppText>
          </Pressable>
        }
      >
        {recent.isPending ? (
          <View testID="home-recent-loading" style={styles.row}>
            {Array.from({ length: SKELETON_TILES }, (_, index) => (
              <Skeleton key={index} shape="card" width={sizes.homeTile} />
            ))}
          </View>
        ) : recent.isError ? (
          <ErrorState error={recent.error} onRetry={() => void recent.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            compact
            icon="cube"
            title={t.emptyTitle}
            actionLabel={t.publish}
            onAction={() => router.push(routes.myItems)}
          />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}
          >
            {items.map((item) => (
              <HomeItemTile
                key={item.id}
                item={item}
                onPress={(selected) => router.push(routes.item(selected.id))}
              />
            ))}
          </ScrollView>
        )}
      </Section>

      {renderHistory === undefined ? (
        <SlotPlaceholder title={t.historyTitle} hint={t.historyHint} icon="check" tone="green" />
      ) : (
        renderHistory()
      )}
    </Screen>
  );
}

type SectionProps = { title: string; action?: ReactNode; children: ReactNode };

function Section({ title, action, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <AppText variant="subheading" accessibilityRole="header">
          {title}
        </AppText>
        {action}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.smd },
  greeting: { flex: 1 },
  section: { gap: spacing.smd },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seeAll: { minHeight: sizes.touch.minSize, justifyContent: 'center' },
  row: { flexDirection: 'row', gap: spacing.smd },
});
