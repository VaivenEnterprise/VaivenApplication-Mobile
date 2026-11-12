import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { formatClock } from '@/features/chat/format';
import type { ChatMessage } from '@/features/chat/merge';
import { es } from '@/i18n/es-MX';
import { colors, radius, sizes, spacing } from '@/theme';

const m = es.chat.message;

type MessageBubbleProps = {
  message: ChatMessage;
  onRetry: (clientId: string) => void;
};

/**
 * Burbuja del chat (spec 008 §7.2): propias a la derecha en `primary`, ajenas a la izquierda en
 * `surface` con borde. La hora va dentro; un mensaje que aún se envía lleva reloj y hora tenue, y
 * uno que falló, aviso «No enviado» con «Reintentar» (RF-03). El texto es siempre texto plano.
 */
export function MessageBubble({ message, onRetry }: MessageBubbleProps) {
  const { mine, status, body, clientId } = message;
  const time = formatClock(message.createdAt);
  const ink = mine ? 'onPrimary' : 'ink';
  const statusText = status === 'sending' ? m.sending : status === 'failed' ? m.notSent : '';
  const label = [mine ? m.mine : null, `${body}`, time, statusText || null]
    .filter((part): part is string => part !== null && part !== '')
    .join(', ');

  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowOther]}>
      <View
        accessible
        accessibilityLabel={label}
        style={[
          styles.bubble,
          mine ? styles.bubbleMine : styles.bubbleOther,
          mine ? styles.cornerMine : styles.cornerOther,
        ]}
      >
        <AppText color={ink}>{body}</AppText>
        <View style={styles.meta}>
          {status === 'sending' ? <AppIcon name="clock" size="sm" color={ink} /> : null}
          <AppText variant="caption" color={ink}>
            {time}
          </AppText>
        </View>
      </View>
      {status === 'failed' && clientId !== null ? (
        <View style={styles.failed}>
          <AppIcon name="danger" size="sm" color="danger" />
          <AppText variant="caption" color="danger">
            {m.notSent}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={m.retryA11y}
            onPress={() => onRetry(clientId)}
            hitSlop={spacing.sm}
            style={styles.retry}
          >
            <AppText variant="label" color="primaryInk">
              {m.retry}
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { maxWidth: sizes.chat.bubbleMaxWidth, gap: spacing.xs },
  rowMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  rowOther: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.smd,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  bubbleMine: { backgroundColor: colors.primary },
  bubbleOther: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cornerMine: { borderBottomRightRadius: radius.sm },
  cornerOther: { borderBottomLeftRadius: radius.sm },
  meta: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: spacing.xs },
  failed: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  retry: {
    minHeight: sizes.touch.minSize,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
});
