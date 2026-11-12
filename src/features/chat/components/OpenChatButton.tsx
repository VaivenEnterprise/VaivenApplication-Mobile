import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import type { Booking } from '@/features/bookings';
import { useConversations } from '@/features/chat/hooks';
import { findConversation } from '@/features/chat/merge';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { colors, motion, radius, sizes, spacing } from '@/theme';

const t = es.chat.section;

type OpenChatButtonProps = { booking: Booking };

/**
 * Sección «chat» del detalle de la reserva (RF-09, RF-10; *slot* de 007): botón «Abrir chat» con
 * el último mensaje y los no leídos. Si la reserva todavía no tiene conversación
 * (`conversationId` vacío) no se pinta nada.
 */
export function OpenChatButton({ booking }: OpenChatButtonProps) {
  const router = useRouter();
  const conversationId = booking.conversationId;
  const query = useConversations();
  if (conversationId === null || conversationId === undefined) return null;

  const conversation = findConversation(query.data, conversationId);
  const unread = conversation?.unreadCount ?? 0;
  const summary = conversation?.lastMessage?.preview ?? t.noMessages;
  const label = [t.openA11y, unread > 0 ? `${unread} ${t.unread}` : null]
    .filter((part): part is string => part !== null)
    .join(', ');

  return (
    <Card variant="muted" style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => router.push(routes.chat(conversationId))}
        style={({ pressed }) => [
          styles.row,
          pressed ? { transform: [{ scale: motion.pressScale }] } : null,
        ]}
      >
        <AppIcon name="chat" color="primaryInk" />
        <View style={styles.texts}>
          <AppText variant="bodyStrong">{t.open}</AppText>
          <AppText variant="caption" color="muted" numberOfLines={1}>
            {summary}
          </AppText>
        </View>
        {unread > 0 ? (
          <View style={styles.badge}>
            <AppText variant="tab" color="onPrimary">
              {unread > 99 ? '99+' : String(unread)}
            </AppText>
          </View>
        ) : null}
        <AppIcon name="chevronForward" size="sm" color="muted" />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smd,
    minHeight: sizes.touch.minSize,
  },
  texts: { flex: 1, gap: spacing.xs },
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
