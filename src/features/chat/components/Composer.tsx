import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { QuickReplies } from '@/features/chat/components/QuickReplies';
import { COUNTER_FROM, MESSAGE_MAX } from '@/features/chat/types';
import { es } from '@/i18n/es-MX';
import { colors, radius, sizes, spacing, typography } from '@/theme';

const t = es.chat.composer;

/** Texto que queda al elegir una respuesta rápida: rellena un campo vacío o agrega al final. */
export function withQuickReply(current: string, reply: string): string {
  const base = current.trim() === '' ? '' : `${current.trimEnd()} `;
  return `${base}${reply}`.slice(0, MESSAGE_MAX);
}

type ComposerProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  /** Hay un mensaje viajando: se bloquea el botón (RF-07). */
  sending: boolean;
};

/**
 * Parte baja del chat (spec 008 §7.2): respuestas rápidas, campo en píldora multilínea (hasta 4
 * líneas), contador a partir de 900 de 1,000 y botón circular de enviar, deshabilitado si el
 * texto está vacío (o solo espacios) o mientras se envía.
 */
export function Composer({ value, onChangeText, onSend, sending }: ComposerProps) {
  const empty = value.trim() === '';
  const blocked = empty || sending;
  const showCounter = value.length >= COUNTER_FROM;
  return (
    <View style={styles.root}>
      <QuickReplies onPick={(reply) => onChangeText(withQuickReply(value, reply))} />
      <View style={styles.bar}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          multiline
          maxLength={MESSAGE_MAX}
          placeholder={t.placeholder}
          placeholderTextColor={colors.placeholder}
          accessibilityLabel={t.fieldLabel}
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.send}
          accessibilityHint={sending ? t.sendingHint : undefined}
          accessibilityState={{ disabled: blocked }}
          disabled={blocked}
          onPress={onSend}
          style={[styles.send, blocked ? styles.sendOff : styles.sendOn]}
        >
          <AppIcon name="send" color={blocked ? 'muted' : 'onPrimary'} />
        </Pressable>
      </View>
      {showCounter ? (
        <AppText
          variant="caption"
          color={value.length >= MESSAGE_MAX ? 'danger' : 'muted'}
          style={styles.counter}
          accessibilityLiveRegion="polite"
        >
          {`${value.length} / ${MESSAGE_MAX} ${t.counter}`}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs, paddingBottom: spacing.sm },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.gutter,
  },
  input: {
    ...typography.body,
    flex: 1,
    minHeight: sizes.chat.sendButton,
    maxHeight: sizes.chat.inputMaxHeight,
    color: colors.ink,
    backgroundColor: colors.surface,
    borderWidth: sizes.field.border,
    borderColor: colors.fieldBorder,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.smd,
    paddingBottom: spacing.smd,
  },
  send: {
    width: sizes.chat.sendButton,
    height: sizes.chat.sendButton,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOn: { backgroundColor: colors.primary },
  sendOff: { backgroundColor: colors.surfaceMuted },
  counter: { alignSelf: 'flex-end', paddingHorizontal: spacing.gutter },
});
