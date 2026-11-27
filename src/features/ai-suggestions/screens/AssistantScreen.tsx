import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FormNotice } from '@/components/FormNotice';
import { TextField } from '@/components/TextField';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { IconBadge } from '@/components/ui/IconBadge';
import { Screen } from '@/components/ui/Screen';
import {
  ASSISTANT_MESSAGE_MAX,
  ASSISTANT_MESSAGE_MIN,
  type AssistantNeed,
  type AssistantReply,
} from '@/features/ai-suggestions/types';
import { assistantFailure, useAssistant } from '@/features/ai-suggestions/useAssistant';
import { ToolRow, WIDE_RADIUS_KM, type ToolQuery } from '@/features/project-guide';
import { useLocation } from '@/features/search';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.aiSuggestions.assistant;

/** Las coincidencias ya vienen del servidor: la fila no busca ni ofrece «Ampliar». */
function needQuery(need: AssistantNeed): ToolQuery {
  return {
    toolId: need.name,
    hit: need.matches[0] ?? null,
    radiusKm: WIDE_RADIUS_KM,
    isPending: false,
    isError: false,
    error: null,
    retry: () => undefined,
  };
}

function ReplyView({
  reply,
  located,
  onGet,
}: {
  reply: AssistantReply;
  located: boolean;
  onGet: (itemId: string) => void;
}) {
  return (
    <View style={styles.reply}>
      <AppText>{reply.summary}</AppText>

      {reply.needs.length === 0 ? null : (
        <View style={styles.section}>
          <AppText variant="subheading" accessibilityRole="header">
            {t.needs}
          </AppText>
          {reply.needs.map((need, index) => {
            const query = needQuery(need);
            return (
              <View key={`${need.name}-${index}`} style={styles.need}>
                <ToolRow
                  number={index + 1}
                  name={need.name}
                  query={query}
                  located={located}
                  selected={false}
                  requested={false}
                  onGet={() => {
                    if (query.hit) onGet(query.hit.id);
                  }}
                  onWiden={() => undefined}
                />
                {need.optional ? <Chip label={t.optional} /> : null}
              </View>
            );
          })}
        </View>
      )}

      {reply.steps.length === 0 ? null : (
        <View style={styles.section}>
          <AppText variant="subheading" accessibilityRole="header">
            {t.steps}
          </AppText>
          {reply.steps.map((step, index) => (
            <View key={`${index}-${step}`} style={styles.step}>
              <View style={styles.stepNumber}>
                <AppText variant="label" color="onPrimary">
                  {String(index + 1)}
                </AppText>
              </View>
              <AppText style={styles.stepText}>{step}</AppText>
            </View>
          ))}
        </View>
      )}

      {reply.safetyNotes.length === 0 ? null : (
        <Card variant="muted" style={styles.safety}>
          <View style={styles.safetyHead}>
            <AppIcon name="warning" size="sm" color="danger" />
            <AppText variant="label" color="danger">
              {t.safety}
            </AppText>
          </View>
          {reply.safetyNotes.map((note, index) => (
            <AppText key={`${index}-${note}`} variant="caption">
              {`• ${note}`}
            </AppText>
          ))}
        </Card>
      )}
    </View>
  );
}

/**
 * Asistente de proyectos (spec 021-T032, RF-30; backend 014 RF-09 a RF-16): la persona describe
 * qué quiere hacer y el servidor responde qué necesita, quién lo tiene cerca y los pasos. Solo se
 * envía lo escrito y, si ya dio permiso, su ubicación aproximada (que el servidor no manda a la IA).
 */
export function AssistantScreen() {
  const router = useRouter();
  const assistant = useAssistant();
  const location = useLocation();
  const [message, setMessage] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const trimmed = message.trim();
  const tooLong = trimmed.length > ASSISTANT_MESSAGE_MAX;
  const located = location.coords !== null;
  const hasTurns = assistant.turns.length > 0;

  const send = async () => {
    if (trimmed.length < ASSISTANT_MESSAGE_MIN) {
      setFieldError(t.tooShort);
      return;
    }
    if (tooLong) return;
    setFieldError(null);
    setNotice(null);
    // Sin diálogo: solo se usa la ubicación si la persona ya dio el permiso (Art. VIII.4).
    const coords =
      location.coords ?? (location.availability === 'available' ? await location.locate() : null);
    try {
      await assistant.send({ message: trimmed, location: coords });
      setMessage('');
    } catch (error) {
      const failure = assistantFailure(error);
      setFieldError(failure.field);
      setNotice(failure.notice);
    }
  };

  const restart = () => {
    assistant.restart();
    setMessage('');
    setFieldError(null);
    setNotice(null);
  };

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={es.common.back}
          onPress={() => router.back()}
          style={styles.back}
        >
          <AppIcon name="arrowBack" />
        </Pressable>
        <AppText variant="heading" accessibilityRole="header" style={styles.title}>
          {t.title}
        </AppText>
      </View>

      {hasTurns ? null : (
        <Card variant="muted" style={styles.intro}>
          <IconBadge icon="sparkles" />
          <AppText>{t.intro}</AppText>
        </Card>
      )}

      {assistant.turns.map((turn, index) => (
        <View key={index} style={styles.turn}>
          <View style={styles.question}>
            <AppText variant="caption" color="muted">
              {t.youAsked}
            </AppText>
            <AppText variant="bodyStrong">{turn.question}</AppText>
          </View>
          <ReplyView
            reply={turn.reply}
            located={located}
            onGet={(itemId) => router.push(routes.item(itemId))}
          />
        </View>
      ))}

      <View>
        <TextField
          label={hasTurns ? t.followUpLabel : t.messageLabel}
          value={message}
          onChangeText={(next) => {
            setMessage(next);
            setFieldError(null);
          }}
          placeholder={t.placeholder}
          multiline
          hint={t.privacy}
          error={tooLong ? t.tooLong : (fieldError ?? undefined)}
        />
        <AppText variant="caption" color={tooLong ? 'danger' : 'muted'} style={styles.counter}>
          {`${trimmed.length}/${ASSISTANT_MESSAGE_MAX} ${t.counter}`}
        </AppText>
      </View>

      {notice === null ? null : <FormNotice message={notice} />}

      <Button
        label={assistant.sending ? t.sending : t.send}
        loading={assistant.sending}
        disabled={tooLong}
        onPress={() => void send()}
      />
      {hasTurns ? <Button label={t.newConversation} variant="link" onPress={restart} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.smd },
  back: {
    width: sizes.touch.minSize,
    height: sizes.touch.minSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1 },
  intro: { gap: spacing.smd },
  turn: { gap: spacing.md },
  question: {
    alignSelf: 'flex-end',
    maxWidth: '90%',
    gap: spacing.xs,
    padding: spacing.smd,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
  reply: { gap: spacing.md },
  section: { gap: spacing.smd },
  need: { gap: spacing.xs },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.smd },
  stepNumber: {
    width: spacing.lg,
    height: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { flex: 1 },
  safety: { gap: spacing.xs },
  safetyHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  counter: { textAlign: 'right' },
});
