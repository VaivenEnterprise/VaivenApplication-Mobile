import { useRouter } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { AppText, Button, Screen } from '@/components/ui';
import { MessageBubble } from '@/features/chat/components/MessageBubble';
import { esMX as t } from '@/i18n/es-MX';
import type { ChatMessage } from '@/lib/domain/models';
import { borders, colors, radius, spacing, touch, typography } from '@/theme';

type SuggestionChipProps = {
  label: string;
  onPress: () => void;
};

function SuggestionChip({ label, onPress }: SuggestionChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}
    >
      <AppText variant="label" color="primary">
        {label}
      </AppText>
    </Pressable>
  );
}

export default function AssistantScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([...t.assistant.initialMessages]);
  const [draft, setDraft] = useState('');
  const nextId = useRef(1);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  function createId() {
    const id = `message-${nextId.current}`;
    nextId.current += 1;
    return id;
  }

  function goBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/prototipo');
  }

  function sendMessage(rawText: string) {
    const text = rawText.trim();

    if (!text) {
      return;
    }

    setMessages((current) => [
      ...current,
      { id: createId(), role: 'user', text },
      { id: createId(), role: 'assistant', text: t.assistant.mockReply },
    ]);
    setDraft('');
  }

  return (
    <Screen style={styles.content}>
      <Button label={t.common.back} variant="ghost" onPress={goBack} />

      <View style={styles.header}>
        <AppText variant="title">{t.assistant.title}</AppText>
        <AppText color="muted">{t.assistant.subtitle}</AppText>
      </View>

      <ScrollView
        contentContainerStyle={styles.messages}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd?.({ animated: true })}
        ref={scrollRef}
        style={styles.messageList}
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </ScrollView>

      <View style={styles.suggestions}>
        <AppText variant="caption" color="muted">
          {t.assistant.suggestionsTitle}
        </AppText>
        <ScrollView
          contentContainerStyle={styles.suggestionList}
          horizontal
          keyboardShouldPersistTaps="handled"
          showsHorizontalScrollIndicator={false}
        >
          {t.assistant.suggestions.map((suggestion) => (
            <SuggestionChip
              key={suggestion}
              label={suggestion}
              onPress={() => sendMessage(suggestion)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.composer}>
        <TextInput
          accessibilityLabel={t.assistant.placeholder}
          onChangeText={setDraft}
          onSubmitEditing={() => sendMessage(draft)}
          placeholder={t.assistant.placeholder}
          placeholderTextColor={colors.muted}
          returnKeyType="send"
          style={styles.input}
          value={draft}
        />
        <Button
          disabled={draft.trim().length === 0}
          label={t.assistant.send}
          onPress={() => sendMessage(draft)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  composer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  content: {
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: borders.width,
    color: colors.ink,
    flex: 1,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    minHeight: touch.minSize,
    paddingHorizontal: spacing.md,
  },
  messageList: {
    flex: 1,
  },
  messages: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  suggestion: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    justifyContent: 'center',
    minHeight: touch.minSize,
    paddingHorizontal: spacing.md,
  },
  suggestionList: {
    gap: spacing.sm,
  },
  suggestions: {
    gap: spacing.sm,
  },
});
