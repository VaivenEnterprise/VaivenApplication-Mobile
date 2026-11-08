import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import type { ChatMessage } from '@/lib/domain/models';
import { borders, colors, radius, spacing } from '@/theme';

type Props = {
  message: ChatMessage;
};

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <AppText color={isUser ? 'onPrimary' : 'ink'}>{message.text}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  assistantBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.sm,
    borderColor: colors.border,
    borderWidth: borders.width,
  },
  bubble: {
    borderRadius: radius.lg,
    maxWidth: '85%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
  },
  rowAssistant: {
    justifyContent: 'flex-start',
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.sm,
  },
});
