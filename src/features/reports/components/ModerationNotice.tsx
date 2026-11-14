import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { ReportSheet } from '@/features/reports/components/ReportSheet';
import { es } from '@/i18n/es-MX';
import type { ModerationRejection } from '@/lib/api/moderation';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.reports.moderation;

type ModerationNoticeProps = {
  rejection: ModerationRejection;
  /** Referencia del texto rechazado para reportar la decisión; por defecto, la de la petición. */
  decisionRef?: string;
  /** Si se pasa, el aviso lleva «X» para cerrarlo (el texto sigue en el campo). */
  onDismiss?: () => void;
};

/**
 * Aviso de que el filtro no dejó publicar un texto (spec 011 §7.5, RF-07): categoría, motivo del
 * servidor y «Reportar esta decisión», que la envía a revisión manual (`moderation_decision`).
 * Lo adoptan los formularios de texto con una línea.
 */
export function ModerationNotice({ rejection, decisionRef, onDismiss }: ModerationNoticeProps) {
  const [open, setOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const reference = decisionRef ?? rejection.requestId ?? 'sin-referencia';

  return (
    <View accessible={false} style={styles.card}>
      <View accessibilityRole="alert" accessible style={styles.head}>
        <AppIcon name="shield" size="md" color="danger" />
        <View style={styles.texts}>
          <AppText variant="label" color="danger">
            {t.title}
          </AppText>
          <Chip label={rejection.category ?? t.categoryFallback} />
          <AppText variant="caption" color="danger">
            {rejection.reason ?? t.reasonFallback}
          </AppText>
        </View>
        {onDismiss === undefined ? null : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={es.reports.moderation.dismiss}
            onPress={onDismiss}
            style={styles.close}
          >
            <AppIcon name="close" size="sm" color="danger" />
          </Pressable>
        )}
      </View>
      {reported ? (
        <AppText variant="caption" color="muted" accessibilityLiveRegion="polite">
          {t.reported}
        </AppText>
      ) : (
        <Button variant="link" label={t.reportDecision} onPress={() => setOpen(true)} />
      )}
      <ReportSheet
        visible={open}
        onClose={() => setOpen(false)}
        targetType="moderation_decision"
        targetId={reference}
        title={es.reports.sheet.decisionTitle}
        detailsHint={es.reports.sheet.decisionHint}
        fixedReason="other"
        onSent={() => setReported(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.smd,
    gap: spacing.xs,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  texts: { flex: 1, gap: spacing.xs },
  close: {
    width: sizes.touch.minSize,
    height: sizes.touch.minSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
