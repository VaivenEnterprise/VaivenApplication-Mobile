import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { IconBadge } from '@/components/ui/IconBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ListingSuggestion, SuggestionStatus } from '@/features/ai-suggestions/types';
import { es } from '@/i18n/es-MX';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.aiSuggestions;

type SuggestionBannerProps = {
  status: SuggestionStatus;
  suggestion: ListingSuggestion | null;
  /** Nombre de la categoría sugerida ya validada contra `GET /categories`; `null` si no aplica (P-02). */
  categoryLabel: string | null;
  /** `true` cuando «Usar» ya rellenó el formulario. */
  applied: boolean;
  onSuggest: () => void;
  onCancel: () => void;
  onUse: () => void;
  onEdit: () => void;
  onDismiss: () => void;
};

/**
 * Sugerencia de título y categoría con IA (spec 014 §7). Nunca se pide sola (RF-01): en reposo es un
 * botón con el aviso de privacidad; después, la tarjeta de carga, de resultado o el aviso de error.
 */
export function SuggestionBanner({
  status,
  suggestion,
  categoryLabel,
  applied,
  onSuggest,
  onCancel,
  onUse,
  onEdit,
  onDismiss,
}: SuggestionBannerProps) {
  if (status === 'loading') {
    return (
      <Card variant="muted" style={styles.card}>
        <View accessible accessibilityLiveRegion="polite" accessibilityState={{ busy: true }}>
          <AppText variant="label" color="muted">
            {t.loading}
          </AppText>
        </View>
        <Skeleton width="80%" />
        <Skeleton width="50%" />
        <View style={styles.cancel}>
          <Button label={t.cancel} variant="link" onPress={onCancel} />
        </View>
      </Card>
    );
  }

  if (status === 'success' && suggestion !== null) {
    const spoken =
      categoryLabel === null
        ? `${t.resultLabel}: ${suggestion.title}`
        : `${t.resultLabel}: ${suggestion.title}. ${t.categoryLabel}: ${categoryLabel}`;
    return (
      <Card variant="muted" style={[styles.card, styles.result]}>
        <View style={styles.header}>
          <IconBadge icon="sparkles" tone="secondary" />
          <AppText variant="label" color="muted" style={styles.headerText}>
            {t.title}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.dismiss}
            onPress={onDismiss}
            hitSlop={spacing.xs}
            style={styles.dismiss}
          >
            <AppIcon name="close" color="muted" />
          </Pressable>
        </View>
        <View
          accessible
          accessibilityLabel={spoken}
          accessibilityLiveRegion="polite"
          style={styles.body}
        >
          <AppText variant="bodyStrong">{suggestion.title}</AppText>
          {categoryLabel === null ? null : <Chip label={categoryLabel} />}
        </View>
        {applied ? (
          <View style={styles.applied}>
            <AppIcon name="success" size="sm" color="secondaryPressed" />
            <AppText variant="caption" color="muted" style={styles.headerText}>
              {t.applied}
            </AppText>
          </View>
        ) : (
          <View style={styles.actions}>
            <View style={styles.action}>
              <Button label={t.use} onPress={onUse} />
            </View>
            <View style={styles.action}>
              <Button label={t.edit} variant="outline" onPress={onEdit} />
            </View>
          </View>
        )}
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.notice}>
        <View style={styles.banner}>
          <Banner variant="warning" message={t.error} />
        </View>
        <Button label={es.common.retry} variant="link" onPress={onSuggest} />
      </View>
    );
  }

  if (status === 'limit') {
    return (
      <View style={styles.banner}>
        <Banner variant="info" message={t.limit} />
      </View>
    );
  }

  return (
    <View style={styles.idle}>
      <Button label={t.button} variant="outline" icon="sparkles" onPress={onSuggest} />
      <AppText variant="caption" color="muted">
        {t.notice}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  idle: { gap: spacing.xs },
  card: { gap: spacing.smd },
  result: { borderWidth: sizes.field.border, borderColor: colors.secondary },
  cancel: { alignItems: 'flex-start' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerText: { flex: 1 },
  dismiss: {
    width: sizes.touch.minSize,
    height: sizes.touch.minSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { gap: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
  applied: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  notice: { gap: spacing.xs, alignItems: 'flex-start' },
  banner: { alignSelf: 'stretch', borderRadius: radius.md, overflow: 'hidden' },
});
