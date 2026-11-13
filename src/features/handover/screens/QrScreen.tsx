import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { FormNotice } from '@/components/FormNotice';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { IconBadge } from '@/components/ui/IconBadge';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { bookingsKeys, useBooking } from '@/features/bookings';
import { QrDisplay } from '@/features/handover/components/QrDisplay';
import { isStageConflict } from '@/features/handover/errors';
import { useIssueQr, useStage } from '@/features/handover/hooks';
import { stageRoles } from '@/features/handover/roles';
import { isConfirmed } from '@/features/handover/stageState';
import type { StageName } from '@/features/handover/types';
import { useCountdown } from '@/features/handover/useCountdown';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.handover.qr;
/** Cada cuánto se pregunta si la otra persona ya escaneó (RF-12). */
const POLL_MS = 5000;

type QrScreenProps = { bookingId: string; stage: StageName | null };

function Done({ stage, onDone }: { stage: StageName; onDone: () => void }) {
  return (
    <View style={styles.done} accessibilityLiveRegion="polite">
      <IconBadge icon="success" tone="secondary" size="lg" />
      <AppText variant="heading" accessibilityRole="header">
        {stage === 'delivery' ? t.doneTitleDelivery : t.doneTitleReturn}
      </AppText>
      <AppText variant="body" color="muted">
        {t.doneHint}
      </AppText>
      <Button label={t.done} onPress={onDone} />
    </View>
  );
}

type ShowProps = { bookingId: string; stage: StageName; counterpart: string };

function Show({ bookingId, stage, counterpart }: ShowProps) {
  const router = useRouter();
  const client = useQueryClient();
  const issue = useIssueQr(bookingId, stage);
  const polled = useStage(bookingId, stage, { pollMs: POLL_MS });
  const [showCode, setShowCode] = useState(false);
  const started = useRef(false);

  // El código se genera una sola vez al abrir la pantalla; «Generar nuevo» lo repite a propósito.
  const { mutate } = issue;
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    mutate();
  }, [mutate]);

  const qr = issue.data;
  const countdown = useCountdown(qr?.expiresAt ?? null);
  const state = polled.data?.qr.state;
  const confirmedAt = polled.data?.confirmedAt ?? null;

  // La otra persona escaneó: la reserva cambió de estado, así que se vuelve a leer (RF-10, RF-12).
  useEffect(() => {
    if (confirmedAt !== null) void client.invalidateQueries({ queryKey: bookingsKeys.mine() });
    if (confirmedAt !== null)
      void client.invalidateQueries({ queryKey: bookingsKeys.detail(bookingId) });
  }, [client, bookingId, confirmedAt]);

  const goBooking = () => router.replace(routes.booking(bookingId));

  if (confirmedAt !== null || state === 'used') return <Done stage={stage} onDone={goBooking} />;

  return (
    <View style={styles.stack}>
      <AppText variant="heading" accessibilityRole="header" style={styles.centered}>
        {stage === 'delivery' ? t.titleDelivery : t.titleReturn}
      </AppText>
      {issue.isError ? (
        <View style={styles.stack}>
          <FormNotice message={isStageConflict(issue.error) ? t.failedConflict : t.failed} />
          {isStageConflict(issue.error) ? (
            <Button
              label={t.editEvidence}
              variant="outline"
              onPress={() => router.replace(routes.handoverEvidence(bookingId, stage))}
            />
          ) : (
            <Button label={es.common.retry} onPress={() => issue.mutate()} />
          )}
        </View>
      ) : qr === undefined || issue.isPending ? (
        <LoadingState label={t.generating} />
      ) : (
        <Card style={styles.card}>
          <QrDisplay
            payload={qr.qrPayload}
            countdown={countdown}
            forceExpired={state === 'expired'}
            onRegenerate={() => issue.mutate()}
            regenerating={issue.isPending}
          />
          <AppText variant="body" color="muted" style={styles.centered}>
            {`${t.askToScan} ${counterpart} ${t.askToScanEnd}`}
          </AppText>
          <Button
            label={showCode ? t.hideCode : t.showCode}
            variant="link"
            onPress={() => setShowCode((current) => !current)}
          />
          {showCode ? (
            <View style={styles.code}>
              <AppText variant="caption" color="muted">
                {t.codeHint}
              </AppText>
              <AppText variant="bodyStrong" selectable accessibilityLabel={qr.token}>
                {qr.token}
              </AppText>
            </View>
          ) : null}
        </Card>
      )}
    </View>
  );
}

/**
 * Mostrar el QR (spec 009 §7.3, RF-04, RF-12). Genera el código al abrir, lo guarda solo en
 * memoria, cuenta los 15 minutos y consulta cada 5 s si la otra persona ya lo escaneó. Sin
 * evidencia registrada no se genera nada: se pide registrarla primero.
 */
export function QrScreen({ bookingId, stage }: QrScreenProps) {
  const router = useRouter();
  const query = useBooking(bookingId);
  const booking = query.data;

  const back = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={es.handover.back}
      onPress={() => router.back()}
      style={styles.back}
    >
      <AppIcon name="arrowBack" />
    </Pressable>
  );
  const toBooking = () => router.replace(routes.booking(bookingId));

  if (stage === null) {
    return (
      <Screen scroll={false}>
        <EmptyState
          icon="warning"
          title={es.handover.evidence.invalidStageTitle}
          description={es.handover.evidence.invalidStageDescription}
          actionLabel={es.handover.evidence.notAllowedAction}
          onAction={toBooking}
        />
      </Screen>
    );
  }
  if (booking === undefined) {
    return (
      <Screen>
        {back}
        {query.isError ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : (
          <LoadingState label={es.common.loading} />
        )}
      </Screen>
    );
  }

  const data = booking[stage];
  const confirmed = isConfirmed(booking.status, stage, data);
  const counterpart = booking.viewerRole === 'owner' ? booking.requester : booking.owner;

  if (!stageRoles(stage, booking.viewerRole).canShowQr) {
    return (
      <Screen scroll={false}>
        <EmptyState
          icon="lock"
          title={es.handover.evidence.notAllowedTitle}
          description={es.handover.qr.notYours}
          actionLabel={es.handover.evidence.notAllowedAction}
          onAction={toBooking}
        />
      </Screen>
    );
  }
  if (!confirmed && (data?.recordedAt ?? null) === null) {
    return (
      <Screen scroll={false}>
        <EmptyState
          icon="camera"
          title={t.needsEvidenceTitle}
          description={t.failedConflict}
          actionLabel={t.editEvidence}
          onAction={() => router.replace(routes.handoverEvidence(bookingId, stage))}
        />
      </Screen>
    );
  }

  return (
    <Screen background="auth">
      {back}
      {confirmed ? (
        <Done stage={stage} onDone={toBooking} />
      ) : (
        <Show bookingId={bookingId} stage={stage} counterpart={counterpart.displayName} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: {
    width: sizes.touch.minSize,
    height: sizes.touch.minSize,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stack: { gap: spacing.md },
  centered: { textAlign: 'center' },
  card: { alignItems: 'center', gap: spacing.md },
  code: { alignItems: 'center', gap: spacing.xs },
  done: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xl },
});
