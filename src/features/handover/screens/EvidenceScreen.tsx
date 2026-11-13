import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { useBooking } from '@/features/bookings';
import { EvidenceForm } from '@/features/handover/components/EvidenceForm';
import { useSaveEvidence } from '@/features/handover/hooks';
import { stageRoles } from '@/features/handover/roles';
import { isConfirmed } from '@/features/handover/stageState';
import type { Stage, StageName } from '@/features/handover/types';
import { useEvidenceForm } from '@/features/handover/useEvidenceForm';
import { isStageConflict } from '@/features/handover/errors';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.handover.evidence;
const FIRST_OF_TWO = 0.5;

type EvidenceScreenProps = { bookingId: string; stage: StageName | null };

type FormBodyProps = {
  bookingId: string;
  stage: StageName;
  initial: Stage | null | undefined;
};

function FormBody({ bookingId, stage, initial }: FormBodyProps) {
  const router = useRouter();
  const form = useEvidenceForm(initial);
  const save = useSaveEvidence(bookingId, stage);
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setAttempted(true);
    if (form.problem !== null) return;
    setError(null);
    try {
      await save.mutateAsync(form.input());
      router.replace(routes.handoverQr(bookingId, stage));
    } catch (failure) {
      setError(isStageConflict(failure) ? t.saveConflict : t.saveFailed);
    }
  };

  return (
    <Screen
      scroll={false}
      footer={
        <Button
          label={form.problem === 'uploading' ? t.uploading : t.continue}
          loading={save.isPending}
          disabled={form.problem === 'uploading'}
          onPress={() => void submit()}
        />
      }
    >
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={es.handover.back}
          onPress={() => router.back()}
          style={styles.back}
        >
          <AppIcon name="arrowBack" />
        </Pressable>
        <AppText variant="heading" accessibilityRole="header">
          {t.title}
        </AppText>
      </View>
      <View style={styles.step}>
        <ProgressBar value={FIRST_OF_TWO} accessibilityLabel={t.stepA11y} />
        <AppText variant="caption" color="muted">
          {t.step}
        </AppText>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        {initial?.qr.state === 'active' ? (
          <AppText variant="caption" color="muted">
            {t.qrWillChange}
          </AppText>
        ) : null}
        <EvidenceForm form={form} showProblem={attempted} error={error} />
      </ScrollView>
    </Screen>
  );
}

/**
 * Evidencia del estado del objeto (spec 009 §7.2, RF-02). Solo quien registra en esta etapa la
 * ve; si la etapa ya se confirmó no se puede cambiar (el servidor responde 409).
 */
export function EvidenceScreen({ bookingId, stage }: EvidenceScreenProps) {
  const router = useRouter();
  const query = useBooking(bookingId);
  const booking = query.data;

  if (stage === null) {
    return (
      <Screen scroll={false}>
        <EmptyState
          icon="warning"
          title={t.invalidStageTitle}
          description={t.invalidStageDescription}
          actionLabel={t.notAllowedAction}
          onAction={() => router.replace(routes.booking(bookingId))}
        />
      </Screen>
    );
  }
  if (booking === undefined) {
    return (
      <Screen>
        {query.isError ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : (
          <LoadingState label={es.common.loading} />
        )}
      </Screen>
    );
  }

  const data = booking[stage];
  const allowed =
    stageRoles(stage, booking.viewerRole).canRecordEvidence &&
    !isConfirmed(booking.status, stage, data);
  if (!allowed) {
    return (
      <Screen scroll={false}>
        <EmptyState
          icon="lock"
          title={t.notAllowedTitle}
          description={t.notAllowedDescription}
          actionLabel={t.notAllowedAction}
          onAction={() => router.replace(routes.booking(bookingId))}
        />
      </Screen>
    );
  }

  return <FormBody bookingId={bookingId} stage={stage} initial={data} />;
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.smd },
  back: {
    width: sizes.touch.minSize,
    height: sizes.touch.minSize,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  step: { gap: spacing.xs, paddingVertical: spacing.sm },
  content: { gap: spacing.md, paddingBottom: spacing.md },
});
