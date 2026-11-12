import { useRouter } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { ErrorState } from '@/components/ui/ErrorState';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { LoadingState } from '@/components/ui/LoadingState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useSession } from '@/features/auth/useSession';
import { ConversationRow } from '@/features/chat/components/ConversationRow';
import { useConversations, useConversationsSync } from '@/features/chat/hooks';
import type { Conversation } from '@/features/chat/types';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.chat;

/**
 * Mensajes (spec 008 §7.1, RF-01): mis conversaciones con la otra persona, el objeto, el último
 * mensaje, la hora y los no leídos. Se renueva cada 20 s con la pantalla abierta y la app activa.
 */
export function ConversationsScreen() {
  const router = useRouter();
  const { user } = useSession();
  const query = useConversations();
  useConversationsSync();
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  const open = (conversation: Conversation) => router.push(routes.chat(conversation.id));

  const empty = (() => {
    if (query.isPending) {
      return (
        <View
          style={styles.skeletons}
          testID="conversations-skeleton"
          accessibilityLabel={t.list.skeleton}
        >
          <Skeleton shape="card" width="100%" />
          <Skeleton shape="card" width="100%" />
          <Skeleton shape="card" width="100%" />
        </View>
      );
    }
    if (query.isError) {
      return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
    }
    return (
      <EmptyState icon="chat" title={t.list.emptyTitle} description={t.list.emptyDescription} />
    );
  })();

  return (
    <GradientBackground variant="plain">
      <SafeAreaView style={styles.fill}>
        <FlatList
          testID="conversations-list"
          data={items}
          keyExtractor={(conversation) => conversation.id}
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
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={es.common.back}
                onPress={() => router.back()}
                style={styles.round}
              >
                <AppIcon name="arrowBack" />
              </Pressable>
              <AppText variant="title" accessibilityRole="header">
                {t.title}
              </AppText>
            </View>
          }
          renderItem={({ item }) => (
            <ConversationRow conversation={item} currentUserId={user?.id ?? null} onPress={open} />
          )}
          ListEmptyComponent={empty}
          ListFooterComponent={
            query.isFetchingNextPage ? <LoadingState label={es.common.loading} /> : undefined
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
  round: {
    width: sizes.roundButton,
    height: sizes.roundButton,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  skeletons: { gap: spacing.smd },
});
