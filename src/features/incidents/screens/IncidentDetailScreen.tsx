import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { BackButton } from '@/features/incidents/components/BackButton';
import { IncidentStatusChip } from '@/features/incidents/components/IncidentCard';
import { REASON_ICON } from '@/features/incidents/components/ReasonPicker';
import { useIncident } from '@/features/incidents/hooks';
import { stepStates, type IncidentStep, type StepState } from '@/features/incidents/rules';
import type { Incident } from '@/features/incidents/types';
import { RemoteImage, type RemoteImageData } from '@/features/images';
import { es } from '@/i18n/es-MX';
import { ApiError } from '@/lib/api/errors';
import { formatDate, formatDateTime } from '@/lib/format/date';
import { routes } from '@/lib/routes';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.incidents.detail;

const STEPS: readonly IncidentStep[] = ['sent', 'review', 'closed'];
const STATE_TEXT: Record<StepState, string> = {
  done: t.stepDone,
  now: t.stepNow,
  next: t.stepNext,
};

/** Línea de tres puntos «Enviado · En revisión · Cerrado» (spec 010 §7.4). */
function Steps({ status }: { status: Incident['status'] }) {
  const states = stepStates(status);
  return (
    <View accessible accessibilityLabel={t.stepsA11y} style={styles.steps}>
      {STEPS.map((step) => {
        const state = states[step];
        return (
          <View
            key={step}
            accessible
            accessibilityLabel={`${t.steps[step]}, ${STATE_TEXT[state]}`}
            style={styles.step}
          >
            <View style={[styles.dot, state === 'next' ? styles.dotNext : styles.dotOn]}>
              {state === 'done' ? <AppIcon name="check" size="sm" color="onPrimary" /> : null}
            </View>
            <AppText
              variant="caption"
              color={state === 'next' ? 'muted' : 'ink'}
              style={styles.stepLabel}
            >
              {t.steps[step]}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

/** Detalle de una incidencia (spec 010 §7.4, RF-07, CA-05): estado, motivo, evidencia, notas y respuesta final. */
export function IncidentDetailScreen({ id }: { id: string }) {
  const router = useRouter();
  const query = useIncident(id);
  const [zoomed, setZoomed] = useState<RemoteImageData | null>(null);
  const incident = query.data;

  if (incident === undefined) {
    const notFound = query.isError && query.error instanceof ApiError && query.error.status === 404;
    return (
      <Screen>
        <BackButton onPress={() => router.back()} />
        {query.isPending ? (
          <LoadingState variant="card" label={es.common.loading} />
        ) : notFound ? (
          <EmptyState
            icon="shield"
            title={t.notFoundTitle}
            description={t.notFoundDescription}
            actionLabel={t.notFoundAction}
            onAction={() => router.back()}
          />
        ) : (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        )}
      </Screen>
    );
  }

  const reason = es.incidents.reasons[incident.reason];
  const final = incident.finalResponse;

  return (
    <Screen>
      <BackButton onPress={() => router.back()} />
      <View style={styles.head}>
        <AppText variant="title" accessibilityRole="header">
          {t.title}
        </AppText>
        <IncidentStatusChip status={incident.status} />
      </View>
      <Steps status={incident.status} />

      <Card style={styles.card}>
        <View style={styles.reasonLine}>
          <AppIcon name={REASON_ICON[incident.reason]} color="primaryInk" />
          <AppText variant="subheading" accessibilityRole="header" style={styles.reasonName}>
            {reason.name}
          </AppText>
        </View>
        <AppText>{incident.description}</AppText>
        <AppText variant="caption" color="muted">
          {`${t.sentOn} ${formatDate(incident.createdAt)}`}
        </AppText>
      </Card>

      {incident.evidence.length === 0 ? null : (
        <View style={styles.section}>
          <AppText variant="label" color="muted">
            {t.evidence}
          </AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbs}
          >
            {incident.evidence.map((photo, index) => (
              <Pressable
                key={photo.publicId}
                accessibilityRole="imagebutton"
                accessibilityLabel={`${t.evidenceItem} ${index + 1}`}
                onPress={() => setZoomed(photo)}
              >
                <RemoteImage image={photo} evidence style={styles.thumb} />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {incident.notes.length === 0 ? null : (
        <View style={styles.section}>
          <AppText variant="label" color="muted">
            {t.notes}
          </AppText>
          {incident.notes.map((note) => (
            <Card key={`${note.at}-${note.text}`} variant="muted" style={styles.note}>
              <AppText>{note.text}</AppText>
              <AppText variant="caption" color="muted">
                {formatDateTime(note.at)}
              </AppText>
            </Card>
          ))}
        </View>
      )}

      {final === null ? null : (
        <Card style={[styles.card, styles.final]}>
          <AppText variant="subheading" accessibilityRole="header" color="secondaryPressed">
            {t.finalResponse}
          </AppText>
          <AppText>{final.text}</AppText>
          <AppText variant="caption" color="secondaryPressed">
            {t.outcome[final.outcome]}
          </AppText>
          <AppText variant="caption" color="muted">
            {`${t.closedOn} ${formatDate(final.at)}`}
          </AppText>
        </Card>
      )}

      <Button
        label={t.openBooking}
        variant="outline"
        onPress={() => router.push(routes.booking(incident.bookingId))}
      />

      <BottomSheet visible={zoomed !== null} onClose={() => setZoomed(null)} title={t.evidence}>
        <RemoteImage
          image={zoomed}
          variant="full"
          evidence
          accessibilityLabel={t.evidenceItem}
          style={styles.zoom}
        />
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: spacing.sm },
  steps: { flexDirection: 'row', justifyContent: 'space-between' },
  step: { flex: 1, alignItems: 'center', gap: spacing.xs },
  stepLabel: { textAlign: 'center' },
  dot: {
    width: sizes.stepDot,
    height: sizes.stepDot,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotOn: { backgroundColor: colors.secondary },
  dotNext: { backgroundColor: colors.border },
  card: { gap: spacing.sm },
  reasonLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reasonName: { flex: 1 },
  section: { gap: spacing.sm },
  thumbs: { gap: spacing.sm },
  thumb: { width: sizes.photoSlot, height: sizes.photoSlot, borderRadius: radius.md },
  note: { gap: spacing.xs, padding: spacing.md },
  final: { backgroundColor: colors.secondarySoft },
  zoom: { width: '100%', aspectRatio: 1, borderRadius: radius.md },
});
