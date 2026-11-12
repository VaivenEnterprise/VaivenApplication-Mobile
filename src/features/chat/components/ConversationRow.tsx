import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { listTime } from '@/features/chat/format';
import type { Conversation } from '@/features/chat/types';
import { es } from '@/i18n/es-MX';
import { colors, motion, radius, sizes, spacing } from '@/theme';

const t = es.chat.list;

type ConversationRowProps = {
  conversation: Conversation;
  currentUserId: string | null;
  onPress: (conversation: Conversation) => void;
  now?: Date;
};

/**
 * Fila de la lista de Mensajes (spec 008 §7.1): avatar, nombre (en negrita con no leídos), objeto,
 * último mensaje, hora y contador. Una conversación cerrada va en `muted` con candado.
 */
export function ConversationRow({
  conversation,
  currentUserId,
  onPress,
  now,
}: ConversationRowProps) {
  const { counterpart, item, lastMessage, unreadCount, canWrite } = conversation;
  const unread = unreadCount > 0;
  const closed = !canWrite;
  const preview =
    lastMessage === null
      ? t.noMessages
      : `${lastMessage.senderId === currentUserId ? t.youPrefix : ''}${lastMessage.preview}`;
  const time = lastMessage === null ? '' : listTime(lastMessage.at, now);
  const label = [
    counterpart.displayName,
    item.title,
    preview,
    unread ? `${unreadCount} ${t.unread}` : null,
    closed ? t.closed : null,
  ]
    .filter((part): part is string => part !== null)
    .join('. ');
  const ink = closed ? 'muted' : 'ink';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => onPress(conversation)}
      style={({ pressed }) => [
        styles.row,
        pressed ? { transform: [{ scale: motion.pressScale }] } : null,
      ]}
    >
      <Avatar name={counterpart.displayName} size="md" />
      <View style={styles.texts}>
        <AppText variant={unread ? 'bodyStrong' : 'body'} color={ink} numberOfLines={1}>
          {counterpart.displayName}
        </AppText>
        <View style={styles.item}>
          <AppIcon name="cube" size="sm" color="muted" />
          <AppText variant="caption" color="muted" numberOfLines={1} style={styles.title}>
            {item.title}
          </AppText>
        </View>
        <AppText variant="caption" color={unread ? 'ink' : 'muted'} numberOfLines={1}>
          {preview}
        </AppText>
      </View>
      <View style={styles.side}>
        <View style={styles.time}>
          {closed ? <AppIcon name="lock" size="sm" color="muted" /> : null}
          <AppText variant="caption" color="muted">
            {time}
          </AppText>
        </View>
        {unread ? (
          <View style={styles.badge}>
            <AppText variant="tab" color="onPrimary">
              {unreadCount > 99 ? '99+' : String(unreadCount)}
            </AppText>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smd,
    minHeight: sizes.touch.minSize,
    paddingVertical: spacing.smd,
  },
  texts: { flex: 1, gap: spacing.xs },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  title: { flex: 1 },
  side: { alignItems: 'flex-end', gap: spacing.xs },
  time: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  badge: {
    minWidth: sizes.chat.unreadBadge,
    height: sizes.chat.unreadBadge,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
