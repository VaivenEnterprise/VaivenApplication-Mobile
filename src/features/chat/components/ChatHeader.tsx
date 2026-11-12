import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/features/bookings';
import type { Conversation } from '@/features/chat/types';
import { es } from '@/i18n/es-MX';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.chat;

type ChatHeaderProps = {
  conversation: Conversation;
  onBack: () => void;
  /** Tocar el encabezado abre el detalle de la reserva. */
  onOpenBooking: () => void;
};

/** Encabezado del chat (spec 008 §7.2): volver, la otra persona, el objeto y el estado de la reserva. */
export function ChatHeader({ conversation, onBack, onOpenBooking }: ChatHeaderProps) {
  const { counterpart, item } = conversation;
  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={es.common.back}
        onPress={onBack}
        style={styles.round}
      >
        <AppIcon name="arrowBack" />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${counterpart.displayName}, ${item.title}. ${t.header.openBooking}`}
        onPress={onOpenBooking}
        style={styles.info}
      >
        <Avatar name={counterpart.displayName} size="sm" />
        <View style={styles.texts}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {counterpart.displayName}
          </AppText>
          <View style={styles.item}>
            <View style={styles.thumb}>
              {item.thumbUrl ? (
                <Image
                  source={{ uri: item.thumbUrl }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <AppIcon name="cube" size="sm" color="muted" />
              )}
            </View>
            <AppText variant="caption" color="muted" numberOfLines={1} style={styles.title}>
              {item.title}
            </AppText>
          </View>
        </View>
        <StatusBadge status={conversation.bookingStatus} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.gutter,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  round: {
    width: sizes.roundButton,
    height: sizes.roundButton,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    minHeight: sizes.touch.minSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  texts: { flex: 1, gap: spacing.xs },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  thumb: {
    width: sizes.chat.headerThumb,
    height: sizes.chat.headerThumb,
    borderRadius: radius.sm,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  title: { flex: 1 },
});
