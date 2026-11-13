import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import type { Countdown } from '@/features/handover/useCountdown';
import { es } from '@/i18n/es-MX';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.handover.qr;

type QrDisplayProps = {
  /** Texto que codifica el QR (`vaiven://qr?…`). Solo vive en memoria. */
  payload: string;
  countdown: Countdown;
  /** Se marca vencido aunque el reloj no lo diga (el servidor lo reemplazó o lo venció). */
  forceExpired?: boolean;
  onRegenerate: () => void;
  regenerating: boolean;
};

/** QR de 240 pt sobre blanco con temporizador; vencido se atenúa y ofrece «Generar nuevo» (CA-03). */
export function QrDisplay({
  payload,
  countdown,
  forceExpired = false,
  onRegenerate,
  regenerating,
}: QrDisplayProps) {
  const expired = forceExpired || countdown.expired;
  return (
    <View style={styles.root}>
      <View style={styles.frame}>
        <QRCode
          value={payload}
          size={sizes.qr}
          color={colors.ink}
          backgroundColor={colors.surface}
        />
        {expired ? (
          <View style={styles.veil} accessibilityLabel={t.expiredHint}>
            <AppIcon name="clock" size="xl" color="onPrimary" />
            <AppText variant="bodyStrong" color="onPrimary">
              {t.expired}
            </AppText>
          </View>
        ) : null}
      </View>
      {expired ? (
        <>
          <AppText variant="caption" color="muted">
            {t.expiredHint}
          </AppText>
          <Button
            label={t.regenerate}
            loading={regenerating}
            variant="secondary"
            onPress={onRegenerate}
          />
        </>
      ) : (
        <View accessible accessibilityLabel={`${t.timerA11y}: ${countdown.clock}`}>
          <Chip
            label={countdown.clock}
            icon="clock"
            variant={countdown.urgent ? 'warning' : 'neutral'}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: spacing.md },
  frame: {
    width: sizes.qr + spacing.lg * 2,
    height: sizes.qr + spacing.lg * 2,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  veil: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.xl,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
