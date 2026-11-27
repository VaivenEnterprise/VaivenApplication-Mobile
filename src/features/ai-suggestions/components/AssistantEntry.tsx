import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { IconBadge } from '@/components/ui/IconBadge';
import { useAiSuggestionsEnabled } from '@/features/ai-suggestions/useListingSuggestion';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { sizes, spacing } from '@/theme';

const t = es.aiSuggestions.assistant;

/**
 * Acceso al asistente desde Inicio (spec 021-T032), por el *slot* `renderHeaderExtra`. Solo
 * aparece con `features.aiSuggestions` activo; si la IA está apagada, Inicio queda como antes.
 */
export function AssistantEntry() {
  const router = useRouter();
  const enabled = useAiSuggestionsEnabled();
  if (!enabled) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.entryTitle}
      accessibilityHint={t.entryBody}
      onPress={() => router.push(routes.assistant)}
      style={styles.touch}
    >
      <Card style={styles.card}>
        <IconBadge icon="sparkles" />
        <View style={styles.texts}>
          <AppText variant="bodyStrong">{t.entryTitle}</AppText>
          <AppText variant="caption" color="muted">
            {t.entryBody}
          </AppText>
        </View>
        <AppIcon name="chevronForward" color="muted" />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touch: { minHeight: sizes.touch.minSize },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.smd },
  texts: { flex: 1, gap: spacing.xs },
});
