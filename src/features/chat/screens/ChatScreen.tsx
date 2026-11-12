import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { ErrorState } from '@/components/ui/ErrorState';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { LoadingState } from '@/components/ui/LoadingState';
import { useSession } from '@/features/auth/useSession';
import { ChatHeader } from '@/features/chat/components/ChatHeader';
import { Composer } from '@/features/chat/components/Composer';
import { DaySeparator } from '@/features/chat/components/DaySeparator';
import { MessageBubble } from '@/features/chat/components/MessageBubble';
import { RejectionNotice } from '@/features/chat/components/RejectionNotice';
import {
  useChatSync,
  useConversations,
  useMarkRead,
  useMessages,
  useOutbox,
} from '@/features/chat/hooks';
import {
  findConversation,
  mergeMessages,
  withDaySeparators,
  type ChatEntry,
} from '@/features/chat/merge';
import { es } from '@/i18n/es-MX';
import { ApiError } from '@/lib/api/errors';
import { routes } from '@/lib/routes';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.chat;

type ChatScreenProps = { id: string };

/**
 * Chat de una reserva (spec 008 §7.2, RF-02 a RF-08): mensajes cronológicos con los recientes
 * abajo (lista invertida), envío optimista con reintento, carga de anteriores al subir, marca de
 * leído al abrir y consulta periódica cada 5 s. Con `canWrite` falso el campo se reemplaza por un
 * aviso de conversación cerrada.
 */
export function ChatScreen({ id }: ChatScreenProps) {
  const router = useRouter();
  const { user } = useSession();
  const userId = user?.id ?? null;
  const conversations = useConversations();
  const messages = useMessages(id);
  const [text, setText] = useState('');
  const outbox = useOutbox(id, setText);
  const { mutate: markRead } = useMarkRead(id);
  useChatSync(id, userId);

  // Al abrir el chat se marca como leído y baja el contador (RF-05, CA-05).
  useEffect(() => {
    markRead();
  }, [id, markRead]);

  const conversation = findConversation(conversations.data, id);
  // La conversación sale de la lista: si aún no aparece, se pide la siguiente página.
  const { hasNextPage, isFetchingNextPage, isError, fetchNextPage } = conversations;
  useEffect(() => {
    if (conversation === undefined && hasNextPage && !isFetchingNextPage && !isError) {
      void fetchNextPage();
    }
  }, [conversation, hasNextPage, isFetchingNextPage, isError, fetchNextPage]);

  const server = useMemo(
    () => messages.data?.pages.flatMap((page) => page.items) ?? [],
    [messages.data],
  );
  const entries = useMemo(
    () => withDaySeparators(mergeMessages(server, outbox.pending, userId ?? '')),
    [server, outbox.pending, userId],
  );

  const send = useCallback(() => {
    if (outbox.send(text)) setText('');
  }, [outbox, text]);

  const back = useCallback(() => router.back(), [router]);

  const header =
    conversation === undefined ? (
      <View style={styles.simpleHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={es.common.back}
          onPress={back}
          style={styles.round}
        >
          <AppIcon name="arrowBack" />
        </Pressable>
      </View>
    ) : (
      <ChatHeader
        conversation={conversation}
        onBack={back}
        onOpenBooking={() => router.push(routes.booking(conversation.bookingId))}
      />
    );

  const closed =
    outbox.rejection?.kind === 'closed' || (conversation !== undefined && !conversation.canWrite);

  const body = (() => {
    if (messages.isPending) return <LoadingState variant="card" />;
    if (messages.isError && server.length === 0) {
      const notFound = messages.error instanceof ApiError && messages.error.status === 404;
      return notFound ? (
        <EmptyState
          icon="chat"
          title={t.chat.notFound}
          actionLabel={es.common.back}
          onAction={back}
        />
      ) : (
        <ErrorState error={messages.error} onRetry={() => void messages.refetch()} />
      );
    }
    if (entries.length === 0) {
      return (
        <EmptyState
          icon="chat"
          title={t.chat.emptyTitle}
          description={closed ? undefined : t.chat.emptyDescription}
        />
      );
    }
    return (
      <FlatList
        testID="chat-list"
        inverted
        data={entries}
        keyExtractor={(entry) => entry.key}
        renderItem={({ item }) => renderEntry(item, outbox.retry)}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (messages.hasNextPage && !messages.isFetchingNextPage) void messages.fetchNextPage();
        }}
        ListFooterComponent={
          messages.isFetchingNextPage ? <LoadingState label={t.message.olderLoading} /> : undefined
        }
      />
    );
  })();

  return (
    <GradientBackground variant="plain">
      <SafeAreaView style={styles.fill}>
        <KeyboardAvoidingView style={styles.fill} behavior="padding">
          {header}
          <View style={styles.fill}>{body}</View>
          {closed ? (
            <View
              style={styles.closed}
              accessible
              accessibilityLabel={`${t.chat.closedBar}. ${t.chat.closedHint}`}
            >
              <AppIcon name="lock" color="muted" />
              <AppText variant="label" color="muted">
                {t.chat.closedBar}
              </AppText>
            </View>
          ) : (
            <>
              {outbox.rejection === null ? null : (
                <RejectionNotice rejection={outbox.rejection} onDismiss={outbox.dismissRejection} />
              )}
              <Composer
                value={text}
                onChangeText={setText}
                onSend={send}
                sending={outbox.sending}
              />
            </>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}

function renderEntry(entry: ChatEntry, onRetry: (clientId: string) => void) {
  return entry.type === 'day' ? (
    <DaySeparator iso={entry.iso} />
  ) : (
    <MessageBubble message={entry.message} onRetry={onRetry} />
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  list: { paddingHorizontal: spacing.gutter, paddingVertical: spacing.md, gap: spacing.sm },
  simpleHeader: { paddingHorizontal: spacing.gutter, paddingVertical: spacing.sm },
  round: {
    width: sizes.roundButton,
    height: sizes.roundButton,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.gutter,
  },
});
