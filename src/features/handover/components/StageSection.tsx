import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip, type ChipVariant } from '@/components/ui/Chip';
import type { Booking } from '@/features/bookings';
import {
  activeStage,
  isConfirmed,
  stageAction,
  type StageAction,
} from '@/features/handover/stageState';
import { STAGE_NAMES, type StageName } from '@/features/handover/types';
import { es } from '@/i18n/es-MX';
import { formatDateTime } from '@/lib/format/date';
import { routes } from '@/lib/routes';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.handover;

/** La sección solo existe con la reserva aceptada, en curso o concluida (RF-01). */
export const HANDOVER_STATUSES: readonly Booking['status'][] = [
  'accepted',
  'in_progress',
  'completed',
];

type StepState = 'done' | 'now' | 'next';

const CHIP: Record<
  Exclude<StageAction, 'none' | 'wait'>,
  { label: string; variant: ChipVariant; button: string; route: typeof routes.handoverQr }
> = {
  record: {
    label: t.chip.needsEvidence,
    variant: 'warning',
    button: t.action.record,
    route: routes.handoverEvidence,
  },
  showQr: {
    label: t.chip.readyToShow,
    variant: 'neutral',
    button: t.action.showQr,
    route: routes.handoverQr,
  },
  scan: {
    label: t.chip.readyToScan,
    variant: 'neutral',
    button: t.action.scan,
    route: routes.handoverScan,
  },
};

type StepProps = { stage: StageName; state: StepState; confirmedAt: string | null };

function Step({ stage, state, confirmedAt }: StepProps) {
  const name = t.section[stage];
  const status = { done: t.section.stepDone, now: t.section.stepNow, next: t.section.stepNext }[
    state
  ];
  const date = state === 'done' && confirmedAt ? formatDateTime(confirmedAt) : '';
  return (
    <View
      accessible
      accessibilityLabel={`${name}, ${status}${date ? `. ${t.section.confirmedOn} ${date}` : ''}`}
      style={styles.step}
    >
      <View
        style={[styles.dot, state === 'done' && styles.dotDone, state === 'now' && styles.dotNow]}
      >
        {state === 'done' ? <AppIcon name="check" size="sm" color="onPrimary" /> : null}
      </View>
      <AppText variant="label" color={state === 'next' ? 'muted' : 'ink'}>
        {name}
      </AppText>
    </View>
  );
}

/**
 * Sección «Entrega y devolución» del detalle de la reserva (spec 009 §7.1, RF-01, RF-03): un
 * rastreador de dos etapas y la única acción que le toca a esta persona ahora. Se registra en el
 * *slot* `deliveryAndPayments` de 007 (plan P-06).
 */
export function StageSection({ booking }: { booking: Booking }) {
  const router = useRouter();
  if (!HANDOVER_STATUSES.includes(booking.status)) return null;

  const current = activeStage(booking.status);
  const confirmed = Object.fromEntries(
    STAGE_NAMES.map((stage) => [stage, isConfirmed(booking.status, stage, booking[stage])]),
  ) as Record<StageName, boolean>;
  const stateOf = (stage: StageName): StepState =>
    confirmed[stage] ? 'done' : stage === current ? 'now' : 'next';

  const counterpart = booking.viewerRole === 'owner' ? booking.requester : booking.owner;
  const action =
    current === null
      ? 'none'
      : stageAction(current, booking.viewerRole, booking[current], confirmed[current]);

  const open = (route: typeof routes.handoverQr) => {
    if (current !== null) router.push(route(booking.id, current));
  };

  return (
    <Card style={styles.card}>
      <AppText variant="heading" accessibilityRole="header">
        {t.section.title}
      </AppText>
      <View style={styles.tracker}>
        <Step
          stage="delivery"
          state={stateOf('delivery')}
          confirmedAt={booking.delivery?.confirmedAt ?? null}
        />
        <View style={[styles.line, confirmed.delivery && styles.lineDone]} />
        <Step
          stage="return"
          state={stateOf('return')}
          confirmedAt={booking.return?.confirmedAt ?? null}
        />
      </View>

      {action === 'record' || action === 'showQr' || action === 'scan' ? (
        <View style={styles.action}>
          <Chip label={CHIP[action].label} variant={CHIP[action].variant} />
          <Button label={CHIP[action].button} onPress={() => open(CHIP[action].route)} />
          {action === 'showQr' ? (
            <Button
              label={t.action.edit}
              variant="link"
              onPress={() => open(routes.handoverEvidence)}
            />
          ) : null}
        </View>
      ) : null}

      {action === 'wait' ? (
        <View style={styles.wait}>
          <AppIcon name="clock" size="sm" color="muted" />
          <AppText variant="caption" color="muted" style={styles.waitText}>
            {`${t.section.waitingFor} ${counterpart.displayName}`}
          </AppText>
        </View>
      ) : null}

      {current === null && booking.status === 'completed' ? (
        <Chip label={t.chip.confirmed} variant="success" icon="success" />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  tracker: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  step: { alignItems: 'center', gap: spacing.xs },
  dot: {
    width: sizes.stepDot,
    height: sizes.stepDot,
    borderRadius: radius.pill,
    borderWidth: sizes.stepLine,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { borderColor: colors.secondary, backgroundColor: colors.secondary },
  dotNow: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  line: { flex: 1, height: sizes.stepLine, backgroundColor: colors.border },
  lineDone: { backgroundColor: colors.secondary },
  action: { gap: spacing.sm },
  wait: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  waitText: { flex: 1 },
});
