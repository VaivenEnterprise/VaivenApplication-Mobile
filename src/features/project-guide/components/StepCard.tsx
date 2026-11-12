import { StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { es } from '@/i18n/es-MX';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.bookings.guide;

export type Step = { readonly title: string; readonly text: string; readonly tip: string };

type StepCardProps = {
  index: number;
  step: Step;
  done: boolean;
  /** Primer paso sin completar: muestra el texto, la ilustración y el tip. */
  active: boolean;
  onToggle: () => void;
};

/**
 * Un paso del proyecto (spec 007 §7.1): *completado* (check, título tachado, «Listo»), *activo*
 * (número, texto y tip) o *pendiente*. «Ya lo hice» marca y «Deshacer» desmarca (RF-15).
 */
export function StepCard({ index, step, done, active, onToggle }: StepCardProps) {
  const circle = done ? styles.circleDone : active ? styles.circleActive : styles.circlePending;
  return (
    <View style={styles.card} testID={`step-${index + 1}`}>
      <View style={styles.head}>
        <View style={[styles.circle, circle]}>
          {done ? (
            <AppIcon name="check" size="sm" color="onPrimary" />
          ) : (
            <AppText variant="label" color={active ? 'onPrimary' : 'muted'}>
              {String(index + 1)}
            </AppText>
          )}
        </View>
        <AppText
          variant="bodyStrong"
          color={done ? 'muted' : 'ink'}
          style={[styles.title, done ? styles.struck : null]}
        >
          {step.title}
        </AppText>
        {done ? (
          <View style={styles.pill}>
            <AppText variant="eyebrow" color="secondaryPressed">
              {t.done}
            </AppText>
          </View>
        ) : null}
      </View>

      {active && !done ? (
        <>
          <AppText color="muted">{step.text}</AppText>
          <View
            style={styles.art}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <AppIcon name="construct" size="xl" color="muted" />
          </View>
          <View style={styles.tip}>
            <AppIcon name="info" size="sm" color="warning" />
            <AppText variant="caption" color="warning" style={styles.tipText}>
              {`${t.tip}: ${step.tip}`}
            </AppText>
          </View>
        </>
      ) : null}

      <Button
        label={done ? t.unmarkDone : t.markDone}
        accessibilityLabel={`${done ? t.unmarkDone : t.markDone}: ${step.title}`}
        variant="outline"
        onPress={onToggle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.smd,
    padding: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.smd },
  circle: {
    width: spacing.xl,
    height: spacing.xl,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: { backgroundColor: colors.secondary },
  circleActive: { backgroundColor: colors.primary },
  circlePending: { backgroundColor: colors.surfaceMuted },
  title: { flex: 1 },
  struck: { textDecorationLine: 'line-through' },
  pill: {
    paddingHorizontal: spacing.smd,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.secondarySoft,
  },
  art: {
    height: sizes.illustrationHeight,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tip: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.smd,
    borderRadius: radius.lg,
    backgroundColor: colors.warningSoft,
  },
  tipText: { flex: 1 },
});
